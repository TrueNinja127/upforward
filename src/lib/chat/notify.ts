import "server-only";
import { after } from "next/server";
import { adminNewApplicationEmail, adminUnreadEmail, applicantUnreadEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { getJob } from "@/lib/jobs";
import { site } from "@/lib/site";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ConversationRow, MessageSender } from "@/lib/supabase/types";
import { createLoginToken } from "./tokens";

/*
 * Email notifications for unread messages.
 *
 * When a message is stored we wait a short grace period (so someone who is
 * already in the chat and reads it immediately gets nothing), then re-check.
 * If messages from that sender are still unread and the recipient has not been
 * emailed since they last read the conversation, we send one email. Reading the
 * conversation resets the marker, so each unread streak produces one email.
 */

const DELAY_MS = Math.max(0, Number(process.env.UNREAD_NOTIFY_DELAY_SECONDS ?? 20)) * 1000;

function adminEmail(): string | undefined {
  return process.env.ADMIN_NOTIFICATION_EMAIL || undefined;
}

/** Schedules the unread check to run after the current response is sent. */
export function scheduleUnreadNotification(conversationId: string, sender: MessageSender) {
  if (!isEmailConfigured()) return;
  if (sender === "applicant" && !adminEmail()) return;
  after(async () => {
    try {
      if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
      await notifyIfStillUnread(conversationId, sender);
    } catch (err) {
      console.error("[notify] unread check failed", err);
    }
  });
}

async function notifyIfStillUnread(conversationId: string, sender: MessageSender) {
  const db = supabaseAdmin();
  const recipientColumn = sender === "admin" ? "applicant_notified_at" : "admin_notified_at";
  const now = new Date().toISOString();
  const claim: Partial<ConversationRow> =
    sender === "admin" ? { applicant_notified_at: now } : { admin_notified_at: now };

  const { data: conversation } = await db
    .from("conversations")
    .select("id, application_id, applicant_notified_at, admin_notified_at")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return;
  if (conversation[recipientColumn]) return; // already emailed for this unread streak

  const { data: unread } = await db
    .from("messages")
    .select("body, created_at")
    .eq("conversation_id", conversationId)
    .eq("sender", sender)
    .is("read_at", null)
    .order("created_at", { ascending: false });
  if (!unread?.length) return;

  const { data: application } = await db
    .from("applications")
    .select("id, name, email, phone, location, role")
    .eq("id", conversation.application_id)
    .maybeSingle();
  if (!application) return;

  // Claim the slot first so concurrent checks don't double-send.
  const { data: claimed } = await db
    .from("conversations")
    .update(claim)
    .eq("id", conversationId)
    .is(recipientColumn, null)
    .select("id");
  if (!claimed?.length) return;

  const preview = unread[0].body.length > 280 ? `${unread[0].body.slice(0, 277)}…` : unread[0].body;
  const roleTitle = getJob(application.role)?.title ?? application.role;

  if (sender === "admin") {
    const token = await createLoginToken(application.id, "notification");
    const url = `${site.url}/chat/verify?token=${encodeURIComponent(token)}`;
    await sendEmail(applicantUnreadEmail({ to: application.email, name: application.name, preview, count: unread.length, url }));
  } else {
    const to = adminEmail();
    if (!to) return;
    const url = `${site.url}/admin/conversations/${conversationId}`;
    await sendEmail(adminUnreadEmail({ to, applicantName: application.name, role: roleTitle, preview, count: unread.length, url }));
  }
}

/** Clears the "already emailed" marker once the recipient has read the conversation. */
export async function resetNotificationMarker(conversationId: string, reader: MessageSender) {
  const reset: Partial<ConversationRow> =
    reader === "applicant" ? { applicant_notified_at: null } : { admin_notified_at: null };
  await supabaseAdmin().from("conversations").update(reset).eq("id", conversationId);
}

/** Emails the admin about a brand-new application (runs after the response). */
export function scheduleNewApplicationNotification(input: {
  conversationId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
}) {
  const to = adminEmail();
  if (!to || !isEmailConfigured()) return;
  after(async () => {
    try {
      await sendEmail(
        adminNewApplicationEmail({
          to,
          name: input.name,
          role: getJob(input.role)?.title ?? input.role,
          email: input.email,
          phone: input.phone,
          location: input.location,
          url: `${site.url}/admin/conversations/${input.conversationId}`,
        })
      );
    } catch (err) {
      console.error("[notify] new application email failed", err);
    }
  });
}
