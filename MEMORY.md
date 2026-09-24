# Project Memory

## 1. Project Snapshot
- Monorepo: `frontend/` (React 18 + Vite + TS + Tailwind, react-query, zustand, react-router v6) and `backend/` (Express + TS, Mongoose, Redis/BullMQ, Socket.IO, zod).
- Website only, with no native apps. One SPA serves `/`, `/customer/*`, `/admin/*`, and `/partner/*`.
- API prefix `/api/v1`, using the standard envelope (see docs/TRD.md).

## 2. Architecture
- Backend domain modules live in `backend/src/modules/<domain>/<domain>.{routes,controller,service,repository,validation,types,constants}.ts`. As of 2026-09-24 every file is an empty stub.
- Frontend page folders exist for all roles in `frontend/src/pages/<role>/<Page>/index.tsx` (stubs).
- Docs: docs/PRD.md, FEATURE_DOCUMENT.md, TRD.md, ARCHITECTURE.md, PROJECT_PLAN.md.

## 4. Engineering Decisions
- 1-month MVP = Public + Customer + Admin. Partner web UI is Phase 2; only partner APIs ship in the MVP. (2026-09-24)
- RBAC uses a `resource:action` permission scheme with 6 system roles (customer, partner, super_admin, ops_admin, finance_admin, support_agent). Source of truth: `backend/src/modules/rbac/rbac.constants.ts`, mirrored in the frontend. (2026-09-24)
- Auth uses a 15-minute access JWT in memory plus a rotating 7-day httpOnly refresh cookie. (2026-09-24)

## 6. Current Work
- An 8-person, 4-week plan starts around 2026-09-28. The day-wise PDF is `HomeCareX_Project_Task_Plan.pdf` in the repo root; the markdown copy is docs/PROJECT_PLAN.md.
- Owners: Suresh = public site; Lokesh = auth + RBAC; Vahidha = admin core/analytics; Vaishnavi = admin catalog/pricing/booking ops; Upendra = backend core + deploy; Nanditha = customer dashboard; Ravi = payments/notifications/tracking; Nithya = UI kit, support, and QA.

## 12. Last Updated
2026-09-24
