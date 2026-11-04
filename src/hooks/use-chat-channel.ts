"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { EVENTS, type MessageDeletedEvent, type MessageEvent, type MessageUpdatedEvent } from "@/lib/chat/channels";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { MessageSender } from "@/lib/supabase/types";

type Handlers = {
  onMessage: (message: MessageEvent) => void;
  onUpdated: (event: MessageUpdatedEvent) => void;
  onDeleted: (event: MessageDeletedEvent) => void;
  onRead: (reader: MessageSender) => void;
  /** Fired when the socket re-subscribes after a drop, so the caller can catch up. */
  onReconnect: () => void;
};

export type ConnectionStatus = "connecting" | "online" | "offline";

/**
 * Joins a conversation's Realtime channel: receives message / read / typing
 * broadcasts and tracks presence so each side can see whether the other is online.
 */
export function useChatChannel(topic: string, me: MessageSender, handlers: Handlers) {
  const configured = isSupabaseConfigured();
  const [status, setStatus] = useState<ConnectionStatus>(configured ? "connecting" : "offline");
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef(handlers);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  // Keep the latest callbacks without re-subscribing on every render.
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!configured) {
      console.error("Supabase is not configured; realtime chat is disabled (see .env.example).");
      return;
    }
    const supabase = supabaseBrowser();
    let hasSubscribedOnce = false;
    const channel = supabase.channel(topic, { config: { presence: { key: me } } });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: EVENTS.message }, ({ payload }) => {
        handlersRef.current.onMessage(payload as MessageEvent);
        if ((payload as MessageEvent).sender !== me) setPeerTyping(false);
      })
      .on("broadcast", { event: EVENTS.updated }, ({ payload }) => handlersRef.current.onUpdated(payload as MessageUpdatedEvent))
      .on("broadcast", { event: EVENTS.deleted }, ({ payload }) => handlersRef.current.onDeleted(payload as MessageDeletedEvent))
      .on("broadcast", { event: EVENTS.read }, ({ payload }) => {
        const reader = (payload as { reader: MessageSender }).reader;
        if (reader !== me) handlersRef.current.onRead(reader);
      })
      .on("broadcast", { event: EVENTS.typing }, ({ payload }) => {
        if ((payload as { role: MessageSender }).role === me) return;
        setPeerTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setPeerTyping(false), 3000);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ role: MessageSender }>();
        const online = Object.values(state)
          .flat()
          .some((p) => p.role !== me);
        setPeerOnline(online);
      })
      .subscribe(async (state) => {
        if (state === "SUBSCRIBED") {
          setStatus("online");
          await channel.track({ role: me, at: Date.now() });
          if (hasSubscribedOnce) handlersRef.current.onReconnect();
          hasSubscribedOnce = true;
        } else if (state === "CLOSED" || state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          setStatus("offline");
          setPeerOnline(false);
        }
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") handlersRef.current.onReconnect();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [topic, me, configured]);

  /** Lets the other side know we're typing (throttled to one event every 2s). */
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    channelRef.current?.send({ type: "broadcast", event: EVENTS.typing, payload: { role: me } });
  }, [me]);

  return { status, peerOnline, peerTyping, sendTyping };
}
