import "server-only";
import { after } from "next/server";
import { adminNewApplicationEmail, adminUnreadEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ApplicationRow, ConversationRow, JobRow, MessageSender } from "@/lib/supabase/types";
import { pushToAdmins } from "@/lib/push";
import { createPanelNotification, logPanelActivity, publishPanelEvent } from "./panel";

/*
 * Telling the team about applicants.
 *
 * Everything the applicant does is pushed into the admin panel immediately
 * (live refresh, notification bell, activity feed). Email is the fallback for
 * when nobody is looking at the panel: a new application is emailed right
 * away; an applicant message is emailed only if it is still unread after a
 * short grace period and the team has not been emailed since they last read
 * the conversation. Reading the chat in the panel resets that marker, so each
 * unread streak produces exactly one email. The mirror image (the panel
 * emailing the applicant about unread replies) lives in the admin panel.
 */

const DELAY_MS = Math.max(0, Number(process.env.UNREAD_NOTIFY_DELAY_SECONDS ?? 20)) * 1000;

const adminEmail = () => process.env.ADMIN_NOTIFICATION_EMAIL || undefined;
const applicantLink = (applicationId: string) => `${site.adminUrl}/applicants/${applicationId}`;

/** New application: panel notification + activity, live refresh, optional email. */
export async function notifyPanelOfApplication(input: { application: ApplicationRow; job: JobRow; conversationId: string }): Promise<void> {
  const { application, job, conversationId } = input;
  const link = applicantLink(application.id);
  try {
    await Promise.all([
      logPanelActivity("applicant.applied", `${application.name} applied for ${job.title}`, { applicationId: application.id, conversationId }),
      createPanelNotification({
        type: "contact",
        title: `New application: ${application.name} · ${job.title}`,
        body: `${application.location} · ${application.email}`,
        link,
      }),
    ]);
    await publishPanelEvent({ kind: "applicants", conversationId, applicationId: application.id });
  } catch (err) {
    console.error("[notify] panel update failed", err);
  }
  after(() =>
    pushToAdmins({ title: `New application: ${application.name}`, body: `${job.title} · ${application.location}`, url: link, tag: `application-${application.id}` }).catch((err) =>
      console.error("[push] admin push failed", err)
    )
  );

  const to = adminEmail();
  if (!to || !isEmailConfigured()) return;
  after(async () => {
    try {
      await sendEmail(
        adminNewApplicationEmail({
          to,
          name: application.name,
          role: job.title,
          email: application.email,
          phone: application.phone,
          location: application.location,
          url: link,
        })
      );
    } catch (err) {
      console.error("[notify] new application email failed", err);
    }
  });
}

/** Applicant message: live refresh + panel notification + activity, then an email if it stays unread. */
export async function notifyPanelOfApplicantMessage(input: {
  application: ApplicationRow;
  job: JobRow | null;
  conversation: ConversationRow;
  body: string;
}): Promise<void> {
  const { application, job, conversation, body } = input;
  const link = applicantLink(application.id);
  try {
    await Promise.all([
      publishPanelEvent({ kind: "applicants", conversationId: conversation.id, applicationId: application.id }),
      logPanelActivity("applicant.in", `${application.name} sent a message`, { applicationId: application.id, conversationId: conversation.id }),
      createPanelNotification({
        type: "message",
        title: `New message from ${application.name}${job ? ` (${job.title})` : ""}`,
        body: body.replace(/\s+/g, " ").slice(0, 160),
        link,
      }),
    ]);
  } catch (err) {
    console.error("[notify] panel update failed", err);
  }
  after(() =>
    pushToAdmins({
      title: `${application.name}${job ? ` · ${job.title}` : ""}`,
      body: body.replace(/\s+/g, " ").slice(0, 160),
      url: link,
      tag: `conversation-${conversation.id}`,
      skipIfFocused: true,
    }).catch((err) => console.error("[push] admin push failed", err))
  );
  scheduleAdminUnreadEmail(conversation.id);
}

/** Schedules the unread check to run after the current response is sent. */
function scheduleAdminUnreadEmail(conversationId: string) {
  if (!isEmailConfigured() || !adminEmail()) return;
  after(async () => {
    try {
      if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
      await emailAdminIfStillUnread(conversationId);
    } catch (err) {
      console.error("[notify] unread check failed", err);
    }
  });
}

async function emailAdminIfStillUnread(conversationId: string) {
  const to = adminEmail();
  if (!to) return;
  const db = supabaseAdmin();

  const { data: conversation } = await db
    .from("applicant_conversations")
    .select("id, application_id, admin_notified_at")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation || conversation.admin_notified_at) return; // already emailed for this unread streak

  const { data: unread } = await db
    .from("applicant_messages")
    .select("body, created_at")
    .eq("conversation_id", conversationId)
    .eq("sender", "applicant")
    .is("read_at", null)
    .order("created_at", { ascending: false });
  if (!unread?.length) return;

  const { data: application } = await db.from("job_applications").select("id, name, job_id").eq("id", conversation.application_id).maybeSingle();
  if (!application) return;
  const { data: job } = await db.from("jobs").select("title").eq("id", application.job_id).maybeSingle();

  // Claim the slot first so concurrent checks don't double-send.
  const { data: claimed } = await db
    .from("applicant_conversations")
    .update({ admin_notified_at: new Date().toISOString() })
    .eq("id", conversationId)
    .is("admin_notified_at", null)
    .select("id");
  if (!claimed?.length) return;

  const latest = unread[0].body;
  const preview = latest.length > 280 ? `${latest.slice(0, 277)}…` : latest;
  await sendEmail(
    adminUnreadEmail({
      to,
      applicantName: application.name,
      role: job?.title ?? "Applicant",
      preview,
      count: unread.length,
      url: applicantLink(application.id),
    })
  );
}

/** Clears the "already emailed" marker once the recipient has read the conversation. */
export async function resetNotificationMarker(conversationId: string, reader: MessageSender) {
  const reset: Partial<ConversationRow> = reader === "applicant" ? { applicant_notified_at: null } : { admin_notified_at: null };
  await supabaseAdmin().from("applicant_conversations").update(reset).eq("id", conversationId);
}
