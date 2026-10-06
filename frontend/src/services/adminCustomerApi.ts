import http, { type ApiResponse } from '@/lib/http';
import type {
  AdminCustomerDetail,
  AdminCustomersPage,
  CustomerListParams,
  CustomerStatusResult,
  UpdateCustomerInput,
  UpdateCustomerStatusInput,
} from '@/types/adminCustomer';

/** Only send what is set, so the URL stays readable and "no filter" never reaches the server as an empty string. */
function buildQuery(p: CustomerListParams): Record<string, string | number> {
  const params: Record<string, string | number> = { page: p.page, limit: p.limit };
  const search = p.search.trim();
  if (search) params.search = search;
  if (p.status) params.status = p.status;
  if (p.sortBy) {
    params.sortBy = p.sortBy;
    params.sortDir = p.sortDir ?? 'asc';
  }
  return params;
}

export const adminCustomerApi = {
  /** GET /admin/customers. Rejects with the ApiError shape from lib/http ({ message, status, code, details }). */
  async list(params: CustomerListParams, signal?: AbortSignal): Promise<AdminCustomersPage> {
    const { data } = await http.get<ApiResponse<AdminCustomersPage>>('/admin/customers', {
      params: buildQuery(params),
      signal,
    });
    return data.data;
  },

  /** GET /admin/customers/:id. 404 CUSTOMER_NOT_FOUND for an unknown id. */
  async get(id: string, signal?: AbortSignal): Promise<AdminCustomerDetail> {
    const { data } = await http.get<ApiResponse<AdminCustomerDetail>>(`/admin/customers/${encodeURIComponent(id)}`, { signal });
    return data.data;
  },

  /** PATCH /admin/customers/:id/status. Blocking also revokes the customer's sessions on the server. */
  async updateStatus(id: string, input: UpdateCustomerStatusInput): Promise<CustomerStatusResult> {
    const { data } = await http.patch<ApiResponse<CustomerStatusResult>>(`/admin/customers/${encodeURIComponent(id)}/status`, input);
    return data.data;
  },

  /** PATCH /admin/customers/:id. 409 if the email or phone belongs to another account. */
  async update(id: string, input: UpdateCustomerInput) {
    const { data } = await http.patch<ApiResponse<{ id: string; name: string; email: string; phone: string | null }>>(
      `/admin/customers/${encodeURIComponent(id)}`,
      input,
    );
    return data.data;
  },

  /** DELETE /admin/customers/:id. 409 if the customer has bookings. */
  async remove(id: string, reason: string) {
    const { data } = await http.delete<ApiResponse<{ id: string }>>(`/admin/customers/${encodeURIComponent(id)}`, {
      data: { reason },
    });
    return data.data;
  },
};
