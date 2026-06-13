import { Redis } from "@upstash/redis";

const redisUrl = process.env.REDIS_URL || "https://massive-lioness-148493.upstash.io";
const redisToken = process.env.REDIS_TOKEN || "gQAAAAAAAkQNAAIgcDI3NDdlNjJmNDhkYjI0MDA5ODhkZmM0YTRjNmNjMzkxNQ";

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
