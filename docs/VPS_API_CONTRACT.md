# Fabrika VPS Order API — Contract

The Nuxt frontend communicates with a separate backend service running on a VPS behind a Cloudflare Tunnel. The frontend only depends on this HTTP/JSON API contract. The backend implementation language is not constrained.

## Architecture

```
Telegram Mini App → Nuxt (Vercel) → HTTPS → orders.fabrika.chat → Cloudflare Tunnel → VPS (127.0.0.1:10052) → PostgreSQL
```

## Environment Variables

### Frontend (Vercel)

| Variable | Example | Description |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `https://orders.fabrika.chat` | Base URL of the VPS Order API. Safe for browser. |
| `NUXT_PUBLIC_SITE_URL` | `https://fabrika.chat` | Public site URL. Already exists. |
| `TELEGRAM_BOT_TOKEN` | (secret) | Server-only. Used for Telegram initData validation. Never exposed to browser. |

For local development:
```
NUXT_PUBLIC_API_BASE=http://localhost:10052
```

### Backend (VPS only)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Never exposed to frontend. |
| `TELEGRAM_BOT_TOKEN` | Bot token for initData validation. Never exposed to frontend. |
| `PORT` | Internal port, e.g. `10052`. Listen on `127.0.0.1` only. |

## Authentication

All authenticated requests must include:

```
Authorization: tma <telegram_init_data>
```

Where `<telegram_init_data>` is the raw `Telegram.WebApp.initData` string. The backend must validate this using the Telegram bot token via HMAC-SHA256 verification. The user identity is derived server-side from the validated initData. The frontend never sends `user_id`, `telegram_id`, or `telegram_username` as trusted values.

## Endpoints

### GET /api/health

Public (no auth required).

**Response 200:**
```json
{ "status": "ok", "database": "connected" }
```

### GET /api/packages

Public or auth-required (backend decision). Returns available packages.

**Response 200:**
```json
[
  { "id": 1, "title": "Basic", "type": "basic", "emoji": "⭐", "price": 50000, "description": "..." }
]
```

### GET /api/packages/:id

Returns a single package.

**Response 200:**
```json
{ "id": 1, "title": "Basic", "type": "basic", "emoji": "⭐", "price": 50000 }
```

### POST /api/orders

Authenticated. Creates a new order. The backend must:
1. Validate the Telegram initData from the `Authorization` header.
2. Look up the package by `package_id` in PostgreSQL to get the real price.
3. Create the order using the database price (never trust frontend price).
4. Use the `Idempotency-Key` header if provided to prevent duplicates.

**Request headers:**
```
Authorization: tma <init_data>
Idempotency-Key: <uuid>
Content-Type: application/json
```

**Request body:**
```json
{
  "package_id": 3,
  "comment": "Optional comment text",
  "payment_method": "cash"
}
```

**Response 200/201:**
```json
{
  "success": true,
  "order": {
    "id": 123,
    "status": "pending",
    "package": { "id": 3, "title": "Premium", "type": "premium", "emoji": "🚀", "price": 150000 },
    "comment": "...",
    "payment_method": "cash",
    "created_at": "2026-08-25T12:00:00Z"
  }
}
```

**Errors:** 400 (invalid body), 401 (invalid auth), 409 (duplicate idempotency key), 422 (validation), 429 (rate limited), 500/502/503 (server error).

### GET /api/orders/:id

Authenticated. Returns a single order. The backend must verify the order belongs to the authenticated user.

**Response 200:**
```json
{
  "id": 123,
  "status": "processing",
  "package": { "id": 3, "title": "Premium", "type": "premium", "price": 150000 },
  "comment": "...",
  "payment_method": "cash",
  "created_at": "2026-08-25T12:00:00Z",
  "updated_at": "2026-08-25T13:00:00Z"
}
```

### GET /api/orders/me

Authenticated. Returns all orders belonging to the authenticated Telegram user. The backend derives the user from the validated initData — the `:telegramId` path parameter approach is NOT trusted.

**Response 200:**
```json
[
  {
    "id": 123,
    "status": "processing",
    "package": { "id": 3, "title": "Premium", "type": "premium", "price": 150000 },
    "comment": "...",
    "payment_method": "cash",
    "created_at": "2026-08-25T12:00:00Z"
  }
]
```

## Order Statuses

| Status | Label (RU) |
|---|---|
| `pending` | Заказ принят |
| `processing` | В работе |
| `paid` | Оплачен |
| `completed` | Завершён |
| `cancelled` | Отменён |
| `rejected` | Отклонён |

The frontend does not hardcode business logic assuming these are the only statuses. Unknown statuses are displayed as-is.

## Security Rules

1. **Price is server-authoritative.** The frontend sends `package_id` only. The backend looks up the real price from PostgreSQL.
2. **User identity is server-derived.** Never trust `user_id`, `telegram_id`, or `telegram_username` from the frontend.
3. **Telegram initData is validated server-side.** The bot token never reaches the browser.
4. **Users can only see their own orders.** The `/api/orders/me` endpoint derives the user from validated initData.
5. **Admin endpoints require separate authorization** — not exposed through the user API.
6. **Database is never publicly exposed.** PostgreSQL listens on internal network only.
7. **CORS must be restricted** to `https://fabrika.chat`, `https://www.fabrika.chat`, and `http://localhost:3000` for dev. Never `*` in production.

## CORS Configuration (VPS backend)

```
Access-Control-Allow-Origin: https://fabrika.chat
Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Idempotency-Key
```

For preflight (`OPTIONS`) requests, return 200 with the above headers.

## Database Schema (recommended minimum)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  price INTEGER NOT NULL,
  description TEXT
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  package_id INTEGER REFERENCES packages(id),
  status VARCHAR(50) DEFAULT 'pending',
  comment TEXT,
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(100),
  provider_transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id),
  action VARCHAR(255),
  target_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Cloudflare Tunnel Setup

1. Install `cloudflared` on the VPS.
2. Create a tunnel: `cloudflared tunnel create fabrika-orders`
3. Configure the tunnel to proxy `orders.fabrika.chat` → `http://127.0.0.1:10052`.
4. Set DNS CNAME for `orders.fabrika.chat` to the tunnel ID.
5. The API service listens on `127.0.0.1:10052` only — never on `0.0.0.0`.
6. PostgreSQL listens on `127.0.0.1:5432` or internal Docker network only.

## VPS Deployment

```bash
# Example directory structure
/home/administrator/fabrika-order-api/
├── .env          # DATABASE_URL, TELEGRAM_BOT_TOKEN, PORT=10052
├── src/          # Backend service code
└── ...

# The API must bind to 127.0.0.1 only
# Cloudflare Tunnel proxies public traffic to 127.0.0.1:10052
```

## What the Frontend Sends vs. What the Backend Trusts

| Field | Frontend sends | Backend trusts |
|---|---|---|
| `package_id` | ✅ | ✅ (looks up price from DB) |
| `comment` | ✅ | ✅ |
| `payment_method` | ✅ | ✅ |
| `price` | ❌ never sent | ✅ from DB only |
| `user_id` / `telegram_id` | ❌ never sent | ✅ from validated initData |
| `status` | ❌ never sent | ✅ server-set |
| `Authorization` | `tma <initData>` | ✅ validated with bot token |
