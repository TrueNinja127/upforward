"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUpIcon, CheckCheckIcon, CheckIcon, RefreshCwIcon, WifiOffIcon } from "lucide-react";
import { useChatChannel } from "@/hooks/use-chat-channel";
import type { MessageEvent } from "@/lib/chat/channels";
import type { MessageRow, MessageSender } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import type { SendResult } from "@/app/chat/actions";

type LocalMessage = MessageRow & {
  /** Client-only delivery state for optimistic messages. */
  state?: "sending" | "failed";
};

export type ChatRoomProps = {
  topic: string;
  me: MessageSender;
  /** Name shown for the other party, e.g. "Upforward team" or the applicant's name. */
  peerName: string;
  peerInitials: string;
  initialMessages: MessageRow[];
  send: (body: string) => Promise<SendResult>;
  markRead: () => Promise<void>;
  sync: (after: string | null) => Promise<MessageRow[]>;
  className?: string;
};

export function ChatRoom({
  topic,
  me,
  peerName,
  peerInitials,
  initialMessages,
  send,
  markRead,
  sync,
  className,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);

  const lastServerTimestamp = useMemo(() => {
    const persisted = messages.filter((m) => !m.state);
    return persisted.length ? persisted[persisted.length - 1].created_at : null;
  }, [messages]);

  /** Inserts or replaces a message, keeping the list sorted by time. */
  const upsert = useCallback((incoming: MessageRow[] | MessageRow, replaceTempId?: string) => {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    if (!list.length) return;
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      if (replaceTempId) byId.delete(replaceTempId);
      for (const m of list) byId.set(m.id, { ...byId.get(m.id), ...m, state: undefined });
      return Array.from(byId.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  // Tell the server we've seen the other party's messages (debounced, only while visible).
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markReadRef = useRef(markRead);
  useEffect(() => {
    markReadRef.current = markRead;
  });
  const scheduleMarkRead = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    if (readTimer.current) clearTimeout(readTimer.current);
    readTimer.current = setTimeout(() => void markReadRef.current(), 400);
  }, []);
  useEffect(() => () => {
    if (readTimer.current) clearTimeout(readTimer.current);
  }, []);

  // On open, acknowledge anything that was waiting for us.
  const hadUnreadOnOpen = initialMessages.some((m) => m.sender !== me && !m.read_at);
  useEffect(() => {
    if (hadUnreadOnOpen) scheduleMarkRead();
  }, [hadUnreadOnOpen, scheduleMarkRead]);

  const catchUp = useCallback(async () => {
    const fresh = await sync(lastServerTimestamp);
    if (fresh.length) {
      upsert(fresh);
      if (fresh.some((m) => m.sender !== me && !m.read_at)) scheduleMarkRead();
    }
  }, [sync, lastServerTimestamp, upsert, me, scheduleMarkRead]);

  const { status, peerOnline, peerTyping, sendTyping } = useChatChannel(topic, me, {
    onMessage: (event: MessageEvent) => {
      upsert({ ...event, read_at: null });
      if (event.sender !== me) scheduleMarkRead();
    },
    onRead: () => {
      // The other side read our messages.
      setMessages((prev) => prev.map((m) => (m.sender === me && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)));
    },
    onReconnect: () => void catchUp(),
  });

  // Keep the newest message in view unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, peerTyping]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  };

  const submit = async (body: string, retryId?: string) => {
    const text = body.trim();
    if (!text) return;
    setError(null);
    stickToBottom.current = true;

    const tempId = retryId ?? `temp-${crypto.randomUUID()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      conversation_id: "",
      sender: me,
      body: text,
      created_at: new Date().toISOString(),
      read_at: null,
      state: "sending",
    };
    setMessages((prev) => (retryId ? prev.map((m) => (m.id === retryId ? optimistic : m)) : [...prev, optimistic]));

    const result = await send(text);
    if ("error" in result) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, state: "failed" } : m)));
      setError(result.error);
      return;
    }
    upsert(result.message, tempId);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft;
    setDraft("");
    requestAnimationFrame(resizeTextarea);
    void submit(text);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (draft.trim()) onSubmit(e);
    }
  };

  const groups = useMemo(() => groupByDay(messages), [messages]);
  const lastMineRead = [...messages].reverse().find((m) => m.sender === me && m.read_at && !m.state);

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-[32px] bg-card", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-black">
          {peerInitials}
          <span
            aria-hidden
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-[3px] ring-card transition-colors",
              peerOnline ? "bg-emerald-400" : "bg-white/25"
            )}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{peerName}</p>
          <p className="truncate text-[13px] text-white/50">
            {peerTyping ? "Typing…" : peerOnline ? "Online now" : "Replies here, usually within a few hours"}
          </p>
        </div>
        <ConnectionBadge status={status} onRetry={catchUp} />
      </div>

      {/* Messages */}
      <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="my-4 flex items-center gap-3 text-[12px] text-white/35">
              <span className="h-px flex-1 bg-white/10" />
              {group.label}
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <ul className="space-y-1.5">
              {group.items.map((m, i) => {
                const mine = m.sender === me;
                const prev = group.items[i - 1];
                const continued = prev && prev.sender === m.sender && minutesBetween(prev.created_at, m.created_at) < 5;
                return (
                  <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start", !continued && i > 0 && "mt-4")}>
                    <div className={cn("max-w-[82%] sm:max-w-[70%]", mine ? "items-end" : "items-start", "flex flex-col gap-1")}>
                      <div
                        className={cn(
                          "rounded-[22px] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words",
                          mine ? "bg-white text-black" : "bg-black text-white",
                          m.state === "sending" && "opacity-60",
                          m.state === "failed" && "ring-2 ring-red-400/70"
                        )}
                      >
                        {m.body}
                      </div>
                      <div className="flex items-center gap-1.5 px-1 text-[11px] text-white/40">
                        <time dateTime={m.created_at}>{formatTime(m.created_at)}</time>
                        {mine && m.state === "sending" && <span>Sending…</span>}
                        {mine && m.state === "failed" && (
                          <button type="button" onClick={() => submit(m.body, m.id)} className="inline-flex items-center gap-1 text-red-300 hover:underline">
                            <RefreshCwIcon className="size-3" /> Failed · retry
                          </button>
                        )}
                        {mine && !m.state && (m.read_at ? <CheckCheckIcon className="size-3.5 text-white/70" /> : <CheckIcon className="size-3.5" />)}
                        {mine && lastMineRead?.id === m.id && <span>Seen</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {peerTyping && (
          <div className="mt-3 flex justify-start">
            <span className="flex items-center gap-1 rounded-[22px] bg-black px-4 py-3" aria-label={`${peerName} is typing`}>
              <Dot delay={0} />
              <Dot delay={0.15} />
              <Dot delay={0.3} />
            </span>
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="border-t border-white/10 p-3 sm:p-4">
        {error && (
          <p role="alert" className="mb-2 px-2 text-[13px] text-red-300">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2 rounded-[26px] bg-black p-1.5 pl-4 focus-within:ring-2 focus-within:ring-white/30">
          <label htmlFor="chat-draft" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-draft"
            ref={textareaRef}
            value={draft}
            rows={1}
            onChange={(e) => {
              setDraft(e.target.value);
              resizeTextarea();
              if (e.target.value.trim()) sendTyping();
            }}
            onKeyDown={onKeyDown}
            placeholder={`Message ${peerName}…`}
            maxLength={4000}
            className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[15px] outline-none placeholder:text-white/35"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity disabled:opacity-30"
          >
            <ArrowUpIcon className="size-5" />
          </button>
        </div>
        <p className="mt-2 px-3 text-[11px] text-white/30">Enter to send · Shift + Enter for a new line</p>
      </form>
    </div>
  );
}

function ConnectionBadge({ status, onRetry }: { status: "connecting" | "online" | "offline"; onRetry: () => void }) {
  if (status === "online") {
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] text-white/60 sm:inline-flex">
        <span className="size-1.5 rounded-full bg-emerald-400" /> Live
      </span>
    );
  }
  if (status === "connecting") {
    return <span className="rounded-full bg-black px-3 py-1.5 text-[12px] text-white/50">Connecting…</span>;
  }
  return (
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] text-white/60 hover:text-white"
      title="Realtime connection lost. Click to refresh messages."
    >
      <WifiOffIcon className="size-3.5" /> Reconnecting
    </button>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-white/70"
      style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
    />
  );
}

/* Helpers ------------------------------------------------------------------- */

function groupByDay(messages: LocalMessage[]) {
  const groups: { label: string; items: LocalMessage[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function minutesBetween(a: string, b: string) {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 60000;
}
