# Technical Requirements Document (TRD) - HomeCareX

## 1. System Architecture
- **Frontend**: Single Page Application (SPA) built with React, Vite, TypeScript, and Tailwind CSS.
- **Backend**: Express.js REST API with TypeScript, structured into domain-driven modules.
- **Database**: MongoDB with Mongoose ODM for operational data storage.
- **Cache & Message Broker**: Redis for session caching, rate limiting, and BullMQ queues.
- **Real-time Engine**: Socket.IO for live location tracking, booking status changes, and notifications.
- **Media Storage**: AWS S3 / Cloudinary for KYC documents, service media, and receipts.

## 2. API Conventions
- Base Route Prefix: `/api/v1/`
- Standardized response envelope:
  ```json
  {
    "success": true,
    "message": "Operation completed",
    "data": {},
    "timestamp": "2026-09-23T11:42:00.000Z"
  }
  ```
- Authentication: HTTP-only cookies or Bearer JWT with refresh token rotation.
- Role-based Access Control (RBAC): Strictly enforced via middleware.
