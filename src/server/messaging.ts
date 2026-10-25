import { prisma } from "../lib/server/db";
import { ApiError } from "../lib/server/http";
import type { AuthContext } from "../lib/server/auth";
import { publishMessageEvent } from "../lib/server/events";

function assertParticipant(context: AuthContext, thread: { guestId: string; hostId: string }) {
  if (context.role !== "ADMIN" && context.userId !== thread.guestId && context.userId !== thread.hostId) {
    throw new ApiError(403, "You are not a participant in this thread");
  }
}

export async function listThreads(context: AuthContext) {
  return prisma.messageThread.findMany({
    where: context.role === "ADMIN" ? {} : { OR: [{ guestId: context.userId }, { hostId: context.userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
      guest: { select: { id: true, name: true, image: true } },
      host: { select: { id: true, name: true, image: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function createThread(context: AuthContext, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, hostId: true } });
  if (!listing) throw new ApiError(404, "Listing not found");
  if (listing.hostId === context.userId) throw new ApiError(400, "Hosts cannot message themselves");
  return prisma.messageThread.upsert({
    where: { listingId_guestId_hostId: { listingId, guestId: context.userId, hostId: listing.hostId } },
    create: { listingId, guestId: context.userId, hostId: listing.hostId },
    update: { updatedAt: new Date() },
    include: { listing: true, guest: true, host: true },
  });
}

export async function getThread(context: AuthContext, threadId: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: { listing: true, guest: true, host: true, messages: { orderBy: { createdAt: "asc" }, include: { sender: true } } },
  });
  if (!thread) throw new ApiError(404, "Message thread not found");
  assertParticipant(context, thread);
  return thread;
}

export async function sendMessage(context: AuthContext, threadId: string, body: string) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId }, select: { id: true, guestId: true, hostId: true } });
  if (!thread) throw new ApiError(404, "Message thread not found");
  assertParticipant(context, thread);
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({ data: { threadId, senderId: context.userId, body } });
    await tx.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    return created;
  });
  publishMessageEvent(threadId, {
    id: message.id,
    type: "message.created",
    threadId,
    message: { id: message.id, senderId: message.senderId, body: message.body, createdAt: message.createdAt.toISOString() },
  });
  return message;
}

export async function markThreadRead(context: AuthContext, threadId: string) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId }, select: { guestId: true, hostId: true } });
  if (!thread) throw new ApiError(404, "Message thread not found");
  assertParticipant(context, thread);
  await prisma.message.updateMany({
    where: { threadId, senderId: { not: context.userId }, readAt: null },
    data: { readAt: new Date() },
  });
  return { read: true };
}
