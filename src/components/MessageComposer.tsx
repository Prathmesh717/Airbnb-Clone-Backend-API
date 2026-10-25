"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function MessageComposer({ onSend, busy = false }: { onSend: (body: string) => Promise<void> | void; busy?: boolean }) {
  const [body, setBody] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = body.trim();
    if (!value || busy) return;
    await onSend(value);
    setBody("");
  }
  return <form className="message-composer" onSubmit={submit}><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message…" rows={1} aria-label="Message" /><button type="submit" className="send-button" disabled={busy || !body.trim()} aria-label="Send message"><Icon name="send" size={18} /></button></form>;
}
