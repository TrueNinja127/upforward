import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Inbox } from "@/components/admin/inbox";
import { LogoMark } from "@/components/landing/logo";
import { adminInboxTopic } from "@/lib/chat/channels";
import { listConversationOverview } from "@/lib/chat/dal";
import { isAdmin } from "@/lib/session";
import { adminLogout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Inbox", template: "%s · Upforward admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAdmin())) redirect("/admin/login");

  const [conversations, topic] = await Promise.all([listConversationOverview(), adminInboxTopic()]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <LogoMark className="h-5" />
          <span className="text-[16px] font-semibold tracking-tight">Upforward</span>
          <span className="rounded-full bg-card px-2.5 py-1 text-[12px] text-white/60">Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-full px-3 py-2 text-[14px] text-white/60 hover:text-white">
            View site
          </Link>
          <form action={adminLogout}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-[14px] text-white/80 hover:bg-white hover:text-black"
            >
              <LogOutIcon className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Inbox conversations={conversations} topic={topic} />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
