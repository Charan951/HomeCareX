import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { addressesService } from './addresses.service';
import type { CreateAddressInput, UpdateAddressInput } from './addresses.types';

// Identity always comes from the token (getAuthUser), never from the body, query or URL.
const noStore = (res: Response) => res.set('Cache-Control', 'private, no-store');

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getAuthUser(req);
  noStore(res);
  sendSuccess(res, await addressesService.list(id));
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getAuthUser(req);
  noStore(res);
  sendSuccess(res, await addressesService.create(id, req.body as CreateAddressInput), { status: 201, message: 'Address saved' });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getAuthUser(req);
  noStore(res);
  sendSuccess(res, await addressesService.update(id, req.params.id, req.body as UpdateAddressInput), { message: 'Address updated' });
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getAuthUser(req);
  noStore(res);
  sendSuccess(res, await addressesService.setDefault(id, req.params.id), { message: 'Delivery address updated' });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getAuthUser(req);
  noStore(res);
  sendSuccess(res, await addressesService.remove(id, req.params.id), { message: 'Address deleted' });
});
