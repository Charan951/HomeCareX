import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { adminCustomersService } from './admin-customers.service';
import type { DeleteCustomerBody, ListCustomersQuery, UpdateCustomerBody, UpdateCustomerStatusBody } from './admin-customers.validation';

export const adminCustomersController = {
  /** GET /admin/customers. `req.query` has already been parsed by the validate() middleware. */
  async list(req: Request, res: Response) {
    const query = req.query as unknown as ListCustomersQuery;
    sendSuccess(res, await adminCustomersService.list(query));
  },

  /** GET /admin/customers/:id */
  async getById(req: Request, res: Response) {
    sendSuccess(res, await adminCustomersService.getById(String(req.params.id)));
  },

  /** PATCH /admin/customers/:id/status. Body is already validated. */
  async updateStatus(req: Request, res: Response) {
    const admin = getAuthUser(req);
    const body = req.body as UpdateCustomerStatusBody;
    const result = await adminCustomersService.updateStatus(String(req.params.id), body, {
      id: admin.id,
      ip: req.ip ?? 'unknown',
    });
    sendSuccess(res, result, { message: result.status === 'blocked' ? 'Customer blocked' : 'Customer unblocked' });
  },

  /** PATCH /admin/customers/:id. Body is already validated. */
  async update(req: Request, res: Response) {
    const admin = getAuthUser(req);
    const result = await adminCustomersService.updateProfile(String(req.params.id), req.body as UpdateCustomerBody, {
      id: admin.id,
      ip: req.ip ?? 'unknown',
    });
    sendSuccess(res, result, { message: 'Customer updated' });
  },

  /** DELETE /admin/customers/:id. Body ({ reason }) is already validated. */
  async remove(req: Request, res: Response) {
    const admin = getAuthUser(req);
    const result = await adminCustomersService.remove(String(req.params.id), req.body as DeleteCustomerBody, {
      id: admin.id,
      ip: req.ip ?? 'unknown',
    });
    sendSuccess(res, result, { message: 'Customer removed' });
  },
};
