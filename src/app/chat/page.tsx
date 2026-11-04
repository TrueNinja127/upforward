import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ChatRoom } from "@/components/chat/chat-room";
import { Logo } from "@/components/landing/logo";
import { PillLink } from "@/components/landing/pill-button";
import { conversationTopic } from "@/lib/chat/channels";
import { getApplicantContext, listMessages } from "@/lib/chat/dal";
import { applicationStatusLabel, getJob } from "@/lib/jobs";
import { site } from "@/lib/site";
import { markApplicantRead, sendApplicantMessage, syncApplicantMessages } from "./actions";

export const metadata: Metadata = {
  title: "Chat with Upforward",
  description: "Your private conversation with the Upforward team about your application.",
  robots: { index: false, follow: false },
};

export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  const [{ welcome }, ctx] = await Promise.all([searchParams, getApplicantContext()]);

  if (!ctx) return <NoApplication />;

  const { application, conversation } = ctx;
  const [messages, topic] = await Promise.all([listMessages(conversation.id), conversationTopic(conversation.id)]);
  const job = getJob(application.role);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-[15px] text-white/60 transition-colors hover:text-white">
          <ArrowLeftIcon className="size-4" /> Back to site
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-4 px-3 pb-4 sm:px-6 sm:pb-6 lg:grid lg:grid-cols-12 lg:items-stretch">
        <aside className="lg:col-span-4">
          <div className="rounded-[32px] bg-card p-6 sm:p-7">
            {welcome === "1" && (
              <p className="mb-5 rounded-[20px] bg-white px-4 py-3 text-[14px] font-medium text-black">
                Application received. Welcome, {application.name.split(/\s+/)[0]}!
              </p>
            )}
            <p className="text-[13px] text-white/50">Your application</p>
            <h1 className="headline mt-2 text-[28px]">{job?.title ?? application.role}</h1>
            <dl className="mt-5 space-y-3 text-[14px]">
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
            <p className="mt-6 text-[13px] leading-relaxed text-white/40">
              This chat stays open on this device. If you lose access, email us at{" "}
              <a href={`mailto:${site.email}`} className="text-white/70 underline underline-offset-2">
                {site.email}
              </a>
              .
            </p>
          </div>
        </aside>

        <ChatRoom
          className="h-[70dvh] lg:col-span-8 lg:h-auto lg:min-h-[640px]"
          topic={topic}
          me="applicant"
          peerName="Upforward team"
          peerInitials="UF"
          initialMessages={messages}
          send={sendApplicantMessage}
          markRead={markApplicantRead}
          sync={syncApplicantMessages}
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

function NoApplication() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 shrink-0 items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="max-w-lg text-center">
          <p className="text-[17px] font-medium text-white/50">Chat</p>
          <h1 className="headline mt-4 text-[40px] sm:text-[56px]">No application found.</h1>
          <p className="mt-6 text-[17px] leading-relaxed text-white/60">
            This chat opens automatically once you apply for a role. Pick a position to get started, and you&apos;ll be
            talking with our team in under a minute.
          </p>
          <PillLink href="/#jobs" className="mt-8 h-14 px-8 font-medium">
            See open roles
          </PillLink>
        </div>
      </main>
    </div>
  );
}
