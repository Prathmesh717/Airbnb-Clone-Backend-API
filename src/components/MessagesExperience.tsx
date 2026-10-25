"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createThread, demoFallbacks, getThreads } from "../lib/client/api";
import type { MessageThread } from "../lib/client/types";
import { DashboardNav } from "./DashboardNav";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";
import { PageSkeleton } from "./Skeletons";

export function MessagesExperience() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  useEffect(() => { let active = true; getThreads().then((data) => { if (active) setThreads(data); }).catch(() => { if (active) { setThreads(demoFallbacks.threads()); setDemo(true); } }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!listingId || loading) return; let active = true; createThread(listingId).then((thread) => { if (active) setThreads((current) => [thread, ...current.filter((item) => item.id !== thread.id)]); }).catch(() => undefined); return () => { active = false; }; }, [listingId, loading]);
  if (loading) return <PageSkeleton />;
  return <main className="shell-container dashboard-page"><div className="dashboard-page__top"><div><p className="eyebrow">A note away</p><h1>Inbox</h1><p className="page-lede">Questions, arrival details, and the small things that make a stay smoother.</p></div><Icon name="inbox" size={30} /></div><DashboardNav />{demo ? <div className="demo-banner"><span>Preview mode</span> This conversation is a sample. Sign in to message a real host.</div> : null}{threads.length ? <div className="thread-list">{threads.map((thread) => <Link href={`/messages/${thread.id}`} className="thread-row" key={thread.id}><div className="thread-row__avatar">{(thread.host?.name ?? "H").slice(0, 1)}</div><div className="thread-row__body"><div><strong>{thread.host?.name ?? "Host"}</strong><small>{thread.updatedAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(thread.updatedAt)) : ""}</small></div><h3>{thread.listing?.title ?? "Your Stayfolk stay"}</h3><p>{thread.messages?.[0]?.body ?? "Start the conversation with your host."}</p></div><Icon name="chevron-right" size={18} /></Link>)}</div> : <EmptyState title="Your inbox is quiet" description="Ask a host about a place you love and the conversation will appear here." action="Explore stays" />}</main>;
}
