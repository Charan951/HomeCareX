# HomeCareX - On-Demand Home Services Platform

HomeCareX is an enterprise-grade, website-only platform for booking and managing verified home care, maintenance, and repair services.

## Architecture Overview

HomeCareX follows a clean separation of concerns:
- **Frontend**: Single React + Vite + TypeScript web application hosting:
  - Public Marketing & Onboarding Website (`/`)
  - Customer Self-Service Dashboard (`/customer/*`)
  - Partner Professional Dashboard (`/partner/*`)
  - Super Admin Management Portal (`/admin/*`)
- **Backend**: Modular Node.js + Express + TypeScript REST API and real-time Socket.IO engine with MongoDB, Redis, and BullMQ background workers.
- **Documentation**: Comprehensive PRD, Feature Matrix, TRD, and Architecture Specifications in `docs/`.

> **Note**: This is a strictly **WEBSITE-ONLY** platform. No mobile-native (iOS/Android/React Native/Flutter/Expo) code or folders exist.

## Workspace Directory Structure

```
HomeCareX/
├── frontend/             # Single React Web Frontend (Public + 3 Dashboards)
├── backend/              # Node.js + Express + TS Modular Backend
├── docs/                 # Product & Technical Specifications
├── .gitignore
├── README.md
└── package.json
```

## Developer Ownership & Team Assignment

| Team Member | Domain | Scope |
|---|---|---|
| **Frontend Dev 1** | Public Website | Landing, Services Directory, Auth flows, Static info |
| **Frontend Dev 2** | Customer Dashboard | Service booking, Tracking, Wallet, Profile, Reviews |
| **Frontend Dev 3** | Partner Dashboard | Onboarding/KYC, Job dispatch, Active job execution, Earnings, SOS |
| **Frontend Dev 4** | Admin Portal | Customers, Partners, Verification, Pricing, Reports, Audit |
| **Frontend Dev 5** | Shared UI & Integration | Design system, UI primitives, Layouts, API clients, Sockets |
| **Backend Dev 1** | Auth & Identity | Auth, Users, RBAC, Sessions, Security middleware |
| **Backend Dev 2** | Customer & Booking | Customer domain, Bookings lifecycle, Pricing engine |
| **Backend Dev 3** | Partner & Matching | Partner lifecycle, Matching engine, Geolocation radius |
| **Backend Dev 4** | Finance & Payouts | Razorpay/Stripe, Wallets, Partner payouts, Refunds |
| **Backend Dev 5** | Admin, Audit & Reports | Admin operations, Audit logging, Business reporting |
| **Backend Dev 6** | Realtime & Comms | Socket.IO, Tracking, Notifications, Chat, Queue workers |

## Git Branching Rules

Work strictly on feature-based branches:
- `feature/public/*`
- `feature/customer/*`
- `feature/partner/*`
- `feature/admin/*`
- `feature/backend/*`
