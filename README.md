# Airbnb Clone

An Airbnb-style marketplace foundation built around Next.js 14 App Router route
handlers, Prisma, PostgreSQL/PostGIS, and Redis-ready caching. The checked-in backend
includes listings, geospatial search, favorites, reservations, reviews, messaging,
NextAuth, and Stripe/mock payment flows. Frontend pages can consume the same REST
surface as they are added.

## Prerequisites

- Node.js 20.11 or newer
- npm 10 or newer
- Docker Desktop (for local PostgreSQL/PostGIS and Redis)

## Quick start

```bash
cp .env.example .env
npm ci
npm run docker:up
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The local services use:

| Service | Address | Credentials |
| --- | --- | --- |
| PostgreSQL + PostGIS | `localhost:5432` | database `airbnb`, user `airbnb`, password `airbnb` |
| Redis | `localhost:6379` | no password |

Stop local infrastructure with `npm run docker:down`. `npm run db:reset` recreates the
database and reruns the configured seed command; use it only for local data.

## Seed data

`npm run db:seed` is idempotent for the fixed demo records and creates:

- Hosts: Maya Chen (`usr_host_san_francisco`) and Daniel Ortega (`usr_host_barcelona`)
- Guests: Jordan Rivera (`usr_guest_demo`) and Alex Morgan (`usr_guest_alex`)
- Admin: `usr_admin_demo`
- Published listings in San Francisco, Barcelona, and Joshua Tree
- A completed Barcelona stay, confirmed Bayview stay, pending desert stay, payments,
  a review, a favorite, and a message thread

All seeded accounts use the password `StayfolkDemo123!`. Use `jordan.rivera@example.com`
for the guest experience or `maya.chen@example.com` for the host experience.

For local API smoke tests, keep `ALLOW_DEV_AUTH=true` and send `x-user-id` plus
`x-user-role` headers. The adapter is intentionally disabled in the Render/Vercel
deployment examples.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Generate Prisma Client and build Next.js |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run focused Vitest tests |
| `npm run test:coverage` | Run tests with V8 coverage output |
| `npm run lint` | Run Next/ESLint checks |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:migrate:deploy` | Apply checked-in migrations |
| `npm run db:seed` | Run the deterministic demo seed |
| `npm run db:studio` | Open Prisma Studio |

## API

The API request/response examples and authentication notes are in
[`docs/api.md`](docs/api.md). Deployment instructions for Vercel and Render are in
[`docs/deployment.md`](docs/deployment.md).

Main route groups:

- `/api/listings` and `/api/listings/search`
- `/api/reservations`
- `/api/favorites`
- `/api/listings/:id/reviews`
- `/api/messages/threads`
- `/api/payments/intents` and `/api/webhooks/stripe`
- `/api/auth/[...nextauth]` and `/api/auth/register`
- `/api/uploads/signature` and `/api/host/listings`

## Configuration notes

The Prisma migration enables `postgis` and `btree_gist`. PostGIS powers radius search,
while the `Reservation_no_overlap` exclusion constraint and the serializable booking
transaction protect active reservation dates. If PostGIS is unavailable, scalar
latitude/longitude remain available to the server fallback, but the checked-in
migration expects a PostgreSQL role allowed to create the extensions.

The cache uses the native Docker Redis URL when `REDIS_URL` is set, Upstash REST when
both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, and an in-memory
fallback when neither is available. The payment service uses a mock provider when
`STRIPE_SECRET_KEY` is empty, so local booking flows do not require external
credentials. Set both Stripe secrets and a public webhook URL before using real
payment confirmation.

Credential sign-in is available out of the box. Google and GitHub buttons become active
when their OAuth client variables are supplied. Host listing images can use the signed
Cloudinary upload endpoint once `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` are configured.
