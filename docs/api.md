# REST API

The API is exposed by Next.js route handlers under `/api`. Unless noted otherwise,
responses are JSON and errors use the following shape:

```json
{
  "error": "A human-readable message",
  "details": {}
}
```

`details` is omitted or `null` for most domain errors and contains Zod's flattened
validation output for malformed requests.

## Authentication

The production path is NextAuth at `/api/auth/[...nextauth]`. Local development can
use the opt-in header adapter by setting `ALLOW_DEV_AUTH=true` in `.env`:

```bash
curl http://localhost:3000/api/reservations \
  -H 'x-user-id: usr_guest_demo' \
  -H 'x-user-role: GUEST' \
  -H 'x-user-email: jordan.rivera@example.com'
```

Valid development roles are `GUEST`, `HOST`, and `ADMIN`. Do not enable this adapter
in a deployed environment.

## Listings

### Search listings

`GET /api/listings` and `GET /api/listings/search` accept the same query parameters:

| Parameter | Description |
| --- | --- |
| `city`, `country` | Case-insensitive text filters |
| `propertyType`, `roomType` | Exact listing filters |
| `minPrice`, `maxPrice` | Integer price bounds in the listing currency |
| `guests` | Minimum capacity |
| `amenities` | Comma-separated amenities such as `Wifi,Kitchen` |
| `latitude`, `longitude`, `radiusKm` | Optional PostGIS radius search |
| `checkIn`, `checkOut` | ISO dates used to exclude active reservations |
| `page`, `pageSize` | 1-based pagination; `pageSize` is capped at 100 |

Example:

```bash
curl 'http://localhost:3000/api/listings?city=San%20Francisco&guests=2&pageSize=10'
```

Response:

```json
{
  "items": [
    {
      "id": "listing_bayview_sf",
      "title": "Sunlit Bayview Loft",
      "city": "San Francisco",
      "country": "United States",
      "pricePerNight": 245,
      "maxGuests": 4,
      "status": "PUBLISHED",
      "images": [{ "url": "https://images.unsplash.com/...", "sortOrder": 0 }],
      "host": { "id": "usr_host_san_francisco", "name": "Maya Chen" },
      "_count": { "reviews": 0, "favorites": 1 }
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```

### Create a listing

`POST /api/listings` requires a `HOST` or `ADMIN` context. The request body includes
`title`, `description`, `propertyType`, `roomType`, `address`, `city`, `country`,
`latitude`, `longitude`, `pricePerNight`, `maxGuests`, and optional fees, amenities,
images, and `status` (`DRAFT` or `PUBLISHED`).

```bash
curl -X POST http://localhost:3000/api/listings \
  -H 'content-type: application/json' \
  -H 'x-user-id: usr_host_san_francisco' \
  -H 'x-user-role: HOST' \
  -d '{
    "title": "Mission Garden Flat",
    "description": "A bright private flat close to neighborhood restaurants and parks.",
    "propertyType": "Apartment",
    "roomType": "Entire home",
    "address": "123 Valencia Street",
    "city": "San Francisco",
    "country": "United States",
    "latitude": 37.7677,
    "longitude": -122.4212,
    "pricePerNight": 210,
    "maxGuests": 2,
    "amenities": ["Wifi", "Kitchen"],
    "status": "PUBLISHED"
  }'
```

`GET`, `PATCH`, and `DELETE /api/listings/:id` fetch, update, or archive a listing.
Updates and archive requests require the host owner or an `ADMIN` context.

## Reservations and payments

### Create a reservation

`POST /api/reservations` requires an authenticated guest. The service rejects unpublished
listings, self-booking, over-capacity requests, invalid date ranges, stays longer than
365 nights, and overlapping `PENDING` or `CONFIRMED` reservations.

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H 'content-type: application/json' \
  -H 'x-user-id: usr_guest_demo' \
  -H 'x-user-role: GUEST' \
  -d '{
    "listingId": "listing_bayview_sf",
    "checkIn": "2027-03-10T00:00:00.000Z",
    "checkOut": "2027-03-13T00:00:00.000Z",
    "guests": 2,
    "currency": "USD"
  }'
```

The response includes the reservation, listing summary, and any attached payments:

```json
{
  "id": "clx...",
  "listingId": "listing_bayview_sf",
  "guestId": "usr_guest_demo",
  "hostId": "usr_host_san_francisco",
  "status": "PENDING",
  "nightlyRate": 245,
  "nights": 3,
  "subtotal": 735,
  "cleaningFee": 85,
  "serviceFee": 88,
  "taxes": 73,
  "total": 981,
  "currency": "USD",
  "listing": { "id": "listing_bayview_sf", "title": "Sunlit Bayview Loft" },
  "payments": []
}
```

`GET /api/reservations` lists reservations visible to the current user. `GET` and
`DELETE /api/reservations/:id` fetch or cancel a reservation visible to the guest,
host, or an admin. Cancellation is only allowed while the status is `PENDING` or
`CONFIRMED`. The service records the refund tier: 100% when cancellation is at least
7 days before check-in, 50% between 2 and 7 days, and 0% within 48 hours.

`PATCH /api/reservations/:id` accepts `{ "status": "CONFIRMED" }` or
`{ "status": "DECLINED" }` and is limited to the listing host or an admin while the
reservation is pending.

`POST /api/payments/intents` accepts `{ "reservationId": "...", "depositPercent": 20 }`;
`depositPercent` may be `20` or `100` and defaults to `100`. With no Stripe secret
configured it creates a deterministic mock payment intent; with Stripe configured
it creates a real PaymentIntent with a reservation-scoped idempotency key. Stripe callbacks are accepted at
`POST /api/webhooks/stripe` and move a reservation to `CONFIRMED` after a successful
payment event.

## Favorites and reviews

- `GET /api/favorites` lists the current user's favorites.
- `POST /api/favorites` accepts `{ "listingId": "..." }` and is idempotent.
- `DELETE /api/favorites/:listingId` removes a favorite.
- `GET /api/listings/:id/reviews` lists reviews.
- `POST /api/listings/:id/reviews` accepts `{ "rating": 1-5, "comment": "...", "reservationId": "..." }`.

Reviews require a completed stay (`CONFIRMED` or `COMPLETED` with a checkout in the
past), and each guest can review a listing once.

## Messaging

- `GET /api/messages/threads` lists threads visible to the current user.
- `POST /api/messages/threads` accepts `{ "listingId": "..." }` and creates or reuses a thread.
- `GET /api/messages/threads/:id` returns a thread and its messages.
- `POST /api/messages/threads/:id` accepts `{ "body": "..." }`.
- `PATCH /api/messages/threads/:id` marks messages sent by the other participant as read.
- `GET /api/messages/threads/:id/stream` opens a server-sent events stream with `ready`,
  `message.created`, and periodic `ping` events.

Only the guest, host, or an admin can access a thread. Hosts cannot create a thread
with themselves.

## Account registration and media

- `POST /api/auth/register` accepts `{ "name": "Alex Morgan", "email": "alex@example.com", "password": "at-least-8-chars" }` and creates a guest account. Registration is rate-limited per source address.
- `POST /api/uploads/signature` requires a host or admin context and returns a short-lived signed Cloudinary upload payload. Upload the file directly to Cloudinary, then send the returned `secure_url` in the listing `images` array.
- `GET /api/host/listings` returns listings owned by the authenticated host (or all listings for an admin).
