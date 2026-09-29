import { AuditLogQuery, CreateAuditLogInput } from "./audit.types";

export const validateCreateAuditLog = (
  input: CreateAuditLogInput
): string | null => {
  if (!input.actor?.trim()) {
    return "actor is required";
  }

  if (!input.action?.trim()) {
    return "action is required";
  }

  if (!input.entity?.trim()) {
    return "entity is required";
  }

  if (!input.entityId?.trim()) {
    return "entityId is required";
  }

  if (!input.ip?.trim()) {
    return "ip is required";
  }

  if (!["Success", "Failed"].includes(input.result)) {
    return "result must be Success or Failed";
  }

  return null;
};

export const parseAuditQuery = (
  query: Record<string, unknown>
): AuditLogQuery => {
  return {
    actor: typeof query.actor === "string" ? query.actor : undefined,
    action: typeof query.action === "string" ? query.action : undefined,
    entity: typeof query.entity === "string" ? query.entity : undefined,
    entityId:
      typeof query.entityId === "string" ? query.entityId : undefined,
    from: typeof query.from === "string" ? query.from : undefined,
    to: typeof query.to === "string" ? query.to : undefined,
    page:
      typeof query.page === "string" && Number.isInteger(Number(query.page))
        ? Number(query.page)
        : undefined,
    limit:
      typeof query.limit === "string" && Number.isInteger(Number(query.limit))
        ? Number(query.limit)
        : undefined,
  };
};