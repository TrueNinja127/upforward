import "server-only";
import { Resend } from "resend";
import { site } from "@/lib/site";

/*
 * Transactional email via Resend – the same Resend account and verified domain
 * as the admin panel. This site sends sign-in links to applicants and alerts
 * the team about new applications and unread applicant messages; the panel
 * emails applicants about unread replies. When RESEND_API_KEY is missing,
 * sending is a no-op that logs the email instead, so local development works
 * without keys.
 */

let client: Resend | undefined;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function resend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function fromAddress(): string {
  // Resend requires a verified domain; onboarding@resend.dev only delivers to your own account email.
  return process.env.EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`;
}

export type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(email: Email): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.warn(`[email] RESEND_API_KEY not set. Would send "${email.subject}" to ${email.to}\n${email.text}`);
    return { ok: false, error: "Email is not configured on the server." };
  }
  const { error } = await resend().emails.send({
    from: fromAddress(),
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: email.replyTo ?? site.email,
  });
  if (error) {
    console.error("[email] send failed", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/* Templates ----------------------------------------------------------------- */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Minimal black-and-white layout matching the site. */
function layout({ title, intro, body, cta, footer }: { title: string; intro: string; body?: string; cta?: { label: string; url: string }; footer: string }) {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0c0c0c;border-radius:28px;padding:36px 32px;">
        <tr><td style="font-size:14px;color:rgba(255,255,255,0.5);padding-bottom:16px;">${escapeHtml(site.name)}</td></tr>
        <tr><td style="font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.15;padding-bottom:16px;">${escapeHtml(title)}</td></tr>
        <tr><td style="font-size:16px;line-height:1.6;color:rgba(255,255,255,0.75);padding-bottom:${body ? 16 : 28}px;">${escapeHtml(intro)}</td></tr>
        ${body ? `<tr><td style="font-size:16px;line-height:1.6;color:#fff;background:#000;border-radius:18px;padding:16px 18px;white-space:pre-wrap;">${escapeHtml(body)}</td></tr><tr><td style="height:28px;"></td></tr>` : ""}
        ${cta ? `<tr><td><a href="${cta.url}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;font-weight:600;font-size:16px;padding:14px 26px;border-radius:999px;">${escapeHtml(cta.label)}</a></td></tr>` : ""}
        <tr><td style="font-size:13px;line-height:1.6;color:rgba(255,255,255,0.4);padding-top:28px;">${escapeHtml(footer)}</td></tr>
      </table>
      <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:20px 0 0;">${escapeHtml(site.name)} · ${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function chatSignInEmail({ to, name, url }: { to: string; name: string; url: string }): Email {
  const first = name.split(/\s+/)[0];
  const intro = `Hi ${first}, here is your link to open your chat with the Upforward team. It works for 15 minutes and can only be used once.`;
  const footer = "If you didn't request this link, you can safely ignore this email.";
  return {
    to,
    subject: "Your link to open your Upforward chat",
    html: layout({ title: "Open your chat", intro, cta: { label: "Open my chat", url }, footer }),
    text: `${intro}\n\n${url}\n\n${footer}`,
  };
}

export function adminUnreadEmail({ to, applicantName, role, preview, count, url }: { to: string; applicantName: string; role: string; preview: string; count: number; url: string }): Email {
  const intro = `${applicantName} (${role}) sent ${count > 1 ? `${count} new messages` : "a new message"} that ${count > 1 ? "are" : "is"} still unread:`;
  return {
    to,
    subject: `${applicantName}: ${count > 1 ? `${count} unread messages` : "new unread message"}`,
    html: layout({ title: "Unread applicant message", intro, body: preview, cta: { label: "Open in admin panel", url }, footer: "Sent by upforward.org. Reply from the Applicants page in the admin panel." }),
    text: `${intro}\n\n"${preview}"\n\n${url}`,
  };
}

export function adminNewApplicationEmail({ to, name, role, email, phone, location, url }: { to: string; name: string; role: string; email: string; phone: string; location: string; url: string }): Email {
  const details = `Name: ${name}\nRole: ${role}\nEmail: ${email}\nPhone: ${phone}\nLocation: ${location}`;
  return {
    to,
    subject: `New application: ${name} · ${role}`,
    html: layout({ title: "New application", intro: `${name} just applied for the ${role} role.`, body: details, cta: { label: "Open conversation", url }, footer: "Sent by upforward.org. Reply from the Applicants page in the admin panel." }),
    text: `${name} just applied for the ${role} role.\n\n${details}\n\n${url}`,
  };
}
