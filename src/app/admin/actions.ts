"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeEqual } from "@/lib/crypto";
import { createMessage, listMessages, markRead, updateApplicationStatus } from "@/lib/chat/dal";
import { clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/session";
import type { ApplicationStatus, MessageRow } from "@/lib/supabase/types";
import type { SendResult } from "@/app/chat/actions";

export type LoginState = { error?: string };

const STATUSES: ApplicationStatus[] = ["new", "in_review", "interview", "hired", "declined"];

export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { error: "ADMIN_PASSWORD is not set on the server. Add it to your environment (see .env.example)." };
  }
  const password = formData.get("password");
  if (typeof password !== "string" || !(await safeEqual(password, expected))) {
    // Slow down brute force a little.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Incorrect password." };
  }
  await setAdminCookie();
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/admin") ? next : "/admin");
}

export async function adminLogout(): Promise<void> {
  await clearAdminCookie();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Your admin session has expired. Please sign in again.");
}

export async function adminSendMessage(conversationId: string, body: string): Promise<SendResult> {
  const trimmed = typeof body === "string" ? body.trim() : "";
  if (!trimmed) return { error: "Message can't be empty." };
  if (trimmed.length > 4000) return { error: "Message is too long (4000 characters max)." };
  try {
    await requireAdmin();
    const message = await createMessage(conversationId, "admin", trimmed);
    return { message };
  } catch (err) {
    console.error("[chat] admin send failed", err);
    return { error: err instanceof Error ? err.message : "Could not send your message." };
  }
}

export async function adminMarkRead(conversationId: string): Promise<void> {
  try {
    await requireAdmin();
    await markRead(conversationId, "admin");
  } catch (err) {
    console.error("[chat] admin markRead failed", err);
  }
}

export async function adminSyncMessages(conversationId: string, after: string | null): Promise<MessageRow[]> {
  try {
    await requireAdmin();
    const all = await listMessages(conversationId);
    return after ? all.filter((m) => m.created_at > after) : all;
  } catch (err) {
    console.error("[chat] admin sync failed", err);
    return [];
  }
}

export async function adminSetStatus(applicationId: string, status: string): Promise<{ error?: string }> {
  if (!STATUSES.includes(status as ApplicationStatus)) return { error: "Unknown status." };
  try {
    await requireAdmin();
    await updateApplicationStatus(applicationId, status as ApplicationStatus);
    revalidatePath("/admin", "layout");
    return {};
  } catch (err) {
    console.error("[admin] status update failed", err);
    return { error: err instanceof Error ? err.message : "Could not update status." };
  }
}
