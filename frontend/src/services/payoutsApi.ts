
import api from '@/lib/api';
import type { PayoutItem, PayoutsList } from '../types/payouts';
import { mockGet, mockList, type MockMode } from './payoutsMock'; // TEMP MOCK

const USE_MOCK = true; // TEMP MOCK
const MOCK_MODE: MockMode = 'data'; // TEMP MOCK: 'data' | 'empty' | 'error'

type Envelope<T> = { data?: T } | T;
const unwrap = <T,>(body: Envelope<T>): T =>
  (body && typeof body === 'object' && 'data' in body && body.data !== undefined ? body.data : body) as T;

export const payoutsApi = {
  list: async (): Promise<PayoutsList> => {
    if (USE_MOCK) return mockList(MOCK_MODE); // TEMP MOCK
    return unwrap<PayoutsList>((await api.get('/partner/payouts')).data);
  },
  get: async (id: string): Promise<PayoutItem> => {
    if (USE_MOCK) return mockGet(id); // TEMP MOCK
    return unwrap<PayoutItem>((await api.get(`/partner/payouts/${id}`)).data);
  },
};