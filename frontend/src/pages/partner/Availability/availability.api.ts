const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

const TEMP_HEADERS = { 'x-partner-id': '650000000000000000000001' };

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

async function request(method: 'GET' | 'PATCH', body?: unknown): Promise<Availability> {
  const res = await fetch(`${API_URL}/partner/availability`, {
    method,
    headers: { 'Content-Type': 'application/json', ...TEMP_HEADERS },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? `Request failed (${res.status})`);
  return json.data as Availability;
}

export const getAvailability = () => request('GET');
export const setOnline = (isOnline: boolean) => request('PATCH', { isOnline });
export const setWorkingHours = (workingHours: WorkingHoursDay[]) => request('PATCH', { workingHours });