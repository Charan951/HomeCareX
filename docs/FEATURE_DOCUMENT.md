# Feature Specification Document - HomeCareX

## 1. Public Website
- Landing Page with hero search, popular categories, and promotional banners.
- Service catalog exploration and granular service detail pages.
- Authentication: Login, Registration, Forgot Password, Reset Password with OTP/email.
- About Us, Contact Us with lead capture form, FAQ, Terms, and Privacy Policy.

## 2. Customer Dashboard (`/customer/*`)
- Overview Dashboard: Active bookings, quick actions, recommended services.
- Category & Service catalog with localized filters and search.
- Multi-step Booking flow: Address selection, schedule slot, add-on selection, coupon redemption.
- Real-time Partner Tracking: Live map visualization, ETA, and partner contact.
- Payment Management: Saved methods, transaction receipts, in-app wallet.
- Booking History: Completed, upcoming, and canceled service records with invoice downloads.
- Reviews & Ratings: Star ratings and structured feedback post-service.
- Support: In-app support tickets and help center.
- Referrals & Promotions: Referral code generation and reward tracking.

## 3. Partner Dashboard (`/partner/*`)
- Partner Dashboard: Daily job schedule, performance metrics, active job status.
- KYC & Onboarding: Identity proof upload, background verification submission, bank account linking.
- Training Modules: Standard operating procedures and safety compliance guidelines.
- Availability & Service Radius: Geofence and working hours configuration.
- Job Dispatch: Incoming booking requests with accept/reject timers.
- Active Job Execution: Turn-by-turn navigation, customer arrival confirmation, start-job OTP validation, checklist completion, extra parts charge requests, end-job completion.
- Earnings & Payouts: Detailed earnings breakdown, commission deductions, payout history, bank transfer requests.
- SOS & Safety: Instant emergency alert trigger notifying admin and emergency contacts.

## 4. Admin Portal (`/admin/*`)
- Executive Dashboard: Real-time GMV, active bookings, partner utilization, customer retention.
- Partner Management & KYC Verification: Document inspection, approval/rejection workflows, suspension.
- Customer Management: User profiles, booking history, lifetime value.
- Service & Category Hierarchy: Dynamic taxonomy management, icon/media assets, description.
- Dynamic Pricing Engine: Base fares, surge pricing, hourly rates, fixed rates, cancellation fees.
- Booking Operations: Global booking view, manual reassignments, status overrides.
- Financial Management: Payment transactions, partner payout batches, refund processing.
- Marketing & Promotions: Coupon codes, discount rules, campaign banners.
- Support Desk: Ticket assignment, resolution tracking, customer satisfaction metrics.
- Audit & Security: Immutable system audit logs, role-based access control (RBAC), security settings.
