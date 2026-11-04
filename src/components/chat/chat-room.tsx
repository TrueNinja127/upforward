"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpIcon,
  BellIcon,
  BellRingIcon,
  CheckCheckIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  Loader2Icon,
  PaperclipIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { useChatChannel } from "@/hooks/use-chat-channel";
import { usePushSubscription, type SubscriptionJson } from "@/hooks/use-push-subscription";
import { ATTACHMENT_ACCEPT, formatBytes, isImageAttachment, MAX_ATTACHMENTS_PER_MESSAGE, validateAttachmentFiles } from "@/lib/chat/attachment-rules";
import type { MessageDeletedEvent, MessageEvent, MessageUpdatedEvent } from "@/lib/chat/channels";
import type { Attachment, MessageRow, MessageSender } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import type { SendResult } from "@/app/chat/actions";

type LocalMessage = MessageRow & {
  /** Client-only delivery state for optimistic messages. */
  state?: "sending" | "failed";
  /** Arrived after first render, so it animates in. */
  fresh?: boolean;
  /** Files of a failed optimistic message, kept so "retry" can resend them. */
  pendingFiles?: File[];
};

export type ChatRoomProps = {
  topic: string;
  me: MessageSender;
  /** Name shown for the other party, e.g. "Upforward team". */
  peerName: string;
  peerInitials: string;
  initialMessages: MessageRow[];
  /** Receives a FormData with `body` and optional `files`. */
  send: (formData: FormData) => Promise<SendResult>;
  edit?: (messageId: string, body: string) => Promise<SendResult>;
  remove?: (messageId: string) => Promise<{ ok: boolean; error?: string }>;
  markRead: () => Promise<void>;
  sync: (after: string | null) => Promise<MessageRow[]>;
  /** VAPID public key; enables Web Push (notifications with the site closed). */
  pushPublicKey?: string | null;
  registerPush?: (subscription: SubscriptionJson) => Promise<{ ok: boolean; error?: string }>;
  className?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;
const noRegister = async () => ({ ok: false, error: "Push is not available" });

export function ChatRoom({
  topic,
  me,
  peerName,
  peerInitials,
  initialMessages,
  send,
  edit,
  remove,
  markRead,
  sync,
  pushPublicKey,
  registerPush,
  className,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(0);
  const [editing, setEditing] = useState<{ id: string; draft: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);
  const notifications = useBrowserNotifications();
  const push = usePushSubscription(registerPush ? pushPublicKey : null, registerPush ?? noRegister);
  const pushActive = useRef(false);
  useEffect(() => {
    pushActive.current = push.state === "subscribed";
  }, [push.state]);

  const lastServerTimestamp = useMemo(() => {
    const persisted = messages.filter((m) => !m.state);
    return persisted.length ? persisted[persisted.length - 1].created_at : null;
  }, [messages]);

  /** Inserts or replaces messages, keeping the list sorted by time. New rows animate in when `fresh` is set. */
  const upsert = useCallback((incoming: MessageRow[] | MessageRow, options: { replaceTempId?: string; fresh?: boolean } = {}) => {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    if (!list.length) return;
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      if (options.replaceTempId) byId.delete(options.replaceTempId);
      for (const m of list) {
        const existing = byId.get(m.id);
        byId.set(m.id, { ...existing, ...m, state: undefined, pendingFiles: undefined, fresh: existing ? existing.fresh : options.fresh });
      }
      return Array.from(byId.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  const patch = useCallback((id: string, changes: Partial<LocalMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));
  }, []);

  // Short confirmation line under the header ("Copied", errors from edit / delete).
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

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

  // Unread counter in the tab title while the page is in the background.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unseen > 0 ? `(${unseen}) ${base}` : base;
  }, [unseen]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setUnseen(0);
        scheduleMarkRead();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [scheduleMarkRead]);

  const onPeerMessage = useCallback(
    (body: string) => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        scheduleMarkRead();
        return;
      }
      setUnseen((n) => n + 1);
      // With Web Push active the service worker shows the alert; avoid a duplicate.
      if (!pushActive.current) notifications.notify(`${peerName} replied`, { body: body.length > 140 ? `${body.slice(0, 137)}…` : body || "Sent you a file", tag: topic });
    },
    [notifications, peerName, scheduleMarkRead, topic]
  );

  const catchUp = useCallback(async () => {
    const fresh = await sync(lastServerTimestamp);
    if (fresh.length) {
      upsert(fresh, { fresh: true });
      if (fresh.some((m) => m.sender !== me && !m.read_at)) scheduleMarkRead();
    }
  }, [sync, lastServerTimestamp, upsert, me, scheduleMarkRead]);

  const { status, peerOnline, peerTyping, sendTyping } = useChatChannel(topic, me, {
    onMessage: (event: MessageEvent) => {
      upsert({ ...event, attachments: event.attachments ?? [], read_at: null, edited_at: null, deleted_at: null }, { fresh: true });
      if (event.sender !== me) onPeerMessage(event.body);
    },
    onUpdated: (event: MessageUpdatedEvent) => patch(event.id, { body: event.body, edited_at: event.edited_at }),
    onDeleted: (event: MessageDeletedEvent) => patch(event.id, { body: "", attachments: [], deleted_at: new Date().toISOString() }),
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

  /* Sending ---------------------------------------------------------------------- */

  const pickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const next = [...files, ...picked].slice(0, MAX_ATTACHMENTS_PER_MESSAGE + 1);
    const problem = validateAttachmentFiles(next);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFiles(next);
  };

  const submit = async (body: string, attach: File[], retryId?: string) => {
    const text = body.trim();
    if (!text && !attach.length) return;
    setError(null);
    stickToBottom.current = true;
    setSending(true);

    const tempId = retryId ?? `temp-${crypto.randomUUID()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      conversation_id: "",
      sender: me,
      body: text,
      created_at: new Date().toISOString(),
      read_at: null,
      edited_at: null,
      deleted_at: null,
      attachments: attach.map((f) => ({ path: "", name: f.name, type: f.type, size: f.size, url: isImageAttachment(f.type) ? URL.createObjectURL(f) : undefined })),
      state: "sending",
      fresh: true,
      pendingFiles: attach,
    };
    setMessages((prev) => (retryId ? prev.map((m) => (m.id === retryId ? optimistic : m)) : [...prev, optimistic]));

    const formData = new FormData();
    formData.set("body", text);
    for (const f of attach) formData.append("files", f);
    const result = await send(formData);
    setSending(false);
    if ("error" in result) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, state: "failed" } : m)));
      setError(result.error);
      return;
    }
    // The confirmed row replaces the optimistic one in place, without a second entrance animation.
    upsert(result.message, { replaceTempId: tempId, fresh: false });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const text = draft;
    const attach = files;
    setDraft("");
    setFiles([]);
    requestAnimationFrame(resizeTextarea);
    void submit(text, attach);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (draft.trim() || files.length) onSubmit(e);
    }
  };

  /* Message actions ------------------------------------------------------------ */

  const copy = async (body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setToast("Copied");
    } catch {
      setToast("Could not copy");
    }
  };

  const saveEdit = async () => {
    if (!editing || !edit) return;
    const text = editing.draft.trim();
    const current = messages.find((m) => m.id === editing.id);
    if (!text || !current || text === current.body) {
      setEditing(null);
      return;
    }
    setBusyId(editing.id);
    const result = await edit(editing.id, text);
    setBusyId(null);
    if ("error" in result) {
      setToast(result.error);
      return;
    }
    patch(result.message.id, { body: result.message.body, edited_at: result.message.edited_at });
    setEditing(null);
  };

  const removeMessage = async (id: string) => {
    if (!remove) return;
    setBusyId(id);
    const res = await remove(id);
    setBusyId(null);
    setConfirmDelete(null);
    if (!res.ok) {
      setToast(res.error ?? "Could not delete the message");
      return;
    }
    patch(id, { body: "", attachments: [], deleted_at: new Date().toISOString() });
  };

  const enableNotifications = async () => {
    const permission = await notifications.request();
    if (permission !== "granted") return;
    if (push.supported && registerPush) {
      const ok = await push.subscribe();
      setToast(ok ? "You'll be notified of replies, even with this site closed." : "Alerts are on while this tab stays open.");
    } else {
      setToast("Alerts are on while this tab stays open.");
    }
  };

  const groups = useMemo(() => groupByDay(messages), [messages]);
  const lastMineRead = [...messages].reverse().find((m) => m.sender === me && m.read_at && !m.state && !m.deleted_at);
  const canSend = (draft.trim().length > 0 || files.length > 0) && !sending;

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
        <NotificationToggle permission={notifications.permission} pushState={push.state} onEnable={() => void enableNotifications()} onRetryPush={() => void push.subscribe()} />
        <ConnectionBadge status={status} onRetry={catchUp} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="border-b border-white/10 bg-black px-5 py-2 text-center text-[12px] text-white/70"
            role="status"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="my-4 flex items-center gap-3 text-[12px] text-white/35">
              <span className="h-px flex-1 bg-white/10" />
              {group.label}
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <ul className="space-y-1">
              {group.items.map((m, i) => {
                const mine = m.sender === me;
                const deleted = Boolean(m.deleted_at);
                const prev = group.items[i - 1];
                const next = group.items[i + 1];
                const continued = Boolean(prev && prev.sender === m.sender && minutesBetween(prev.created_at, m.created_at) < 5);
                const last = !next || next.sender !== m.sender || minutesBetween(m.created_at, next.created_at) >= 5;
                const animate = Boolean(m.fresh);
                const isEditing = editing?.id === m.id;
                const canManage = mine && !deleted && !m.state && Boolean(edit || remove);
                return (
                  <motion.li
                    key={m.id}
                    layout="position"
                    initial={animate ? { opacity: 0, y: 14, scale: 0.97 } : false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease }}
                    style={{ originX: mine ? 1 : 0, originY: 1 }}
                    className={cn("group/msg flex items-end gap-2.5", mine ? "justify-end" : "justify-start", !continued && i > 0 && "mt-4")}
                  >
                    {!mine && (
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black",
                          !last && "invisible"
                        )}
                      >
                        {peerInitials}
                      </span>
                    )}
                    {canManage && !isEditing && (
                      <MessageActions
                        mine
                        canEdit={Boolean(edit) && Boolean(m.body)}
                        canDelete={Boolean(remove)}
                        confirming={confirmDelete === m.id}
                        busy={busyId === m.id}
                        onCopy={() => void copy(m.body)}
                        onEdit={() => {
                          setConfirmDelete(null);
                          setEditing({ id: m.id, draft: m.body });
                        }}
                        onDelete={() => setConfirmDelete(m.id)}
                        onConfirmDelete={() => void removeMessage(m.id)}
                        onCancelDelete={() => setConfirmDelete(null)}
                      />
                    )}
                    <div className={cn("flex min-w-0 flex-col gap-1", isEditing ? "w-full max-w-[82%] sm:max-w-[70%]" : "max-w-[82%] sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
                      {isEditing ? (
                        <EditBox
                          value={editing.draft}
                          busy={busyId === m.id}
                          onChange={(v) => setEditing({ id: m.id, draft: v })}
                          onSave={() => void saveEdit()}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <>
                          {m.attachments.length > 0 && <AttachmentList attachments={m.attachments} mine={mine} pending={m.state === "sending"} />}
                          {(m.body || deleted) && (
                            <div
                              className={cn(
                                "rounded-[22px] px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap",
                                deleted
                                  ? "border border-dashed border-white/20 text-white/40 italic"
                                  : mine
                                    ? "bg-white text-black shadow-[0_1px_2px_rgb(0_0_0/0.3)]"
                                    : "bg-black text-white shadow-[0_1px_2px_rgb(0_0_0/0.3)] ring-1 ring-white/10",
                                mine && last && "rounded-br-md",
                                !mine && last && "rounded-bl-md",
                                m.state === "sending" && "opacity-60",
                                m.state === "failed" && "ring-2 ring-red-400/70"
                              )}
                            >
                              {deleted ? "This message was deleted" : m.body}
                            </div>
                          )}
                        </>
                      )}
                      {(last || m.state || m.edited_at) && !isEditing && (
                        <div className="flex items-center gap-1.5 px-1 text-[11px] text-white/40">
                          <time dateTime={m.created_at}>{formatTime(m.created_at)}</time>
                          {m.edited_at && !deleted && <span title={`Edited ${formatTime(m.edited_at)}`}>· edited</span>}
                          {mine && m.state === "sending" && (
                            <span className="inline-flex items-center gap-1">
                              <Loader2Icon className="size-3 animate-spin" /> {m.pendingFiles?.length ? "Uploading…" : "Sending…"}
                            </span>
                          )}
                          {mine && m.state === "failed" && (
                            <button type="button" onClick={() => submit(m.body, m.pendingFiles ?? [], m.id)} className="inline-flex items-center gap-1 text-red-300 hover:underline">
                              <RefreshCwIcon className="size-3" /> Failed · retry
                            </button>
                          )}
                          {mine && !m.state && !deleted && (m.read_at ? <CheckCheckIcon className="size-3.5 text-white/70" /> : <CheckIcon className="size-3.5" />)}
                          {mine && lastMineRead?.id === m.id && <span>Seen</span>}
                        </div>
                      )}
                    </div>
                    {!mine && !deleted && m.body && <MessageActions mine={false} onCopy={() => void copy(m.body)} />}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}

        <AnimatePresence>
          {peerTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.3, ease }}
              style={{ originX: 0, originY: 1 }}
              className="mt-3 flex items-end gap-2.5"
            >
              <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black">
                {peerInitials}
              </span>
              <span className="flex items-center gap-1 rounded-[22px] rounded-bl-md bg-black px-4 py-3 ring-1 ring-white/10" aria-label={`${peerName} is typing`}>
                <Dot delay={0} />
                <Dot delay={0.15} />
                <Dot delay={0.3} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="border-t border-white/10 p-3 sm:p-4">
        {error && (
          <p role="alert" className="mb-2 px-2 text-[13px] text-red-300">
            {error}
          </p>
        )}
        {files.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5 px-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-black py-1 pr-1 pl-3 text-[12px] ring-1 ring-white/10">
                <AttachmentIcon type={f.type} className="size-3.5 shrink-0 text-white/60" />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-white/40">{formatBytes(f.size)}</span>
                <button type="button" onClick={() => setFiles((list) => list.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="flex size-5 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
                  <XIcon className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-2 rounded-[26px] bg-black p-1.5 pl-1.5 focus-within:ring-2 focus-within:ring-white/30">
          <input ref={fileInputRef} type="file" multiple accept={ATTACHMENT_ACCEPT} onChange={pickFiles} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach files"
            title="Attach images or documents (10 MB max each)"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <PaperclipIcon className="size-5" />
          </button>
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
          <motion.button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            whileTap={{ scale: 0.92 }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity disabled:opacity-30"
          >
            {sending ? <Loader2Icon className="size-5 animate-spin" /> : <ArrowUpIcon className="size-5" />}
          </motion.button>
        </div>
        <p className="mt-2 px-3 text-[11px] text-white/30">Enter to send · Shift + Enter for a new line · Attach images, PDFs or documents</p>
      </form>
    </div>
  );
}

/* Attachments --------------------------------------------------------------------- */

function AttachmentIcon({ type, className }: { type: string; className?: string }) {
  if (/spreadsheet|excel|csv/.test(type)) return <FileSpreadsheetIcon className={className} />;
  if (/pdf|word|text|presentation/.test(type)) return <FileTextIcon className={className} />;
  return <FileIcon className={className} />;
}

function AttachmentList({ attachments, mine, pending }: { attachments: Attachment[]; mine: boolean; pending: boolean }) {
  const images = attachments.filter((a) => isImageAttachment(a.type));
  const others = attachments.filter((a) => !isImageAttachment(a.type));
  return (
    <div className={cn("flex max-w-full flex-col gap-1.5", mine ? "items-end" : "items-start", pending && "opacity-60")}>
      {images.length > 0 && (
        <div className={cn("grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((a, i) =>
            a.url ? (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[18px] ring-1 ring-white/10" title={a.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} className="max-h-64 w-full object-cover" />
              </a>
            ) : (
              <span key={i} className="flex h-24 w-36 items-center justify-center rounded-[18px] bg-black text-[12px] text-white/40 ring-1 ring-white/10">
                Image unavailable
              </span>
            )
          )}
        </div>
      )}
      {others.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          download={a.name}
          className={cn(
            "flex max-w-[280px] items-center gap-2.5 rounded-[18px] px-3 py-2 text-left transition-opacity",
            mine ? "bg-white text-black hover:opacity-85" : "bg-black text-white ring-1 ring-white/10 hover:bg-white/5",
            !a.url && "pointer-events-none opacity-60"
          )}
        >
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", mine ? "bg-black/10" : "bg-white/10")}>
            <AttachmentIcon type={a.type} className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{a.name}</span>
            <span className={cn("block text-[11px]", mine ? "text-black/60" : "text-white/50")}>{formatBytes(a.size)}</span>
          </span>
          <DownloadIcon className="size-4 shrink-0 opacity-70" />
        </a>
      ))}
    </div>
  );
}

/** Hover toolbar beside a bubble: copy for everyone, edit / delete for your own messages. */
function MessageActions({
  mine,
  canEdit = false,
  canDelete = false,
  confirming = false,
  busy = false,
  onCopy,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  mine: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  confirming?: boolean;
  busy?: boolean;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}) {
  const iconButton =
    "flex size-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50";
  return (
    <div
      className={cn(
        "mb-6 flex shrink-0 items-center gap-0.5 self-end rounded-full bg-black p-0.5 ring-1 ring-white/10 transition-opacity",
        confirming ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100"
      )}
    >
      {confirming ? (
        <>
          <span className="pl-2.5 text-[11px] text-white/60">Delete?</span>
          <button type="button" onClick={onConfirmDelete} disabled={busy} className="h-6 rounded-full bg-red-500/20 px-2.5 text-[11px] font-medium text-red-200 transition-colors hover:bg-red-500/30 disabled:opacity-50">
            Delete
          </button>
          <button type="button" onClick={onCancelDelete} disabled={busy} aria-label="Cancel" className={iconButton}>
            <XIcon className="size-3.5" />
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={onCopy} aria-label="Copy message" title="Copy" className={iconButton}>
            <CopyIcon className="size-3.5" />
          </button>
          {mine && canEdit && (
            <button type="button" onClick={onEdit} aria-label="Edit message" title="Edit" className={iconButton}>
              <PencilIcon className="size-3.5" />
            </button>
          )}
          {mine && canDelete && (
            <button type="button" onClick={onDelete} aria-label="Delete message" title="Delete" className={cn(iconButton, "hover:text-red-300")}>
              <Trash2Icon className="size-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Inline editor that replaces the bubble. Enter saves, Escape cancels. */
function EditBox({ value, busy, onChange, onSave, onCancel }: { value: string; busy: boolean; onChange: (v: string) => void; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="w-full rounded-[22px] bg-black p-2 ring-1 ring-white/20">
      <textarea
        value={value}
        autoFocus
        rows={2}
        maxLength={4000}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSave();
          }
        }}
        className="min-h-[44px] w-full resize-none bg-transparent px-2 py-1.5 text-[15px] text-white outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <span className="text-[11px] text-white/40">Enter to save · Esc to cancel</span>
        <div className="flex gap-1">
          <button type="button" onClick={onCancel} disabled={busy} className="h-7 rounded-full px-3 text-[12px] text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={busy || !value.trim()} className="h-7 rounded-full bg-white px-3 text-[12px] font-medium text-black transition-opacity hover:bg-white/85 disabled:opacity-40">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({
  permission,
  pushState,
  onEnable,
  onRetryPush,
}: {
  permission: "default" | "granted" | "denied" | "unsupported";
  pushState: "unsupported" | "idle" | "subscribing" | "subscribed" | "error";
  onEnable: () => void;
  onRetryPush: () => void;
}) {
  if (permission === "unsupported") return null;
  if (permission === "granted") {
    if (pushState === "subscribed") {
      return (
        <span className="hidden items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] text-white/60 sm:inline-flex" title="You'll be notified of replies on this device, even when the site is closed.">
          <BellRingIcon className="size-3.5" /> Alerts on
        </span>
      );
    }
    if (pushState === "subscribing") {
      return <span className="hidden rounded-full bg-black px-3 py-1.5 text-[12px] text-white/50 sm:inline-flex">Enabling…</span>;
    }
    if (pushState === "error") {
      return (
        <button type="button" onClick={onRetryPush} className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] text-white/70 hover:text-white" title="Push setup failed. Click to try again.">
          <BellIcon className="size-3.5" /> <span className="hidden sm:inline">Retry alerts</span>
        </button>
      );
    }
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] text-white/60 sm:inline-flex" title="You'll get a desktop alert when the team replies while this tab is in the background.">
        <BellRingIcon className="size-3.5" /> Alerts on
      </span>
    );
  }
  if (permission === "denied") {
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] text-white/40 sm:inline-flex" title="Notifications are blocked for this site in your browser settings.">
        <BellIcon className="size-3.5" /> Alerts blocked
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onEnable}
      className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] text-white/70 transition-colors hover:text-white"
      title="Get notified when the team replies, even when this site is closed."
    >
      <BellIcon className="size-3.5" /> <span className="hidden sm:inline">Notify me</span>
    </button>
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
