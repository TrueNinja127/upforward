import { MessageSquareIcon } from "lucide-react";
import { listConversationOverview } from "@/lib/chat/dal";

export default async function AdminHomePage() {
  const conversations = await listConversationOverview();
  const unread = conversations.reduce((n, c) => n + c.unread_from_applicant, 0);
  const open = conversations.filter((c) => c.status !== "hired" && c.status !== "declined").length;

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-card">
        <MessageSquareIcon className="size-7 text-white/60" />
      </span>
      <h1 className="headline mt-6 text-[32px]">Applicant inbox</h1>
      <p className="mt-2 max-w-sm text-[15px] text-white/50">
        Pick a conversation to reply. New messages appear here in real time.
      </p>
      <dl className="mt-8 grid grid-cols-3 gap-3">
        <Stat label="Applications" value={conversations.length} />
        <Stat label="Open" value={open} />
        <Stat label="Unread" value={unread} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] bg-card px-6 py-5">
      <dd className="headline text-[32px] leading-none tabular-nums">{value}</dd>
      <dt className="mt-2 text-[13px] text-white/50">{label}</dt>
    </div>
  );
}
