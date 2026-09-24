# Feature Specification Document - HomeCareX

Updated 2026-09-24. Priority: **P0** = must ship in the 1-month MVP, **P1** = ship if time allows, **P2** = Phase 2.
Owners are listed in [PROJECT_PLAN.md](PROJECT_PLAN.md).

## 1. Public Website (`/`) — Owner: Jakkala Suresh
| Page | Route | Priority | Key content |
|---|---|---|---|
| Home | `/` | P0 | Hero with service + pincode search, popular categories, how it works, promo banners (from admin), testimonials, stats, become-a-partner CTA |
| Services | `/services` | P0 | Category chips, search, sort, service cards, empty state |
| Service Details | `/services/:slug` | P0 | Gallery, price, inclusions/exclusions, FAQs, reviews, Book Now (login redirect with return URL) |
| About Us | `/about` | P0 | Story, mission, trust & safety, team |
| Contact Us | `/contact` | P0 | Lead capture form (saved via API), office info, map |
| FAQ | `/faq` | P0 | Searchable accordion grouped by topic |
| Terms / Privacy | `/terms`, `/privacy` | P0 | Static legal content |
| Login / Register | `/login`, `/register` | P0 | Customer registration; partner interest form |
| Forgot / Reset Password | `/forgot-password`, `/reset-password` | P0 | Email → OTP → new password |
| 404 / 403 | `*`, `/unauthorized` | P0 | Friendly error pages |

## 2. Customer Dashboard (`/customer/*`)
- **P0** Overview dashboard: active booking, quick actions, upcoming bookings, recommended services.
- **P0** Category & service catalog with search and filters.
- **P0** Multi-step booking: service + add-ons → address → date/slot → review + coupon → payment.
- **P0** Payments: Razorpay checkout (test mode), transaction history, receipts. Wallet balance + transactions.
- **P0** Bookings: Upcoming / Completed / Cancelled tabs, details with status timeline, cancel/reschedule, invoice PDF.
- **P0** Live tracking: map with partner marker, ETA, status stepper (Socket.IO).
- **P0** Reviews & ratings after completion. Addresses CRUD. Profile + change password.
- **P1** Support tickets + help center. Referrals (code, share, rewards). Notifications page.

## 3. Admin Portal (`/admin/*`)
- **P0** Executive dashboard: GMV, bookings today, active partners, new customers, cancellation rate, trends.
- **P0** Customers: list, detail (bookings, lifetime value), block/unblock.
- **P0** Partners & KYC: list, document review, approve/reject with reason, suspend.
- **P0** Categories (tree, icons, ordering) and Services (content, media, FAQs).
- **P0** Pricing: fixed/hourly base price, add-ons, surge windows, cancellation fee, preview calculator.
- **P0** Bookings operations: global list, detail timeline, assign/reassign partner, status override, cancel + refund.
- **P0** Finance: payments, refunds queue, partner payout batches.
- **P0** Roles & Permissions (RBAC) and Audit logs.
- **P1** Coupons, marketing banners, support desk, reports + CSV export, platform settings.

## 4. Partner Dashboard (`/partner/*`) — Phase 2 (P2)
Backend only in the MVP: list assigned jobs, accept, start with OTP, complete, and send location updates.
The full UI (KYC upload, training, availability & radius, dispatch timers, earnings, payouts, SOS) is Phase 2.
The route folders already exist under `frontend/src/pages/partner/`.
