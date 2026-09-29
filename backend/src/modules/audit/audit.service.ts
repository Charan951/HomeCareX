// export class AuditService {}

import {
  AuditLogQuery,
  CreateAuditLogInput,
} from "./audit.types";
import { AuditRepository } from "./audit.repository";

export class AuditService {
  private readonly repository: AuditRepository;

  constructor(repository = new AuditRepository()) {
    this.repository = repository;
  }

  async recordAudit(input: CreateAuditLogInput) {
    return this.repository.create(input);
  }

  async getAuditLogs(query: AuditLogQuery) {
    return this.repository.findMany(query);
  }
}

export const auditService = new AuditService();