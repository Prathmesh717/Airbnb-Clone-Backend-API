# Deployment

## Vercel

1. Create a Vercel project from this repository. `vercel.json` selects the Next.js
   framework, `npm ci` install, and `npm run build` build command.
2. Provision a PostgreSQL database with the `postgis` and `btree_gist` extensions.
   The checked-in migration creates those extensions before creating the application
   tables. Use the provider's pooled URL as `DATABASE_URL` if it requires one.
3. Add `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `NEXTAUTH_URL` as Vercel
   environment variables. Set `ALLOW_DEV_AUTH=false`.
4. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` when enabling real payments.
   Point Stripe's webhook endpoint at `/api/webhooks/stripe`.
5. Run `npm run db:migrate:deploy` from a release job or a one-off environment against
   the production database. The Vercel build already runs `prisma generate` through
   `npm run build` but should not be used as a substitute for a controlled migration
   release in a multi-instance deployment.

Redis is optional at runtime because the cache has an in-memory fallback. For production,
set either `REDIS_URL` for a native Redis instance or both `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` for Upstash REST.

## Render

`render.yaml` defines a Node web service. Set its secret `DATABASE_URL` to a managed
PostgreSQL connection string that has `postgis` and `btree_gist` available, and set
`REDIS_URL` if a Redis provider is used. The build command runs Prisma generation,
deploys checked-in migrations, and builds Next.js; the start command runs `next start`.

Before the first deploy:

```bash
npm run db:migrate:deploy
npm run db:seed
```

Run the seed only against a disposable/demo database. Production should use unique
secrets, `ALLOW_DEV_AUTH=false`, and a public `AUTH_URL`/`NEXTAUTH_URL` matching the
deployed service URL.

## Database and release checklist

- Confirm `DATABASE_URL` points at PostgreSQL, not SQLite.
- Confirm `postgis` and `btree_gist` can be created by the migration role.
- Run `npm run db:generate` during install/build.
- Run `npm run db:migrate:deploy` once per release, before serving traffic.
- Keep `AUTH_SECRET` and `NEXTAUTH_SECRET` stable across instances.
- Configure Stripe's webhook signing secret before enabling payment confirmation.
- Do not enable development header authentication in a deployed environment.
