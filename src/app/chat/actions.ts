"use server";

import { redirect } from "next/navigation";
import { createMessage, getApplicantContext, listMessages, markRead } from "@/lib/chat/dal";
import { consumeLoginToken, createLoginToken, deleteApplicantSession, findApplicationByEmail, recentlyIssuedLoginLink } from "@/lib/chat/tokens";
import { chatSignInEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { applicantTokenHash, clearApplicantCookie, setApplicantCookie } from "@/lib/session";
import { site } from "@/lib/site";
import type { MessageRow } from "@/lib/supabase/types";

export type SendResult = { message: MessageRow } | { error: string };

async function requireApplicant() {
  const ctx = await getApplicantContext();
  if (!ctx) throw new Error("Your session has expired. Please sign in again with your email.");
  return ctx;
}

/* Messaging ------------------------------------------------------------------- */

export async function sendApplicantMessage(body: string): Promise<SendResult> {
  const trimmed = typeof body === "string" ? body.trim() : "";
  if (!trimmed) return { error: "Message can't be empty." };
  if (trimmed.length > 4000) return { error: "Message is too long (4000 characters max)." };
  try {
    const ctx = await requireApplicant();
    const message = await createMessage(ctx, "applicant", trimmed);
    return { message };
  } catch (err) {
    console.error("[chat] applicant send failed", err);
    return { error: err instanceof Error ? err.message : "Could not send your message." };
  }
}

export async function markApplicantRead(): Promise<void> {
  try {
    const { conversation } = await requireApplicant();
    await markRead(conversation, "applicant");
  } catch (err) {
    console.error("[chat] applicant markRead failed", err);
  }
}

/** Returns messages created after `after` (ISO timestamp), used to catch up after a disconnect. */
export async function syncApplicantMessages(after: string | null): Promise<MessageRow[]> {
  try {
    const { conversation } = await requireApplicant();
    const all = await listMessages(conversation.id);
    return after ? all.filter((m) => m.created_at > after) : all;
  } catch (err) {
    console.error("[chat] applicant sync failed", err);
    return [];
  }
}

/* Sign in by email -------------------------------------------------------------- */

export type SignInState = { error?: string; sent?: boolean; email?: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Step 1: look the email up and send a one-time link if an application exists. */
export async function requestChatLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase().slice(0, 200) : "";
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address.", email };

  try {
    const application = await findApplicationByEmail(email);
    if (!application) {
      return { error: "We couldn't find an application with that email. Check the spelling, or apply for a role to start a chat.", email };
    }
    if (!isEmailConfigured()) {
      return { error: "Email sign-in isn't available right now. Please contact us at " + site.email + ".", email };
    }
    if (await recentlyIssuedLoginLink(application.id)) {
      return { sent: true, email };
    }
    const token = await createLoginToken(application.id, "login");
    const url = `${site.url}/chat/verify?token=${encodeURIComponent(token)}`;
    const result = await sendEmail(chatSignInEmail({ to: application.email, name: application.name, url }));
    if (!result.ok) return { error: "We couldn't send the email right now. Please try again in a moment.", email };
    return { sent: true, email };
  } catch (err) {
    console.error("[chat] sign-in link failed", err);
    return { error: "Something went wrong. Please try again in a moment.", email };
  }
}

/** Step 2: the applicant clicked the link and pressed the button on /chat/verify. */
export async function completeChatSignIn(formData: FormData): Promise<void> {
  const token = formData.get("token");
  const result = await consumeLoginToken(typeof token === "string" ? token : undefined);
  if (!result.ok || !result.sessionToken) {
    redirect(`/chat?link=${result.ok ? "invalid" : result.reason}`);
  }
  await setApplicantCookie(result.sessionToken);
  redirect("/chat");
}

export async function signOutApplicant(): Promise<void> {
  const hash = await applicantTokenHash();
  if (hash) await deleteApplicantSession(hash).catch((err) => console.error("[chat] sign out failed", err));
  await clearApplicantCookie();
  redirect("/chat");
}
