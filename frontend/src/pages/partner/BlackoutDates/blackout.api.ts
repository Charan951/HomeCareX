import http, { type ApiResponse } from '@/lib/http';

export interface BlackoutDate {
  _id: string;
  partnerId: string;
  date: string; // "YYYY-MM-DD"
  reason: string;
  createdAt: string;
  updatedAt: string;
}

const BASE = '/partner/blackout-dates';

export const listBlackouts = () =>
  http.get<ApiResponse<BlackoutDate[]>>(BASE).then((r) => r.data.data);

export const createBlackout = (date: string, reason: string) =>
  http.post<ApiResponse<BlackoutDate>>(BASE, { date, reason }).then((r) => r.data.data);

export const updateBlackout = (id: string, reason: string) =>
  http.patch<ApiResponse<BlackoutDate>>(`${BASE}/${id}`, { reason }).then((r) => r.data.data);

export const deleteBlackout = (id: string) => http.delete(`${BASE}/${id}`);