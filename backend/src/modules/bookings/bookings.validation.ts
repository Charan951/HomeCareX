import { z } from 'zod';
import { SERVICE_SLOTS } from './bookings.constants';

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
const slotString = z.enum(SERVICE_SLOTS, { message: 'Unrecognized slot' });

const addOnInputSchema = z.object({
  addOnId: objectIdString,
  quantity: z.number().int().min(1).max(20),
});

const addressSnapshotSchema = z.object({
  label: z.string().max(50).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  landmark: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{4,10}$/, 'Invalid pincode'),
  location: z.object({ lat: z.number().gte(-90).lte(90), lng: z.number().gte(-180).lte(180) }),
});

export const createBookingBodySchema = z
  .object({
    serviceId: objectIdString,
    quantity: z.number().int().min(1).max(20),
    addOns: z.array(addOnInputSchema).max(20).default([]),
    addressId: objectIdString.optional(),
    newAddress: addressSnapshotSchema.optional(),
    date: dateString,
    slot: slotString,
    couponCode: z.string().trim().min(1).max(30).optional(),
    expectedTotal: z.number().int().min(0).optional(),
  })
  .refine((v) => Boolean(v.addressId) !== Boolean(v.newAddress), {
    message: 'Provide exactly one of addressId or newAddress',
    path: ['newAddress'],
  });

export const getSlotsQuerySchema = z.object({
  date: dateString,
});

export const getSlotsParamsSchema = z.object({
  id: objectIdString,
});

export const getBookingParamsSchema = z.object({
  id: objectIdString,
});

export const checkSlotBodySchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  slot: z.string().min(1, 'Slot is required'),
});