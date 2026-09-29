// import { Router } from 'express';
// export const auditRoutes = Router();

import { Router } from "express";
import { auditController } from "./audit.controller";

export const auditRoutes = Router();

auditRoutes.get(
  "/audit-logs",
  auditController.getAuditLogs.bind(auditController)
);
