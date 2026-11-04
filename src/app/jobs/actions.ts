"use server";

import { redirect } from "next/navigation";
import { createMessage } from "@/lib/chat/dal";
import { notifyPanelOfApplication } from "@/lib/chat/notify";
import { createApplicantSession } from "@/lib/chat/tokens";
import { getOpenJob } from "@/lib/jobs-db";
import { setApplicantCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ApplyFieldErrors = Partial<
  Record<"name" | "email" | "phone" | "location" | "role" | "citizen" | "laptop" | "remote", string>
>;

export type ApplyState = {
  error?: string;
  fieldErrors?: ApplyFieldErrors;
  values?: { name: string; email: string; phone: string; location: string };
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[+()\d\s.-]{7,32}$/;
const SLUG_RE = /^[a-z0-9-]{1,60}$/;

function text(formData: FormData, key: string, max = 200): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  // Honeypot: real users never see or fill this field.
  if (text(formData, "website")) redirect("/");

  const values = {
    name: text(formData, "name", 120),
    email: text(formData, "email", 200).toLowerCase(),
    phone: text(formData, "phone", 32),
    location: text(formData, "location", 160),
  };
  const role = text(formData, "role", 60);
  const job = SLUG_RE.test(role) ? await getOpenJob(role) : null;

  const fieldErrors: ApplyFieldErrors = {};
  if (values.name.length < 2) fieldErrors.name = "Please enter your full name.";
  if (!EMAIL_RE.test(values.email)) fieldErrors.email = "Please enter a valid email address.";
  if (!PHONE_RE.test(values.phone) || values.phone.replace(/\D/g, "").length < 7)
    fieldErrors.phone = "Please enter a valid phone number.";
  if (values.location.length < 2) fieldErrors.location = "Please enter your city and state.";
  if (!job) fieldErrors.role = "Please choose an open role.";
  if (formData.get("citizen") !== "on") fieldErrors.citizen = "This role requires US citizenship.";
  if (formData.get("laptop") !== "on") fieldErrors.laptop = "A personal laptop or MacBook is required.";
  if (formData.get("remote") !== "on") fieldErrors.remote = "Remote access for development is required.";

  if (Object.keys(fieldErrors).length > 0 || !job) {
    return { fieldErrors, values };
  }

  try {
    const db = supabaseAdmin();
    const { data: application, error: appError } = await db
      .from("job_applications")
      .insert({ ...values, job_id: job.id })
      .select("*")
      .single();
    if (appError) throw appError;

    const { data: conversation, error: convError } = await db
      .from("applicant_conversations")
      .insert({ application_id: application.id })
      .select("*")
      .single();
    if (convError) throw convError;

    const firstName = application.name.split(/\s+/)[0];
    await createMessage(
      { conversation, application, job },
      "admin",
      `Hi ${firstName}, thanks for applying for the ${job.title} role! We've received your application and someone from the Upforward team will reply here shortly. Feel free to ask us anything in the meantime.`
    );

    const sessionToken = await createApplicantSession(application.id);
    await setApplicantCookie(sessionToken);

    await notifyPanelOfApplication({ application, job, conversationId: conversation.id });
  } catch (err) {
    console.error("[apply] failed", err);
    return {
      error: "We couldn't save your application right now. Please try again in a moment.",
      values,
    };
  }

  redirect("/chat?welcome=1");
}
