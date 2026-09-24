# HomeCareX - 1-Month Project Plan

Generated with the day-wise PDF `HomeCareX_Project_Task_Plan.pdf` (repo root). 8 developers, 20 working days, focus on Public, Customer, and Admin; Partner UI is Phase 2.

## Team

| Member | Role | Owns |
|---|---|---|
| Jakkala Suresh | Public Website (full-stack light) | All public pages, SEO, auth screens UI, contact lead API |
| Devangam Lokesh | Auth & RBAC (backend + frontend) | JWT auth, roles/permissions, guards, admin Roles & Permissions page |
| D. Vahidha | Admin Dashboard - Core & Analytics | Admin layout, dashboard KPIs, customers, partners/KYC, audit logs, reports, settings |
| Vaishnavi Chavan | Admin - Catalog, Pricing & Operations | Categories, services, pricing, coupons, banners, bookings operations |
| M. Upendra | Backend Core Domain | API bootstrap, catalog, pricing engine, addresses, bookings lifecycle, deployment |
| Nanditha Vaibhavi | Customer Dashboard | Customer layout, dashboard, booking flow, bookings, addresses, profile, reviews UI |
| T. Ravi | Payments, Notifications & Tracking | Razorpay, wallet, refunds, payouts, notifications, Socket.IO tracking, admin finance pages |
| Nithya Vaibhavi Panjala | UI Kit, Support & QA Lead | Design system, tickets/reviews/referrals APIs + UI, admin support desk, QA & E2E |

## Milestones

| Week | Dates | Theme | Exit criteria |
|---|---|---|---|
| 1 | Sep 28 - Oct 2 | Foundations & UI with mock data | Repo runs for everyone, UI kit ready, backend bootstrap + auth/RBAC core, all screens built on mock data. |
| 2 | Oct 5 - Oct 9 | Backend APIs & remaining screens | All P0 APIs available on develop and tested in Postman; all remaining screens built. |
| 3 | Oct 12 - Oct 16 | Integration | Every screen wired to real APIs; end-to-end booking journey works on staging. |
| 4 | Oct 19 - Oct 23 | Hardening, QA & release | RBAC gating, responsive + a11y pass, regression QA, deployment, docs, UAT demo. |

## Working agreement

- Daily stand-up 10:00 (15 min): yesterday / today / blockers. End-of-day: push branch + update task board.
- Branches: feature/<name>-<task> -> PR to develop; 1 peer review + lead approval; squash merge.
- Friday 4 PM demo of the week's outputs on develop/staging; develop -> main after demo.
- API contract first: backend owner posts request/response JSON in the channel before frontend integration (Week 2 Day 1).
- Definition of Done: works on 360/768/1280, loading/empty/error states, typed (no any), lint clean, permission-gated, PR reviewed.

## Dependencies

- Day 1 blockers: Nithya (tokens + deps) and Upendra (backend bootstrap) merge by end of Day 1; Lokesh auth APIs by Day 5.
- Suresh depends on Upendra (catalog APIs, W2), Lokesh (auth, W1-W2), Vaishnavi (banners, W2), Nithya (reviews, W2).
- Nanditha depends on Upendra (pricing, bookings), Vaishnavi (coupon validate), Ravi (checkout), Nithya (reviews).
- Vahidha & Vaishnavi depend on Lokesh's <Can>/ProtectedRoute (W3 D12) for gating in W4.
- Partner web UI is Phase 2; lifecycle is demoed via Upendra's partner APIs + Ravi's location simulator.

## Day-wise tasks

### Jakkala Suresh - Public Website (full-stack light)

| Day | Task | Output |
|---|---|---|
| W1 D1 | Setup: clone, run frontend, read PRD/Feature doc. Build PublicLayout: sticky Header (logo, nav, Login/Register), mobile menu drawer, Footer (links, contact, socials). | PublicLayout renders on every public route; mobile menu opens/closes; PR raised. |
| W1 D2 | Wire PublicRoutes for all public pages. Create missing folders: pages/public/FAQ, Terms, Privacy, NotFound, Unauthorized. Scroll-to-top on route change. | Every public URL navigable; unknown URL shows 404. |
| W1 D3 | Home part 1: hero with service search + pincode input, popular categories grid (mock data in constants), trust strip. | Hero + categories responsive at 360/768/1280. |
| W1 D4 | Home part 2: How it works (3 steps), promo banner slider, testimonials, stats, Become-a-Partner CTA, final CTA. | Complete Home page on mock data. |
| W1 D5 | Services listing: category filter chips, search box, sort (popular/price), ServiceCard grid, empty state; query params in URL. | /services?category=&q= filters work on mock data. FRIDAY DEMO. |
| W2 D6 | Service Details: image gallery, title/rating/price, duration, inclusions & exclusions, FAQs accordion, reviews block, sticky Book Now -> /login?returnUrl=. | /services/:slug page complete on mock data. |
| W2 D7 | About Us (story, mission, trust & safety, team) and Contact Us (form: name, email, phone, city, message with zod validation, office info, map embed). | About + Contact pages; form shows field errors. |
| W2 D8 | Backend: Lead model + POST /api/v1/public/leads (zod, rate limit) + GET /admin/leads (permission leads:read). FAQ page (search + grouped accordion), Terms, Privacy pages. | Lead saved in Mongo via Postman; FAQ/Terms/Privacy live. |
| W2 D9 | Login + Register UI (react-hook-form + zod): customer register (name, email, phone, password, referral code), show/hide password, partner interest form. | Auth screens with validation on mock API. |
| W2 D10 | Forgot Password (email) -> Verify OTP (6 boxes, resend timer) -> Reset Password (new + confirm). 404 & 403 pages. | Full reset flow on mock API. FRIDAY DEMO. |
| W3 D11 | Integrate Login/Register with Lokesh's /auth APIs; server error display; redirect by role (customer -> /customer, admin -> /admin) and honour returnUrl. | Real login/register works end-to-end. |
| W3 D12 | Integrate forgot/verify/reset APIs and Contact form -> /public/leads; success toasts. | Password reset works with real OTP (console/email). |
| W3 D13 | Integrate Services + Service Details with Upendra's GET /categories, /services, /services/:slug; skeleton loaders, error + empty states. | Public catalog shows live DB data. |
| W3 D14 | Home: categories + banners from API (Vaishnavi's GET /banners), search submits to /services?q=&pincode=; reviews on details from Nithya's API. | Home fully data-driven. |
| W3 D15 | SEO: react-helmet-async title/description/OG per page, JSON-LD (Organization, Service), robots.txt, sitemap.xml, favicon + manifest. | View-source shows unique meta per page. FRIDAY DEMO. |
| W4 D16 | Responsive pass at 360/768/1280 + accessibility: labels, alt text, focus-visible, keyboard nav, contrast >= 4.5:1. | Checklist signed off for all public pages. |
| W4 D17 | Performance: route lazy loading, WebP images, loading=lazy, font preloading. Run Lighthouse (mobile). | Lighthouse Perf >= 90, A11y >= 90, SEO >= 95 on Home & Services. |
| W4 D18 | Fix QA bugs; cross-browser check Chrome, Edge, Firefox, Safari iOS. | All public P0 bugs closed. |
| W4 D19 | Write docs/pages/PUBLIC.md (routes, components, APIs used, screenshots). | Doc merged. |
| W4 D20 | UAT support + final demo of the public site. | Public site signed off on staging. |

### Devangam Lokesh - Auth & RBAC (backend + frontend)

| Day | Task | Output |
|---|---|---|
| W1 D1 | Setup (Mongo Atlas/local, .env). Write docs/RBAC.md: roles list, permission list (resource:action) and role x permission matrix. | RBAC.md matrix reviewed & approved by lead. |
| W1 D2 | Models: User (name, email, phone, passwordHash, role ref, status, failedLogins, lockUntil), Role (name, slug, permissions[], isSystem), RefreshToken (userId, tokenHash, family, expiresAt, revokedAt), Otp. Create modules/rbac/* files + rbac.constants.ts. | Models compile; indexes on email/phone unique. |
| W1 D3 | Seed script src/seed/rbac.seed.ts: 6 system roles + super admin from env. npm script `seed`. Idempotent (upsert). | `npm run seed` twice -> no duplicates; roles visible in DB. |
| W1 D4 | POST /auth/register (customer role), POST /auth/login (bcrypt compare, lockout after 5 fails), issue access JWT (15m) + refresh cookie (7d). Zod validation, envelope. | Postman: register/login return tokens; wrong password -> 401. |
| W1 D5 | POST /auth/refresh (rotation + reuse detection), POST /auth/logout (revoke), GET /auth/me (user + role + permissions[]). | Refresh rotates; replay of old token revokes family. FRIDAY DEMO. |
| W2 D6 | Middleware: authenticate (Bearer/cookie -> req.user), authorizeRoles(...roles), requirePermissions(...perms) with Redis cache (fallback in-memory). super_admin bypass. | Unit tests for the 3 middlewares pass. |
| W2 D7 | Forgot password: /auth/forgot-password (hashed OTP, 10m, 5 attempts), /auth/verify-otp (returns short reset token), /auth/reset-password. Email via SendGrid integration (console in dev). Rate limit auth routes. | Full reset flow in Postman; 11th request/min -> 429. |
| W2 D8 | RBAC admin APIs: GET /admin/permissions, GET/POST/PATCH/DELETE /admin/roles, GET /admin/staff, POST /admin/staff (invite), PATCH /admin/users/:id/role. System roles protected. Audit log on each change. | Role CRUD works; deleting system role -> 409. |
| W2 D9 | Guard template: apply guards to every module router skeleton; write modules/rbac/README.md (how other devs protect a route). Setup Jest + Supertest + mongodb-memory-server. | Test runner green; team notified with usage snippet. |
| W2 D10 | Tests: auth flows + RBAC matrix (each role x sample endpoint -> 200/401/403) table-driven. | `npm test` shows matrix passing. FRIDAY DEMO. |
| W3 D11 | Frontend: services/api.ts axios instance (baseURL, withCredentials), interceptors: attach token, on 401 call /auth/refresh once and replay queued requests. features/auth/authStore.ts (zustand). | Expired token auto-refreshes transparently. |
| W3 D12 | AuthContext + useAuth(), routes/ProtectedRoute.tsx (auth + roles), RoleRedirect, hooks/usePermission.ts, components/common/Can.tsx, constants/permissions.ts, Unauthorized page hookup. | Guards usable by all devs; documented in PR. |
| W3 D13 | Wire AppRoutes: /customer/* -> customer, /admin/* -> admin roles, /partner/* -> partner. Filter AdminLayout sidebar by permission (with Vahidha). Silent refresh on page load. | Customer cannot open /admin (403 page); refresh keeps session. |
| W3 D14 | Admin Roles & Permissions page: roles table, create/edit role with permission checkbox grid grouped by module (select-all per module), delete custom role, confirm dialogs. | Role created in UI changes access immediately. |
| W3 D15 | Admin Staff page (in RolesPermissions tab): list staff, invite staff with role, change role, deactivate. Logout-all-sessions. | Ops admin created from UI can only see ops pages. FRIDAY DEMO. |
| W4 D16 | Security hardening: helmet, CORS allow-list, cookie flags, password policy, lockout, secrets check, npm audit. | Security checklist in docs/RBAC.md ticked. |
| W4 D17 | Run manual role x route matrix for all 6 roles on all admin/customer routes (UI + API). Fix any leaks. | Matrix sheet: zero unauthorised access. |
| W4 D18 | Help teammates gate endpoints/pages; fix auth bugs from QA. | All auth/RBAC bugs closed. |
| W4 D19 | Final docs: RBAC.md, auth API reference, Postman collection in docs/postman/auth.json. | Docs merged. |
| W4 D20 | UAT + demo: login as each role and show what each can/cannot do. | RBAC signed off. |

### D. Vahidha - Admin Dashboard - Core & Analytics

| Day | Task | Output |
|---|---|---|
| W1 D1 | Setup. AdminLayout: collapsible sidebar with grouped nav (Overview, Operations, Catalog, Finance, Support, System), topbar (search, bell, profile menu), breadcrumbs, mobile drawer. | Admin shell renders all admin routes. |
| W1 D2 | Shared admin components (on Nithya's UI kit): DataTable (sort, paginate, search, column filters, row actions), StatCard, PageHeader, StatusBadge, ConfirmDialog. | Components in components/tables & common with usage example. |
| W1 D3 | Executive Dashboard (mock): KPI cards (GMV, bookings today, active partners, new customers, cancellation %), bookings trend line (recharts), category split donut, recent bookings table, date-range picker. | Dashboard page on mock data. |
| W1 D4 | Customers list (search, status filter, pagination) + Customer detail (profile, addresses, bookings, total spend/LTV, block/unblock). | Customer screens on mock data. |
| W1 D5 | Partners list (KYC status filter) + KYC review screen: document viewer (image/PDF), checklist, approve / reject with reason, suspend. | Partner/KYC screens on mock data. FRIDAY DEMO. |
| W2 D6 | Backend reports: GET /admin/dashboard/summary and /admin/dashboard/trends?from&to (Mongo aggregation over bookings/payments). Permission dashboard:read. | Summary numbers match seeded data. |
| W2 D7 | Backend: GET /admin/customers (search, paginate), GET /admin/customers/:id (booking stats, LTV), PATCH /admin/customers/:id/status. | Postman collection for customers. |
| W2 D8 | Backend: GET /admin/partners, GET /admin/partners/:id, PATCH /:id/kyc (approve/reject+reason, notify), PATCH /:id/status. Audit logged. | KYC decision stored + audit entry. |
| W2 D9 | Audit module: auditService.log(req, action, entity, before, after) helper for all devs; GET /admin/audit-logs (actor, action, entity, date filters). | Helper shared; logs listable. |
| W2 D10 | Audit Logs page: filters, table, detail drawer with before/after JSON diff. | Audit UI on real API. FRIDAY DEMO. |
| W3 D11 | Integrate dashboard with API (react-query), skeletons, empty/error states, date range. | Live dashboard on staging. |
| W3 D12 | Integrate customers list/detail/block. | Customers module done. |
| W3 D13 | Integrate partners + KYC review (documents from Cloudinary/S3). | KYC approve/reject works end-to-end. |
| W3 D14 | Reports page: bookings, revenue, partner performance tables + GET /admin/reports/:type/export (CSV stream). | CSV downloads open in Excel. |
| W3 D15 | Settings page + Setting model/API: commission %, GST %, cancellation window & fee, support contacts, booking slot config. | Settings persist and are read by pricing. FRIDAY DEMO. |
| W4 D16 | Gate every admin page/action with Lokesh's <Can> / ProtectedRoute; verify with ops/finance/support roles. | Each role sees only allowed menu items. |
| W4 D17 | Responsive (tables scroll inside container, drawer nav) + a11y for admin screens. | Admin usable at 768px and 1280px. |
| W4 D18 | Fix QA bugs. | Admin core P0 bugs closed. |
| W4 D19 | docs/pages/ADMIN.md (modules, APIs, permissions per page). | Doc merged. |
| W4 D20 | UAT + demo of admin dashboard. | Signed off. |

### Vaishnavi Chavan - Admin - Catalog, Pricing & Operations

| Day | Task | Output |
|---|---|---|
| W1 D1 | Setup. Agree Category/Service/Pricing data shape with Upendra; wireframe admin catalog, pricing and bookings screens. | Wireframes shared in team channel. |
| W1 D2 | Categories page: tree (parent/sub), create/edit drawer (name, slug, icon upload, description, active), drag or up/down reorder. | Categories UI on mock data. |
| W1 D3 | Services page: list + filters; create/edit form (category, name, slug, description, images, duration, inclusions, exclusions, FAQs, status). | Services UI on mock data. |
| W1 D4 | Pricing page: pricing type (fixed/hourly), base price, add-ons, surge windows (days/time + multiplier), cancellation fee; live price preview calculator. | Pricing UI on mock data. |
| W1 D5 | Coupons page: list + create/edit (code, %/flat, max discount, min order, validity, total & per-user limit, categories). | Coupons UI on mock data. FRIDAY DEMO. |
| W2 D6 | Bookings Operations page: global list with filters (status, date, category, city), booking detail drawer with status timeline. | Bookings ops UI on mock data. |
| W2 D7 | Booking actions: assign/reassign partner (picker filtered by category & pincode), status override with reason, cancel + trigger refund. | Action dialogs complete. |
| W2 D8 | Backend marketing module: Banner model, admin CRUD /admin/banners, public GET /banners?placement=. Marketing page UI (image, link, placement, schedule). | Banners served to public Home. |
| W2 D9 | Backend coupons module: CRUD /admin/coupons + POST /coupons/validate (rules engine: dates, limits, min order, category) returning discount. | Validate returns correct discount/errors. |
| W2 D10 | Jest tests for coupon rules (expired, limit reached, min order, per-user). | Tests green. FRIDAY DEMO. |
| W3 D11 | Integrate Categories + Services with Upendra's admin APIs incl. image upload. | Catalog managed from admin reflects on public site. |
| W3 D12 | Integrate Pricing with pricing APIs; preview uses POST /pricing/quote. | Price changes reflect in customer quote. |
| W3 D13 | Integrate Coupons + Marketing banners. | Coupon created in admin works in checkout. |
| W3 D14 | Integrate Bookings Operations with admin booking APIs (list, detail, reassign, override, cancel). | Admin can reassign a live booking. |
| W3 D15 | Bulk actions (activate/deactivate services), CSV export of bookings list. | Bulk + export work. FRIDAY DEMO. |
| W4 D16 | Permission-gate catalog/pricing/bookings actions (<Can>). | Support agent cannot edit pricing. |
| W4 D17 | Responsive + a11y pass for her screens. | Checklist signed. |
| W4 D18 | Fix QA bugs. | P0 bugs closed. |
| W4 D19 | Add catalog/pricing/bookings sections to docs/pages/ADMIN.md. | Doc merged. |
| W4 D20 | UAT + demo. | Signed off. |

### M. Upendra - Backend Core Domain

| Day | Task | Output |
|---|---|---|
| W1 D1 | Backend bootstrap: app.ts (helmet, cors, morgan, json, cookie-parser), zod env config, Mongo connect, error middleware, ApiError, asyncHandler, sendSuccess envelope, GET /api/v1/health. | Server runs; health 200; conventions shared. |
| W1 D2 | validate(zod) middleware, pagination/query utils, logger, upload middleware (multer -> Cloudinary/S3), .env.example, backend README. | Other devs can build modules on the base. |
| W1 D3 | Models: Category, Service (add-ons, pricing rules), Address, Booking (statusHistory). Indexes. Seed 10 categories + 40 services. | `npm run seed:catalog` fills DB. |
| W1 D4 | Categories API: public GET /categories (tree), GET /categories/:slug; admin CRUD + reorder + icon upload. | Postman tests pass. |
| W1 D5 | Services API: public GET /services (category, q, minPrice, maxPrice, sort, paginate), GET /services/:slug; admin CRUD. | Postman collection shared. FRIDAY DEMO. |
| W2 D6 | PricingEngine.calculate({serviceId, addOns, slot, couponCode}) -> base, add-ons, surge, discount, GST, total. POST /pricing/quote. | Quote returns full breakdown. |
| W2 D7 | Addresses API (customer CRUD, set default, geo point) + GET /serviceability?pincode=. | Address CRUD works for customer only. |
| W2 D8 | BookingService.createBooking (slot check, price lock, PENDING_PAYMENT), state machine guard, GET /bookings (mine), GET /bookings/:id. | Booking created from Postman. |
| W2 D9 | Slots API GET /services/:id/slots?date=, cancel (fee by window) and reschedule rules. | Cancel fee computed per settings. |
| W2 D10 | Admin booking APIs: list+filters, detail, assign/reassign, status override (audit). MatchingEngine v1: nearest available partner by category + pincode. | Admin can reassign via API. FRIDAY DEMO. |
| W3 D11 | Partner minimal APIs (no UI): GET /partner/jobs, accept, start (OTP from customer), complete, POST location (to Ravi's socket). | Full lifecycle demo-able via Postman. |
| W3 D12 | Invoice PDF (pdfkit) GET /bookings/:id/invoice for completed bookings. | Invoice downloads with GST breakdown. |
| W3 D13 | Contract support: fix API mismatches found in integration by frontend devs. | Integration blockers cleared. |
| W3 D14 | Performance: indexes review, lean queries, Redis cache for catalog (invalidate on admin change). | Catalog p95 < 150 ms. |
| W3 D15 | Jest/Supertest: booking lifecycle + pricing tests. | Tests green. FRIDAY DEMO. |
| W4 D16 | Deploy backend to staging (Render/Railway), MongoDB Atlas, Redis cloud, env vars, CORS. | Staging API URL live. |
| W4 D17 | Seed staging data (users per role, catalog, sample bookings). Deploy frontend to Vercel with Lokesh. | Staging usable by QA. |
| W4 D18 | Fix QA bugs. | Backend P0 bugs closed. |
| W4 D19 | API docs: Postman collection for all modules in docs/postman/, backend README. | Docs merged. |
| W4 D20 | UAT + release to production. | Production live. |

### Nanditha Vaibhavi - Customer Dashboard

| Day | Task | Output |
|---|---|---|
| W1 D1 | Setup. CustomerLayout: sidebar + topbar on desktop, bottom tab bar on mobile, profile menu, notification bell slot. | Customer shell renders all customer routes. |
| W1 D2 | Customer Dashboard (mock): greeting, active booking card, quick actions, upcoming bookings, recommended services. | Dashboard on mock data. |
| W1 D3 | Categories & Services pages inside dashboard (reuse Suresh's ServiceCard), search + filters. | Browse works on mock data. |
| W1 D4 | Booking flow steps 1-2: service & add-ons selection; address step (select saved / add new inline). | Steps 1-2 with validation. |
| W1 D5 | Booking flow steps 3-4: date + slot picker, review page with price summary and coupon input, Confirm & Pay button. | Full booking wizard on mock data. FRIDAY DEMO. |
| W2 D6 | Addresses page (CRUD, default) + Profile page (edit details, avatar, change password). | Screens complete on mock data. |
| W2 D7 | My Bookings: tabs Upcoming / Completed / Cancelled, booking cards, pagination, empty states. | Bookings list on mock data. |
| W2 D8 | Booking Details: status stepper/timeline, partner card, price breakdown, cancel & reschedule dialogs, download invoice, Track button. | Details page on mock data. |
| W2 D9 | Reviews: rate completed booking (stars, tags, comment) + My Reviews list. Notifications page UI. | Screens complete. |
| W2 D10 | Booking draft store (zustand, persisted) so wizard survives refresh; step guard. | Refresh keeps wizard state. FRIDAY DEMO. |
| W3 D11 | Integrate dashboard + catalog with real APIs (react-query). | Live data on dashboard. |
| W3 D12 | Integrate booking wizard: slots, /pricing/quote, /coupons/validate, POST /bookings, then Ravi's Razorpay checkout. | Real booking + test payment succeeds. |
| W3 D13 | Integrate bookings list, details, cancel, reschedule, invoice download. | Bookings module end-to-end. |
| W3 D14 | Integrate addresses, profile, change password, reviews (Nithya's API). | All customer screens live. |
| W3 D15 | Loading / empty / error / offline states on every customer screen. | E2E booking demo on staging. FRIDAY DEMO. |
| W4 D16 | Mobile-first responsive pass (360px), bottom nav, touch targets >= 44px. | Customer app fully usable on phone. |
| W4 D17 | Accessibility pass: labels, focus order in wizard, aria-live for errors. | Checklist signed. |
| W4 D18 | Fix QA bugs. | P0 bugs closed. |
| W4 D19 | docs/pages/CUSTOMER.md (routes, flows, APIs). | Doc merged. |
| W4 D20 | UAT + demo of customer journey. | Signed off. |

### T. Ravi - Payments, Notifications & Tracking

| Day | Task | Output |
|---|---|---|
| W1 D1 | Setup. Design models: Payment, Wallet, WalletTransaction, Refund, Payout, Notification. Create Razorpay test keys. | Models compile; keys in .env (not git). |
| W1 D2 | POST /payments/order (Razorpay order for booking), POST /payments/verify (signature), POST /payments/webhook (signature + idempotent). Booking -> CONFIRMED on success. | Test payment confirms booking. |
| W1 D3 | Wallet: GET /wallet, GET /wallet/transactions, pay-with-wallet (atomic, Mongo transaction), credit helper for refunds/referrals. | Wallet balance never negative. |
| W1 D4 | Refunds: POST /admin/refunds (Razorpay refund or wallet credit), GET list, auto refund on eligible cancellation. | Refund status tracked. |
| W1 D5 | Customer Payments page (transactions, receipt view) + Wallet page (balance, history) on mock data. | Screens done. FRIDAY DEMO. |
| W2 D6 | Checkout component: load Razorpay script, open checkout, handle success/failure/dismiss; Payment success & failure screens. | Reusable <Checkout> handed to Nanditha. |
| W2 D7 | Notifications: NotificationService.send(user, type, data) -> in-app + email (SendGrid) + SMS (Twilio, console in dev) via BullMQ; GET /notifications, PATCH read/read-all. | Booking confirmed -> notification created. |
| W2 D8 | Socket.IO: JWT handshake auth, rooms user:<id>, booking:<id>, admin; emit booking status + notification events. | Client receives live events. |
| W2 D9 | Tracking: partner location event -> Redis last location -> broadcast to booking room; ETA via Google Distance Matrix (mock fallback); simulator script. | Simulated partner moves live. |
| W2 D10 | Customer Tracking page: map (Leaflet/Google), partner marker, ETA, call partner, status stepper. | Live tracking demo. FRIDAY DEMO. |
| W3 D11 | Admin Payments page: transactions list, filters (status, method, date), detail drawer. | Live on API. |
| W3 D12 | Admin Refunds page: queue, approve/reject, reason, status. | Refund processed from admin. |
| W3 D13 | Admin Payouts: partner earnings, commission deduction, generate payout batch (BullMQ job), mark paid, export. | Payout batch generated. |
| W3 D14 | Notification bell dropdown in Customer & Admin layouts (socket live + unread count); customer Notifications page integration. | Bell updates without refresh. |
| W3 D15 | Finish payment integration in booking wizard with Nanditha; wallet + Razorpay split. | E2E paid booking. FRIDAY DEMO. |
| W4 D16 | Edge-case tests: failed payment, retry, double click, webhook replay, refund > paid. | Tests green. |
| W4 D17 | Payment security review: server-side amount, signature checks, no secrets on client. | Checklist signed. |
| W4 D18 | Fix QA bugs. | P0 bugs closed. |
| W4 D19 | docs/modules/PAYMENTS.md + REALTIME.md. | Docs merged. |
| W4 D20 | UAT + demo. | Signed off. |

### Nithya Vaibhavi Panjala - UI Kit, Support & QA Lead

| Day | Task | Output |
|---|---|---|
| W1 D1 | Design tokens in tailwind.config (brand colours, type scale, spacing, radius, shadows), fonts, dark-mode base. Install shared deps (react-hook-form, zod, @hookform/resolvers, recharts, react-helmet-async, dayjs, sonner). | Tokens + deps merged first thing so all can start. |
| W1 D2 | UI kit components/ui: Button, Input, Select, Textarea, Checkbox, Radio, Switch, Badge, Avatar, Card, Tabs (all states: hover, focus, disabled, loading, error). | Primitives exported from components/ui. |
| W1 D3 | Dialog, Drawer, Dropdown, Tooltip, Toast (sonner), Skeleton, Spinner, EmptyState, ErrorState, Pagination. | Overlay + feedback components ready. |
| W1 D4 | FormField (label + error), DatePicker, FileUpload with preview, SearchInput; /dev/ui-kit showcase page. | Showcase page lists every component. |
| W1 D5 | components/ui/README.md usage guide; review teammates' PRs for UI-kit adoption. | No duplicated buttons/inputs. FRIDAY DEMO. |
| W2 D6 | Tickets backend: Ticket model (subject, category, bookingId, priority, status, messages[]); customer create/list/reply; admin list/assign/status/reply. | Tickets API in Postman. |
| W2 D7 | Reviews backend: POST /reviews (completed booking only, once), GET /services/:id/reviews (public), rating aggregates, admin hide/unhide. | Duplicate review -> 409. |
| W2 D8 | Referrals backend: code generated on register, apply code, reward to wallet (Ravi's helper) after first completed booking; GET /referrals/me. | Reward credited in test. |
| W2 D9 | Customer Support page (help center FAQs, my tickets, new ticket, thread) + Referrals page (code, copy/share, stats). | Screens on mock data. |
| W2 D10 | Admin Support Desk: ticket queue, filters, assign agent, conversation thread, resolve + CSAT. | Support desk UI. FRIDAY DEMO. |
| W3 D11 | Integrate customer + admin support with tickets API; socket event on reply. | Ticket round-trip works. |
| W3 D12 | Integrate reviews: customer rating, public service reviews (with Suresh), admin moderation. | Reviews live. |
| W3 D13 | Integrate referrals; test reward flow. | Referral reward visible in wallet. |
| W3 D14 | QA: write docs/qa/TEST_CASES.md (public, customer, admin, RBAC) with steps & expected results. | Test case sheet shared. |
| W3 D15 | Playwright smoke: register -> book -> pay (test) -> admin sees booking -> assign. | E2E runs in CI. FRIDAY DEMO. |
| W4 D16 | Regression round 1 on staging; log bugs as GitHub issues (severity, steps, screenshots). | Bug list triaged with lead. |
| W4 D17 | Regression round 2 + verify fixes. | Open P0 = 0. |
| W4 D18 | Retest all fixes; sign-off checklist per module. | QA sign-off report. |
| W4 D19 | Release notes + short user guide (customer & admin). | docs/RELEASE_NOTES.md merged. |
| W4 D20 | Coordinate UAT demo; record known issues for Phase 2. | Release approved. |
