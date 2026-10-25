"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoFallbacks, getThread, markThreadRead, sendMessage } from "../lib/client/api";
import type { Message, MessageThread } from "../lib/client/types";
import { MessageComposer } from "./MessageComposer";
import { Icon } from "./Icon";
import { PageSkeleton } from "./Skeletons";
import { pushToast } from "../store/useUiStore";

export function ThreadExperience({ id }: { id: string }) {
  const [thread, setThread] = useState<MessageThread>();
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const threadId = thread?.id;
  useEffect(() => { getThread(id).then(setThread).catch(() => { const fallback = demoFallbacks.threads().find((item) => item.id === id) ?? demoFallbacks.threads()[0]; setThread(fallback); setDemo(true); }); }, [id]);
  useEffect(() => {
    if (!threadId || demo || typeof window === "undefined" || typeof window.EventSource === "undefined") return;
    const source = new EventSource(`/api/messages/threads/${encodeURIComponent(threadId)}/stream`);
    const onMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as { message?: Message };
        const message = payload.message;
        if (!message) return;
        setThread((current) => {
          if (!current) return current;
          const messages = current.messages ?? [];
          if (messages.some((item) => item.id === message.id)) return current;
          return { ...current, messages: [...messages, message] };
        });
      } catch {
        // Ignore malformed events; the next refresh remains authoritative.
      }
    };
    source.addEventListener("message.created", onMessage as EventListener);
    return () => source.close();
  }, [threadId, demo]);
  useEffect(() => {
    if (threadId && !demo) void markThreadRead(threadId);
  }, [threadId, demo]);
  async function onSend(body: string) {
    if (!thread) return;
    setBusy(true);
    try { const message = await sendMessage(thread.id, body); setThread((current) => current ? { ...current, messages: [...(current.messages ?? []), message] } : current); } catch { setThread((current) => current ? { ...current, messages: [...(current.messages ?? []), { id: `local-${Date.now()}`, threadId: current.id, senderId: "demo-guest", body, createdAt: new Date().toISOString(), sender: { id: "demo-guest", name: "You" } }] } : current); pushToast("Preview message added locally. Sign in to send it to your host.", "default"); } finally { setBusy(false); }
  }
  if (!thread) return <PageSkeleton />;
  return <main className="shell-container thread-page"><Link href="/messages" className="back-link"><Icon name="arrow-left" size={16} /> Inbox</Link><div className="thread-layout"><aside className="thread-context"><div className="thread-context__image">{thread.listing?.images?.[0]?.url ? <img src={thread.listing.images[0].url} alt="" /> : <div className="image-placeholder image-placeholder--warm"><Icon name="home" size={26} /></div>}</div><p className="eyebrow">About this stay</p><h2>{thread.listing?.title ?? "Your Stayfolk stay"}</h2><p>{thread.listing?.city}</p><Link href={`/listing/${thread.listingId}`} className="text-link">View listing <Icon name="arrow-right" size={14} /></Link></aside><section className="thread-panel"><header className="thread-panel__header"><div className="thread-row__avatar">{(thread.host?.name ?? "H").slice(0, 1)}</div><div><p className="eyebrow">Your host</p><h1>{thread.host?.name ?? "Host"}</h1></div><span className="thread-online"><i /> Usually replies quickly</span></header>{demo ? <div className="demo-banner"><span>Preview mode</span> Your messages will be sent after you sign in.</div> : null}<div className="message-list">{(thread.messages ?? []).map((message) => <div className={`message-bubble${message.senderId === thread.guestId || message.senderId === "demo-guest" ? " message-bubble--mine" : ""}`} key={message.id}><p>{message.body}</p><small>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}{message.senderId === thread.guestId && message.readAt ? " · Seen" : ""}</small></div>)}</div><MessageComposer onSend={onSend} busy={busy} /></section></div></main>;
}
