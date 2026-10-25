export const serverEnv = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  authSecret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "development-only-change-me",
  authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  redisUrl: process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_URL ?? "",
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  githubClientId: process.env.GITHUB_ID ?? process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  allowDevAuth: process.env.ALLOW_DEV_AUTH === "true",
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 60),
};
