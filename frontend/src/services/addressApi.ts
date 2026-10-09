import http, { type ApiResponse } from "@/lib/http";
import type { AddressView, CreateAddressRequest, ServiceabilityResult } from "@/types/address";
import { normalizeApiError } from "./bookingApi";

export const addressApi = {
  async list(): Promise<AddressView[]> {
    try {
      const { data } = await http.get<ApiResponse<{ addresses: AddressView[] }>>("/addresses");
      return data.data.addresses;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async create(payload: CreateAddressRequest): Promise<AddressView> {
    try {
      const { data } = await http.post<ApiResponse<{ address: AddressView }>>("/addresses", payload);
      return data.data.address;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async update(id: string, payload: Partial<CreateAddressRequest>): Promise<AddressView> {
    try {
      const { data } = await http.patch<ApiResponse<{ address: AddressView }>>(`/addresses/${id}`, payload);
      return data.data.address;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // Alias for compatibility
  async updateAddress(id: string, payload: Partial<CreateAddressRequest>): Promise<AddressView> {
    return this.update(id, payload);
  },

  async delete(id: string): Promise<void> {
    try {
      await http.delete(`/addresses/${id}`);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // Alias for compatibility
  async deleteAddress(id: string): Promise<void> {
    return this.delete(id);
  },

  async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    try {
      const { data } = await http.get<ApiResponse<ServiceabilityResult>>("/serviceability", {
        params: { pincode },
      });
      return data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};