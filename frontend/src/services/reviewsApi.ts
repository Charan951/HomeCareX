import http, { type ApiResponse } from '@/lib/http';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface CustomerReview {
  _id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  message: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewsResponse {
  reviews: CustomerReview[];
  pagination: { page: number; limit: number; total: number; pages: number };
  stats: { total: number; pending: number; approved: number; rejected: number };
}

export const createReview = async (input: { rating: number; message: string }): Promise<CustomerReview> => {
  const response = await http.post<ApiResponse<CustomerReview>>('/reviews', input);
  return response.data.data;
};

export const fetchMyReviews = async (): Promise<CustomerReview[]> => {
  const response = await http.get<ApiResponse<CustomerReview[]>>('/reviews/mine');
  return response.data.data;
};

export const fetchAdminReviews = async (params: {
  page: number;
  search?: string;
  status?: ReviewStatus | '';
}): Promise<AdminReviewsResponse> => {
  const query = {
    page: params.page,
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
  };
  const response = await http.get<ApiResponse<AdminReviewsResponse>>('/admin/reviews', { params: query });
  return response.data.data;
};

export const updateReviewStatus = async (input: { id: string; status: ReviewStatus }): Promise<CustomerReview> => {
  const response = await http.patch<ApiResponse<CustomerReview>>(`/admin/reviews/${input.id}/status`, { status: input.status });
  return response.data.data;
};
