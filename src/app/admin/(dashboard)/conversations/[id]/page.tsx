import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { StatusSelect } from "@/components/admin/status-select";
import { ChatRoom } from "@/components/chat/chat-room";
import { conversationTopic } from "@/lib/chat/channels";
import { getConversationOverview, listMessages } from "@/lib/chat/dal";
import { getJob } from "@/lib/jobs";
import { adminMarkRead, adminSendMessage, adminSyncMessages } from "@/app/admin/actions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/admin/conversations/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = UUID_RE.test(id) ? await getConversationOverview(id) : null;
  return { title: c ? c.name : "Conversation" };
}

export default async function AdminConversationPage({ params }: PageProps<"/admin/conversations/[id]">) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const conversation = await getConversationOverview(id);
  if (!conversation) notFound();

  const [messages, topic] = await Promise.all([listMessages(id), conversationTopic(id)]);
  const job = getJob(conversation.role);
  const initials = conversation.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
      {/* Applicant details */}
      <section className="rounded-[28px] bg-card px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href="/admin" className="inline-flex items-center gap-1 text-[13px] text-white/50 hover:text-white md:hidden">
              <ArrowLeftIcon className="size-3.5" /> Inbox
            </Link>
            <h1 className="headline truncate text-[26px]">{conversation.name}</h1>
            <p className="mt-0.5 text-[14px] text-white/50">
              Applied for <span className="text-white/80">{job?.title ?? conversation.role}</span> ·{" "}
              {new Date(conversation.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <StatusSelect applicationId={conversation.application_id} status={conversation.status} />
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/70">
          <li className="inline-flex items-center gap-2">
            <MailIcon className="size-4 text-white/40" />
            <a href={`mailto:${conversation.email}`} className="hover:underline">
              {conversation.email}
            </a>
          </li>
          <li className="inline-flex items-center gap-2">
            <PhoneIcon className="size-4 text-white/40" />
            <a href={`tel:${conversation.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
              {conversation.phone}
            </a>
          </li>
          <li className="inline-flex items-center gap-2">
            <MapPinIcon className="size-4 text-white/40" />
            {conversation.location}
          </li>
        </ul>
      </section>

      <ChatRoom
        key={id}
        className="min-h-0 flex-1"
        topic={topic}
        me="admin"
        peerName={conversation.name}
        peerInitials={initials || "?"}
        initialMessages={messages}
        send={adminSendMessage.bind(null, id)}
        markRead={adminMarkRead.bind(null, id)}
        sync={adminSyncMessages.bind(null, id)}
      />
    </div>
  );
}
