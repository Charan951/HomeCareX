// export class AuditRepository {}

import AuditLogModel from "../../models/AuditLog";
import {
  AuditLogQuery,
  CreateAuditLogInput,
} from "./audit.types";

export class AuditRepository {
  async create(input: CreateAuditLogInput) {
    return AuditLogModel.create(input);
  }

  async findMany(query: AuditLogQuery) {
    const filter: Record<string, unknown> = {};

    if (query.actor) {
      filter.actor = query.actor;
    }

    if (query.action) {
      filter.action = query.action;
    }

    if (query.entity) {
      filter.entity = query.entity;
    }

    if (query.entityId) {
      filter.entityId = query.entityId;
    }

    if (query.from || query.to) {
      const timestampFilter: Record<string, Date> = {};

      if (query.from) {
        timestampFilter.$gte = new Date(query.from);
      }

      if (query.to) {
        timestampFilter.$lte = new Date(query.to);
      }

      filter.createdAt = timestampFilter;
    }

    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLogModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
