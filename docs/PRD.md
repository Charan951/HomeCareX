# Product Requirements Document (PRD) - HomeCareX

Version 1.1 · Updated 2026-09-24 · Delivery window: 4 weeks (20 working days) · Team: 8 developers

## 1. Executive Summary
HomeCareX is a digital on-demand home services marketplace connecting residential and commercial customers with certified service partners (plumbing, electrical, cleaning, appliance repair, pest control, painting, etc.).

## 2. Core User Personas & Roles
1. **Public Visitor**: Discovers service offerings, transparent pricing, testimonials, FAQs, and registers as a customer or partner.
2. **Customer**: Searches for localized home services, books immediate or scheduled appointments, tracks assigned partners live, pays securely, and reviews service delivery.
3. **Admin** (staff sub-roles: Super Admin, Operations Admin, Finance Admin, Support Agent): Oversees platform operations, verifies partner KYC, configures pricing & categories, reassigns bookings, issues payouts/refunds, and monitors audit logs.
4. **Partner**: Verified service professional who manages availability, accepts jobs, executes services with OTP verification, and tracks earnings.

## 3. Release Scope (1-month MVP)
The MVP focuses on three surfaces: **Public website, Customer dashboard, Admin dashboard**. The Partner dashboard UI is Phase 2.

| Area | MVP (this month) | Phase 2 |
|---|---|---|
| Public website | All pages, SEO, auth screens, lead capture | Blog, city landing pages |
| Customer | Booking flow, payments, wallet, tracking, bookings, reviews, support, referrals, profile, addresses | Subscriptions / AMC plans |
| Admin | Dashboard, customers, partners + KYC, categories, services, pricing, coupons, banners, bookings ops, payments, refunds, payouts, support desk, reports, settings, audit logs, roles & permissions | Advanced analytics, surge automation |
| Partner | Backend APIs only (jobs accept / start OTP / complete) so the booking lifecycle can be demonstrated | Full partner web dashboard (KYC, training, availability, earnings, SOS) |
| Platform | JWT auth + RBAC, Razorpay (test mode), email/SMS notifications, Socket.IO tracking | Stripe, push notifications |

## 4. Key User Journeys (MVP acceptance)
1. Visitor lands on Home → searches a service → views service details → registers → books.
2. Customer books: service + add-ons → address → slot → coupon → pays (Razorpay/wallet) → receives confirmation.
3. Admin sees the booking → assigns/reassigns a partner → status progresses → customer tracks live → completes.
4. Customer downloads invoice, rates the service, raises a support ticket if needed.
5. Admin processes refunds, reviews KYC, manages catalog/pricing/coupons, and every action is audit-logged.
6. Staff only see admin pages their role permits (RBAC).

## 5. Success Criteria
- The end-to-end booking journey (register → book → pay → assign → complete → review) works on staging.
- All public pages score Lighthouse Performance ≥ 90 and Accessibility ≥ 90 (mobile).
- Every protected API returns 401 without a token and 403 for a wrong role/permission.
- Responsive at 360px, 768px, and 1280px.

## 6. Platform Boundaries
- **Strictly Website-Only**: All interfaces run in responsive web browsers on desktop, tablet, and mobile. No native mobile applications.
- **Unified Frontend**: A single React application serves Public, Customer, Partner, and Admin roles, separated by route prefixes and role-based access control.

## 7. Out of Scope (this release)
Native apps, multi-language, multi-currency, partner web UI, and third-party marketplace integrations.
