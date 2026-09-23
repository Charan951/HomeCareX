# Product Requirements Document (PRD) - HomeCareX

## 1. Executive Summary
HomeCareX is a digital on-demand home services marketplace connecting residential and commercial customers with certified service partners (plumbing, electrical, cleaning, appliance repair, pest control, painting, etc.).

## 2. Core User Personas & Roles
1. **Customer**: Searches for localized home services, books immediate or scheduled appointments, tracks assigned partners live, pays securely, and reviews service delivery.
2. **Partner**: Verified service professional who manages availability, accepts job dispatches within service radiuses, executes services with OTP verification, and tracks earnings.
3. **Admin**: Oversees platform operations, verifies partner KYC, configures dynamic pricing & categories, reassigns bookings, issues payouts/refunds, and monitors audit logs.
4. **Public Visitor**: Discovers service offerings, transparent pricing, testimonials, FAQs, and registers as a customer or partner.

## 3. Platform Boundaries
- **Strictly Website-Only**: All interfaces operate within responsive web browsers on desktop, tablet, and mobile browsers. No native mobile applications.
- **Unified Frontend**: A single React application serves Public, Customer, Partner, and Admin roles segregated by route prefixes and role-based access control.
