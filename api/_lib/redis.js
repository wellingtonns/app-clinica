import { Redis } from "@upstash/redis";

const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken
      })
    : null;

export async function safeRedisGet(key) {
  if (!redis) return null;

  try {
    return await redis.get(key);
  } catch (error) {
    console.warn("[redis:get] Redis unavailable, falling back to database", {
      key,
      error
    });
    return null;
  }
}

export async function safeRedisSet(key, value, ttlSeconds) {
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.warn("[redis:set] Failed to write cache", {
      key,
      error
    });
  }
}

export async function safeRedisDel(keys) {
  if (!redis || keys.length === 0) return;

  try {
    await Promise.all(keys.map((key) => redis.del(key)));
  } catch (error) {
    console.warn("[redis:del] Failed to invalidate cache", {
      keys,
      error
    });
  }
}
