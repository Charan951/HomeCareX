import { CategoryModel } from '../../models/Category';
import { ServiceModel } from '../../models/Service';
import { ERROR_CODES } from '../../constants/errorCodes';
import { Errors } from '../../utils/errors';
import { auditService } from '../audit/audit.service';
import { AUDIT_ACTION, AUDIT_ENTITY } from './pricing.constants';
import { pricingRepository } from './pricing.repository';
import type { GetPricingQuery, PutPricingBody } from './pricing.validation';

const view = (r: Record<string, unknown> | null) =>
  r && {
    ...r,
    id: String(r._id),
    categoryId: String(r.categoryId),
    serviceId: r.serviceId ? String(r.serviceId) : null,
  };

export const pricingAdminService = {
  /** DELETE /admin/pricing/:id: removes the rule and writes an audit row with the deleted values. */
  async remove(id: string, actor: { id: string; ip: string }) {
    const removed = await pricingRepository.remove(id);
    if (!removed) throw Errors.notFound(ERROR_CODES.NOT_FOUND, 'Pricing rule not found');
    try {
      await auditService.recordAudit({
        actor: actor.id,
        action: AUDIT_ACTION.deleted,
        entity: AUDIT_ENTITY,
        entityId: id,
        before: removed,
        after: null,
        ip: actor.ip,
        result: 'Success',
      });
    } catch (err) {
      console.error(`[pricing] audit write failed for deleted rule ${id} (by ${actor.id})`, err);
    }
    return { id };
  },

  /** GET /admin/pricing?categoryId&serviceId&city */
  async list(query: GetPricingQuery) {
    const rows = await pricingRepository.list(query);
    return { items: rows.map((r) => view(r as unknown as Record<string, unknown>)) };
  },

  /** PUT /admin/pricing: validates the scope, upserts, writes an audit row with before/after. */
  async save(input: PutPricingBody, actor: { id: string; ip: string }) {
    let body = input;
    if (!(await CategoryModel.exists({ _id: body.categoryId }))) {
      throw Errors.notFound(ERROR_CODES.NOT_FOUND, 'Category not found');
    }
    if (body.serviceId) {
      const svc = await ServiceModel.findById(body.serviceId, 'categoryId').lean();
      if (!svc) throw Errors.notFound(ERROR_CODES.NOT_FOUND, 'Service not found');
      if (String(svc.categoryId) !== body.categoryId) {
        throw Errors.validation([{ field: 'serviceId', message: 'Service does not belong to this category' }]);
      }
    }

    // "hyderabad" and "Hyderabad" are one city: reuse the spelling the existing rule already has.
    const before = await pricingRepository.findExactAnyCase(body.categoryId, body.serviceId ?? null, body.city);
    if (before) body = { ...body, city: before.city };
    const saved = await pricingRepository.upsert(body, actor.id);

    try {
      await auditService.recordAudit({
        actor: actor.id,
        action: before ? AUDIT_ACTION.updated : AUDIT_ACTION.created,
        entity: AUDIT_ENTITY,
        entityId: String(saved?._id),
        before: before ?? null,
        after: saved,
        ip: actor.ip,
        result: 'Success',
      });
    } catch (err) {
      console.error(`[pricing] audit write failed for rule ${String(saved?._id)} (by ${actor.id})`, err);
    }
    return view(saved as unknown as Record<string, unknown>);
  },
};
