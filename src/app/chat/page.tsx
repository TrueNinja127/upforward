import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, LogOutIcon } from "lucide-react";
import { ChatRoom } from "@/components/chat/chat-room";
import { ChatSignInForm } from "@/components/chat/chat-sign-in-form";
import { Logo } from "@/components/landing/logo";
import { conversationTopic } from "@/lib/chat/channels";
import { getApplicantContext, listMessages } from "@/lib/chat/dal";
import { applicationStatusLabel } from "@/lib/jobs";
import { site } from "@/lib/site";
import { pushPublicKey } from "@/lib/push";
import { deleteApplicantMessage, editApplicantMessage, markApplicantRead, registerApplicantPush, sendApplicantMessage, signOutApplicant, syncApplicantMessages } from "./actions";

export const metadata: Metadata = {
  title: "Chat with Upforward",
  description: "Your private conversation with the Upforward team about your application.",
  robots: { index: false, follow: false },
};

export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  const [{ welcome, link }, ctx] = await Promise.all([searchParams, getApplicantContext()]);

  if (!ctx) return <SignIn linkProblem={typeof link === "string" ? link : undefined} />;

  const { application, job, conversation } = ctx;
  const messages = await listMessages(conversation.id);
  const topic = conversationTopic(conversation);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-[15px] text-white/60 transition-colors hover:text-white">
          <ArrowLeftIcon className="size-4" /> Back to site
        </Link>
      </header>

      {/* The page is pinned to the viewport: only the message list (and the details card) scroll. */}
      <main className="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-4 px-3 pb-4 sm:px-6 sm:pb-6 lg:grid lg:grid-cols-12 lg:items-stretch">
        <aside className="min-h-0 shrink-0 lg:col-span-4 lg:overflow-y-auto">
          <div className="rounded-[32px] bg-card p-6 sm:p-7">
            {welcome === "1" && (
              <p className="mb-5 rounded-[20px] bg-white px-4 py-3 text-[14px] font-medium text-black">
                Application received. Welcome, {application.name.split(/\s+/)[0]}!
              </p>
            )}
            <p className="text-[13px] text-white/50">Your application</p>
            <h1 className="headline mt-2 text-[28px]">{job?.title ?? "Open role"}</h1>
            <dl className="mt-5 hidden space-y-3 text-[14px] lg:block">
              <Row label="Status">
                <span className="rounded-full bg-black px-3 py-1 text-[13px]">{applicationStatusLabel[application.status]}</span>
              </Row>
              <Row label="Name">{application.name}</Row>
              <Row label="Email">{application.email}</Row>
              <Row label="Phone">{application.phone}</Row>
              <Row label="Location">{application.location}</Row>
              <Row label="Applied">
                {new Date(application.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </Row>
            </dl>
            <p className="mt-6 hidden text-[13px] leading-relaxed text-white/40 lg:block">
              You can come back to this chat any time from the Chat link on our site. We&apos;ll also email you at{" "}
              <span className="text-white/70">{application.email}</span> when the team replies. Questions? Email{" "}
              <a href={`mailto:${site.email}`} className="text-white/70 underline underline-offset-2">
                {site.email}
              </a>
              .
            </p>
            <form action={signOutApplicant} className="mt-4 lg:mt-5">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-[13px] text-white/50 transition-colors hover:text-white"
              >
                <LogOutIcon className="size-3.5" /> Not you? Sign out on this device
              </button>
            </form>
          </div>
        </aside>

        <ChatRoom
          className="min-h-0 flex-1 lg:col-span-8"
          topic={topic}
          me="applicant"
          peerName="Upforward team"
          peerInitials="UF"
          initialMessages={messages}
          send={sendApplicantMessage}
          edit={editApplicantMessage}
          remove={deleteApplicantMessage}
          markRead={markApplicantRead}
          sync={syncApplicantMessages}
          pushPublicKey={pushPublicKey()}
          registerPush={registerApplicantPush}
        />
      </main>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-white/50">{label}</dt>
      <dd className="truncate text-right">{children}</dd>
    </div>
  );
}

const linkMessages: Record<string, string> = {
  expired: "That sign-in link has expired. Enter your email and we'll send a fresh one.",
  used: "That sign-in link was already used. Enter your email to get a new one.",
  invalid: "That sign-in link isn't valid. Enter your email to get a new one.",
};

function SignIn({ linkProblem }: { linkProblem?: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-[15px] text-white/60 transition-colors hover:text-white">
          <ArrowLeftIcon className="size-4" /> Back to site
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-lg text-center">
          <p className="text-[17px] font-medium text-white/50">Chat</p>
          <h1 className="headline mt-4 text-[40px] sm:text-[56px]">Welcome back.</h1>
          <p className="mt-5 text-[17px] leading-relaxed text-white/60">
            Enter the email you applied with and we&apos;ll send you a secure link that opens your chat with the
            Upforward team.
          </p>
          {linkProblem && linkMessages[linkProblem] && (
            <p role="alert" className="mt-5 rounded-[20px] bg-white px-4 py-3 text-[14px] font-medium text-black">
              {linkMessages[linkProblem]}
            </p>
          )}
          <div className="mt-8">
            <ChatSignInForm />
          </div>
        </div>
      </main>
    </div>
  );
}
