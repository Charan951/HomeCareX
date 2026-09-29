import { Request, Response } from "express";
import { auditService } from "./audit.service";
import { parseAuditQuery } from "./audit.validation";

export class AuditController {
  async getAuditLogs(req: Request, res: Response) {
    try {
      const query = parseAuditQuery(
        req.query as Record<string, unknown>
      );

      const result = await auditService.getAuditLogs(query);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit logs",
      });
    }
  }
}

export const auditController = new AuditController();
