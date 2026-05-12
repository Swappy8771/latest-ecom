# Backend development guide (Back-ecom)

Last updated: 2026-05-10

This document explains how to run and develop the backend, what modules exist, and how to extend them safely.

## Tech stack
- Node.js + Express
- MongoDB + Mongoose
- JWT auth (access + refresh)
- Swagger docs (OpenAPI) at `/api-docs`
- Multer for uploads (local disk)
- `xlsx` for Excel bulk import

## Project structure (current)
- `Back-ecom/index.js` — app bootstrap (middlewares, routes, DB connect, error handling)
- `Back-ecom/Model/*` — Mongoose models
- `Back-ecom/Controllers/*` — controller logic
- `Back-ecom/Routes/*` — routes + Swagger JSDoc blocks
- `Back-ecom/Middlewares/*` — auth/validation/audit middleware
- `Back-ecom/validators/*` — request validators (`express-validator`)
- `Back-ecom/utils/*` — helpers (tokens, upload, slug, excel parsing)
- `Back-ecom/scripts/*` — utility scripts (admin seeding)
- `Back-ecom/uploads/` — local uploaded files (served as static `/uploads/*`)

## Setup
1. Install dependencies:
   - `cd Back-ecom && npm i`
2. Configure environment:
   - Copy/edit `Back-ecom/.env`
3. Run the server:
   - Dev: `npm run dev`
   - Start: `npm start`

## Environment variables
Required:
- `MONGO_URI` — Mongo connection string
- `JWT_SECRET`, `JWT_EXPIRES_IN` (default code uses `15m` if unset)
- `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- `CLIENT_ORIGIN` — comma-separated allowed CORS origins

Optional / admin-seed:
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
- `ADMIN_SEED_CONFIRM=YES` (required when `NODE_ENV=production`)

Optional / safety switches:
- `ALLOW_ADMIN_PROMOTION=true` — allows promoting a user to `ADMIN` via admin API (disabled by default)

## API docs (Swagger)
- Open: `http://localhost:5000/api-docs`
- Swagger spec is generated from route/controller JSDoc blocks.

## Auth model (roles)
Roles:
- `USER` — customer
- `SELLER` — seller (must be approved to sell)
- `ADMIN` — platform admin

Seller verification gates:
- `verificationStatus === 'APPROVED'`
- `isVerifiedSeller === true`
- `status === 'ACTIVE'`
- `isVerified === true` (OTP verified)

## Key modules & endpoints (high level)

Auth (`/api/auth`)
- `POST /register` (creates user + OTP; returns `devOtp` in development)
- `POST /verify-otp`
- `POST /login` (access + refresh tokens)
- `POST /refresh-token`
- `POST /logout`
- `POST /forgot-password` (returns `devResetToken` in development)
- `POST /reset-password`
- `GET /me`

Admin (`/api/admin`) — requires `ADMIN`
- Users: list/get/update status/update role
- Sellers: list/update verification/update active/inactive

Catalog (`/api/catalog`)
- Public list: `GET /categories`, `GET /brands`
- Admin manage: `POST/PATCH /categories`, `POST/PATCH /brands`
- Uses slugs for SEO/filtering (`name -> slug`)

Products (`/api/products`)
- Public:
  - `GET /` supports `q`, `categorySlug`, `brandSlug`, price filters, pagination, and `sort`
  - `GET /:id` (ACTIVE only)
- Seller/Admin:
  - `POST /` create
  - `PATCH /:id` update (owner or admin)
  - `DELETE /:id` soft-remove (sets status `INACTIVE`)

Cart (`/api/cart`) — requires `USER`
- `GET /` my cart
- `POST /items` add
- `PATCH /items/:productId` change qty
- `DELETE /items/:productId` remove
- `DELETE /clear` clear

Orders (`/api/orders`) — requires `USER`
- `POST /` create order from cart (prevents overselling using Mongo transaction)
  - Accepts either `addressId` (preferred) OR `shippingAddress` (snapshot)
- `GET /` list my orders
- `GET /:id` order detail
- `POST /:id/cancel` cancel (only `PLACED`)

Addresses (`/api/addresses`) — requires `USER`
- CRUD + default address:
  - `GET /`
  - `POST /`
  - `PATCH /:id`
  - `DELETE /:id`
  - `PATCH /:id/default`

Seller (`/api/seller`) — requires `SELLER` (+ verified seller for selling/fulfillment actions)
- `GET /me`
- `PATCH /profile`
- `GET /products` (my products)
- `PATCH /products/:id/status`
- `POST /products/bulk-upload` (Excel upload)
- `GET /orders` (orders containing my items)
- `GET /orders/:id`
- `PATCH /orders/:id/items/:productId/status` (fulfillment)

Uploads (`/api/uploads`) — requires `SELLER|ADMIN`
- `POST /product-image` (multipart field `image`)
- Files served from `GET /uploads/<filename>`

Payments (`/api/payments`) — requires `USER`
- `POST /orders/:orderId/create` (creates a payment attempt; MVP provider is `MOCK`)
- `POST /orders/:orderId/confirm-mock` (dev/testing only)
- `GET /orders/:orderId` (status)

## Bulk product upload (Excel)
Endpoint:
- `POST /api/seller/products/bulk-upload` with multipart field `file` (`.xlsx`)

Supported columns (first sheet, header row expected):
- `title` (or `name`) (required)
- `price` (required)
- `stock` (required)
- `status` (`ACTIVE|INACTIVE|DRAFT`, default `ACTIVE`)
- `description`, `brand`, `category` (optional; category/brand IDs should be set later via APIs)
- `imageUrl` (single) or `images` (comma/space separated)
- `sku`, `lowStockThreshold`
- `tags` (space/comma separated)

If `imageUrl/images` is missing:
- Product is created with `images: []`
- Upload later via `/api/uploads/product-image`, then update product `images` via `PATCH /api/products/:id`

## Admin seeding
Create the first admin user using:
- `cd Back-ecom && npm run seed:admin`

Env required:
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (and optional `ADMIN_NAME`)

In production:
- also set `ADMIN_SEED_CONFIRM=YES`

## Audit logging
Some admin/seller mutation endpoints write audit logs to MongoDB.
- Model: `Back-ecom/Model/AuditLog.js`
- Middleware: `Back-ecom/Middlewares/auditLog.js`

Note: there is currently no API to list/search audit logs; add an admin-only route when needed.

## Production notes / next upgrades
- Replace MOCK payments with Razorpay/Stripe (create intent + webhook verification).
- Add product variants (variant-wise SKU/stock/images).
- Add reviews (verified purchase), coupons, returns/refunds, shipping/tracking.
- Add testing + CI (route-level smoke tests are a good start).

