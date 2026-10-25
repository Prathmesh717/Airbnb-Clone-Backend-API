import { serverEnv } from "./env";
import { createClient, type RedisClientType } from "redis";

type MemoryEntry = { value: string; expiresAt: number };
const memoryCache = new Map<string, MemoryEntry>();

function hasRedis() {
  return Boolean(serverEnv.redisUrl && serverEnv.redisToken);
}

let nativeClient: RedisClientType | undefined;
let nativeConnection: Promise<RedisClientType> | undefined;

async function getNativeRedis() {
  if (!serverEnv.redisUrl || serverEnv.redisToken) return null;
  if (nativeClient?.isReady) return nativeClient;
  if (!nativeConnection) {
    const client = createClient({ url: serverEnv.redisUrl });
    client.on("error", (error) => console.warn("Redis client error", error.message));
    nativeClient = client as RedisClientType;
    nativeConnection = client.connect().then(() => nativeClient as RedisClientType);
  }
  return nativeConnection;
}

async function redisCommand<T>(command: string, args: Array<string | number>): Promise<T | null> {
  if (!hasRedis()) return null;
  const response = await fetch(serverEnv.redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.redisToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([command, ...args]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Redis request failed with ${response.status}`);
  const payload = (await response.json()) as { result?: T };
  return payload.result ?? null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (hasRedis()) {
      const result = await redisCommand<string>("GET", [key]);
      return result ? (JSON.parse(result) as T) : null;
    }
    const native = await getNativeRedis();
    if (native) {
      const result = await native.get(key);
      return result ? (JSON.parse(result) as T) : null;
    }
    const entry = memoryCache.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  } catch (error) {
    console.warn("Cache read failed; treating it as a miss", error);
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = serverEnv.cacheTtlSeconds) {
  const serialized = JSON.stringify(value);
  try {
    if (hasRedis()) {
      await redisCommand("SET", [key, serialized, "EX", Math.max(1, ttlSeconds)]);
      return;
    }
    const native = await getNativeRedis();
    if (native) {
      await native.set(key, serialized, { EX: Math.max(1, ttlSeconds) });
      return;
    }
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + Math.max(1, ttlSeconds) * 1000,
    });
  } catch (error) {
    console.warn("Cache write failed", error);
  }
}

export async function cacheDelete(key: string) {
  memoryCache.delete(key);
  try {
    if (hasRedis()) await redisCommand("DEL", [key]);
    else {
      const native = await getNativeRedis();
      if (native) await native.del(key);
    }
  } catch (error) {
    console.warn("Cache delete failed", error);
  }
}

export async function cacheAside<T>(
  key: string,
  loader: () => Promise<T>,
  ttlSeconds = serverEnv.cacheTtlSeconds,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await loader();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

export async function cacheDeleteByPrefix(prefix: string) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
  if (hasRedis()) return;
  try {
    const native = await getNativeRedis();
    if (!native) return;
    const keys: string[] = [];
    for await (const key of native.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) keys.push(key);
    if (keys.length) await native.del(keys);
  } catch (error) {
    console.warn("Cache prefix delete failed", error);
  }
}
