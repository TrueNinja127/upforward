"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { EVENTS } from "@/lib/chat/channels";
import { applicationStatusLabel, getJob } from "@/lib/jobs";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { ConversationOverviewRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function Inbox({ conversations, topic }: { conversations: ConversationOverviewRow[]; topic: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  // Refresh the server-rendered list whenever a message or status changes anywhere.
  useEffect(() => {
    let supabase: ReturnType<typeof supabaseBrowser>;
    try {
      supabase = supabaseBrowser();
    } catch (err) {
      console.error(err);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(topic)
      .on("broadcast", { event: EVENTS.inboxUpdate }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 150);
      })
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [topic, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      [c.name, c.email, c.location, c.phone, getJob(c.role)?.title ?? c.role].some((v) => v.toLowerCase().includes(q))
    );
  }, [conversations, query]);

  const onConversation = pathname.startsWith("/admin/conversations/");

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-r border-white/10 md:w-[340px] lg:w-[380px]",
        onConversation && "hidden md:flex"
      )}
    >
      <div className="p-3">
        <label className="flex h-11 items-center gap-2 rounded-full bg-card px-4 text-[14px]">
          <SearchIcon className="size-4 text-white/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applicants"
            className="w-full bg-transparent outline-none placeholder:text-white/35"
          />
        </label>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 && (
          <li className="px-4 py-10 text-center text-[14px] text-white/40">
            {conversations.length === 0 ? "No applications yet." : "No matches."}
          </li>
        )}
        {filtered.map((c) => {
          const href = `/admin/conversations/${c.id}`;
          const active = pathname === href;
          const unread = c.unread_from_applicant > 0;
          return (
            <li key={c.id}>
              <Link
                href={href}
                className={cn(
                  "flex gap-3 rounded-[22px] px-3 py-3 transition-colors",
                  active ? "bg-white text-black" : "hover:bg-card"
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold",
                    active ? "bg-black text-white" : "bg-card"
                  )}
                >
                  {initials(c.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate text-[15px]", unread ? "font-semibold" : "font-medium")}>{c.name}</span>
                    <span className={cn("shrink-0 text-[11px] tabular-nums", active ? "text-black/50" : "text-white/40")}>
                      {relativeTime(c.last_message_at ?? c.created_at)}
                    </span>
                  </span>
                  <span className={cn("mt-0.5 block truncate text-[12px]", active ? "text-black/60" : "text-white/50")}>
                    {getJob(c.role)?.title ?? c.role} · {c.location}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-[13px]",
                        active ? "text-black/70" : unread ? "text-white" : "text-white/50"
                      )}
                    >
                      {c.last_message_sender === "admin" ? "You: " : ""}
                      {c.last_message_preview ?? "No messages yet"}
                    </span>
                    {unread && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[11px] font-semibold text-black">
                        {c.unread_from_applicant}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px]",
                      active ? "bg-black/10 text-black/70" : "bg-card text-white/50"
                    )}
                  >
                    {applicationStatusLabel[c.status]}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
