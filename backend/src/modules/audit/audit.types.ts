// export interface AuditTypes {}

export type AuditResult = "Success" | "Failed";

export interface CreateAuditLogInput {
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip: string;
  result: AuditResult;
}

export interface AuditLogQuery {
  actor?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
