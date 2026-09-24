# Technical Requirements Document (TRD) - HomeCareX

Updated 2026-09-24.

## 1. System Architecture
- **Frontend**: SPA built with React 18, Vite, TypeScript, and Tailwind CSS. Server state uses TanStack Query, client state uses Zustand, and routing uses React Router v6.
  Shared additions (installed in Week 1): `react-hook-form`, `zod`, `@hookform/resolvers`, `recharts`, `react-helmet-async`, `dayjs`, `sonner`.
- **Backend**: Express.js REST API with TypeScript, organised into domain modules (`src/modules/<domain>/<domain>.{routes,controller,service,repository,validation,types,constants}.ts`).
- **Database**: MongoDB (Atlas) with Mongoose.
- **Cache & queues**: Redis for the permission cache, rate limiting, last-known partner location, and BullMQ queues (notifications, payouts, reports).
- **Real-time**: Socket.IO, with JWT checked on the handshake. Rooms: `user:<id>`, `booking:<id>`, `admin`.
- **Media**: Cloudinary or AWS S3 for KYC documents, service media, and receipts.
- **Integrations**: Razorpay (test mode), SendGrid (email), Twilio (SMS; console stub in development), Google Maps (ETA; mock fallback).

## 2. API Conventions
- Base prefix: `/api/v1/`. Plural resource nouns. Admin endpoints live under `/api/v1/admin/*`.
- Response envelope (use the shared `sendSuccess` / `ApiError` helpers):
  ```json
  { "success": true, "message": "Operation completed", "data": {}, "timestamp": "2026-09-23T11:42:00.000Z" }
  ```
- Errors: `{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }` with the correct HTTP status (400, 401, 403, 404, 409, 422, 429, 500).
- Pagination: `?page=1&limit=20&sort=-createdAt&q=`. The response carries `data.items` and `data.meta { page, limit, total, pages }`.
- Every body, query, and params object is validated with Zod in `<domain>.validation.ts`.

## 3. Authentication
- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `/auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`.
- Access token: JWT, 15 minutes, kept in memory on the client and sent as `Authorization: Bearer`.
- Refresh token: 7 days, in an `httpOnly; Secure; SameSite=Strict` cookie. It is rotated on every refresh, stored hashed, and reuse revokes all of that user's sessions.
- Passwords are hashed with bcrypt (cost 12). The policy is at least 8 characters, including a letter and a digit. The account locks for 15 minutes after 5 failed logins.
- Password-reset OTP: 6 digits, stored hashed, expires in 10 minutes, maximum 5 attempts.

## 4. RBAC
- Roles (seeded, `isSystem: true`): `customer`, `partner`, `super_admin`, `ops_admin`, `finance_admin`, `support_agent`. Custom admin roles can be created from the admin UI.
- Permissions use the format `resource:action`, e.g. `bookings:read`, `bookings:reassign`, `refunds:approve`, `roles:manage`. The single source of truth is `backend/src/modules/rbac/rbac.constants.ts`, mirrored in `frontend/src/constants/permissions.ts`.
- Middleware chain: `authenticate` → `authorizeRoles(...roles)` and/or `requirePermissions(...perms)`. `super_admin` bypasses permission checks.
- Role → permission lookups are cached in Redis and invalidated when a role changes.
- Frontend guards: `ProtectedRoute` (auth + roles), `usePermission()`, and `<Can permission="...">`. The admin sidebar is filtered by permission. **The UI hides things; the backend enforces them.**
- Every admin write is recorded in `AuditLog` (actor, action, entity, entityId, before/after, ip, userAgent).

## 5. Core Data Models
User, Role, RefreshToken, Otp, Address, Category, Service (with add-ons and pricing rules), Booking (with status history), Payment, Wallet + WalletTransaction, Refund, Payout, Coupon, Banner, Review, Ticket, Notification, Lead, Setting, AuditLog.

Booking state machine: `PENDING_PAYMENT → CONFIRMED → ASSIGNED → EN_ROUTE → IN_PROGRESS → COMPLETED`. Cancellation (`CANCELLED`) is allowed from any state before `IN_PROGRESS`. Only `BookingService` changes the state.

## 6. Non-Functional Requirements
- Security: Helmet, a CORS allow-list, rate limits (auth: 10 requests/min/IP), input validation, no secrets in git (`.env.example` only).
- Performance: indexed queries, p95 API < 300 ms on staging, route-level code splitting, lazy images.
- Accessibility: WCAG 2.1 AA — labels, keyboard navigation, visible focus, 4.5:1 contrast.
- Responsive: 360 / 768 / 1280 px verified for every page.

## 7. Testing & Quality
- Backend: Jest + Supertest. Each module covers its happy path, validation failures, and the RBAC matrix (401/403).
- Frontend: TypeScript strict, ESLint clean, and a Playwright smoke test (register → book → pay → admin sees booking).
- Pull requests need 1 peer review plus the lead's approval. CI runs lint, type-check, and tests.

## 8. Git & Environments
- Branches: `main` (production), `develop` (integration), `feature/<name>-<task>`. Squash-merge into `develop`, and merge `develop` into `main` weekly after the Friday demo.
- Environments: local → staging (Render/Railway + MongoDB Atlas + Vercel) → production.
