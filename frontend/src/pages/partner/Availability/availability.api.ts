import http, { type ApiResponse } from '@/lib/http';

export interface WorkingHoursDay {
  day: string;
  start: string;
  end: string;
  off: boolean;
}

export interface Availability {
  isOnline: boolean;
  workingHours: WorkingHoursDay[];
}

export const getAvailability = () =>
  http.get<ApiResponse<Availability>>('/partner/availability').then((r) => r.data.data);

export const setOnline = (isOnline: boolean) =>
  http
    .patch<ApiResponse<Availability>>('/partner/availability', { isOnline })
    .then((r) => r.data.data);

export const setWorkingHours = (workingHours: WorkingHoursDay[]) =>
  http
    .patch<ApiResponse<Availability>>('/partner/availability', { workingHours })
    .then((r) => r.data.data);