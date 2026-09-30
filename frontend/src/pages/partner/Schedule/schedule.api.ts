import http, { type ApiResponse } from '@/lib/http';

export interface ScheduleWorkingHoursDay {
  day: string;
  start: string;
  end: string;
  off: boolean;
}

export interface ScheduleBlackoutDate {
  id: string;
  date: string;
  reason: string;
}

export interface ScheduleJob {
  id: string;
  date: string;
  start: string;
  end: string;
  title: string;
}

export interface Schedule {
  range: { from: string; to: string };
  isOnline: boolean;
  workingHours: ScheduleWorkingHoursDay[];
  blackoutDates: ScheduleBlackoutDate[];
  jobs: ScheduleJob[];
}

export const getSchedule = (from?: string, to?: string) =>
  http
    .get<ApiResponse<Schedule>>('/partner/schedule', { params: { from, to } })
    .then((r) => r.data.data);