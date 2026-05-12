# Backend progress (Back-ecom)

Last reviewed: 2026-05-10

## Done
- Express server bootstrapped (`Back-ecom/index.js`)
- Env loading via `dotenv`
- Basic middleware: `cors`, `express.json()`
- MongoDB connection setup with Mongoose (reads `MONGO_URI`)
- Swagger UI mounted at `/api-docs` (`Back-ecom/docs/swagger.js`)
- Health check endpoint: `GET /`
- Auth module implemented: register/login/verify-otp/refresh-token/logout/forgot-password/reset-password/me + Swagger (`Back-ecom/Routes/authRoutes.js`)
- JWT auth middleware (`Back-ecom/Middlewares/auth.js`)
- Admin module implemented (RBAC + Swagger): user management + seller verification (`Back-ecom/Routes/adminRoutes.js`)
- Admin seller activation API: `/api/admin/sellers/:id/status` (`Back-ecom/Routes/adminRoutes.js`)
- Products module implemented (public browse + SELLER/ADMIN manage): `Back-ecom/Routes/productRoutes.js`
- Cart module implemented (USER): `Back-ecom/Routes/cartRoutes.js`
- Orders module implemented (USER): `Back-ecom/Routes/orderRoutes.js`
- Seller module implemented (profile, my products, my orders, fulfillment updates): `Back-ecom/Routes/sellerRoutes.js`
- Payments module implemented (MVP MOCK provider): `Back-ecom/Routes/paymentRoutes.js`
- Uploads implemented: product image upload + static hosting (`Back-ecom/Routes/uploadRoutes.js`)
- Bulk product upload via Excel (.xlsx) for sellers (`Back-ecom/Routes/sellerRoutes.js`)
- Address module (USER): CRUD + default address (`Back-ecom/Routes/addressRoutes.js`)
- Catalog module: categories/brands with slugs (public list + admin manage) (`Back-ecom/Routes/catalogRoutes.js`)
- Admin seed script (`npm run seed:admin`) (`Back-ecom/scripts/seedAdmin.js`)
- Audit logs (admin/seller actions) (`Back-ecom/Model/AuditLog.js`)

## Partially done / needs cleanup
- Core domain models exist (users/products/cart/orders/payments), but many advanced features are still missing (categories, addresses, reviews, coupons, shipping, refunds, etc.).
- Some modules still need tightening for production (tests, audit logs, webhook-based payments, etc.).
- Audit logs are now stored, but admin/seller list APIs for audit logs are not added yet.
- Note: bulk Excel upload expects specific column names and currently inserts whatever image URLs are provided (no URL validation).

## Next (recommended order)
1. Create the first `ADMIN` user seed flow (or manual creation) and lock down admin promotion policy
2. Extend products further (variants, variant-wise stock/SKU/images, SKU uniqueness)
3. Add reviews/ratings (verified purchase) + rating aggregation
4. Add payment gateway integration (Razorpay/Stripe): create order intent + webhook verification (replace MOCK confirm)
5. Add coupons/discounts (expiry/usage limits/min order)
6. Add notifications (email/SMS/in-app)
7. Add tests (route-level smoke) and CI
