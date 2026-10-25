export type MessageEvent = {
  id: string;
  type: "message.created";
  threadId: string;
  message: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  };
};

type Listener = (event: MessageEvent) => void;
const listeners = new Map<string, Set<Listener>>();

export function publishMessageEvent(threadId: string, event: MessageEvent) {
  for (const listener of listeners.get(threadId) ?? []) listener(event);
}

export function subscribeToThread(threadId: string, listener: Listener) {
  const set = listeners.get(threadId) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(threadId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(threadId);
  };
}
