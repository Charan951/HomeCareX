# System Architecture & Guidelines - HomeCareX

## 1. High-Level Blueprint
```
[Browser Client: React SPA]
  ├── Public Website (/)
  ├── Customer Dashboard (/customer/*)
  ├── Partner Dashboard (/partner/*)
  └── Admin Dashboard (/admin/*)
        │
        ▼ (HTTPS REST / WSS)
[/api/v1/* API Gateway & Middlewares]
  ├── Auth & RBAC Guard
  ├── Rate Limiter
  └── Input Validation (Zod)
        │
        ▼
[Domain Modules] ─── (MongoDB / Mongoose)
  ├── Auth, Users, Customers, Partners
  ├── Bookings, Matching, Pricing
  ├── Payments, Payouts, Coupons
  └── Tickets, Notifications, Reports
        │
  ├── [Redis & BullMQ Background Workers]
  ├── [Socket.IO Real-time Tracking & Alerts]
  └── [External Integrations: Razorpay, Stripe, Twilio, S3]
```

## 2. Shared Business Logic Principle
Business logic is centralized in backend domain modules and NEVER duplicated across roles.
- Customer creates booking -> `BookingService.createBooking()`
- Partner accepts booking -> `BookingService.acceptBooking()`
- Admin reassigns booking -> `BookingService.reassignBooking()`
All operations reside in `modules/bookings/bookings.service.ts` gated by RBAC.

## 3. Request Pipeline
`helmet → cors → rateLimit → json/cookieParser → authenticate → authorizeRoles / requirePermissions → validate(zod) → controller → service → repository → Mongo`
Errors bubble to `error.middleware.ts`, which formats the standard envelope. Admin writes call `auditService.log()`.

## 4. Frontend Structure
- `layouts/` — Public, Customer, Admin (Partner in Phase 2)
- `routes/` — `AppRoutes` composes the role route files; `ProtectedRoute` guards by role
- `components/ui` — design-system primitives (owned by the UI-kit owner; reuse them, don't fork)
- `features/<domain>` — API hooks (react-query), stores, and domain components
- `pages/<role>/<Page>` — route screens only; no business logic
- `constants/permissions.ts` — mirrors the backend permission list

## 5. Real-time Flow
Partner location → `tracking.socket` → Redis (last location) → emitted to `booking:<id>`. The customer Tracking page subscribes to it.
Booking status changes → `BookingService` → `NotificationService` (BullMQ) → in-app event, email, and SMS.
