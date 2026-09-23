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
All operations reside in `modules/bookings/booking.service.ts` gated by RBAC.
