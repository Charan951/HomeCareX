import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http, { type ApiResponse } from "@/lib/http";
import { useAuth } from "@/hooks/useAuth";
import { normalizeApiError, type NormalizedApiError } from "@/services/bookingApi";
import { customerKeys } from "./api";
import type { AddressDto, AddressInput, AddressPatch } from "./types";

/** /customer/addresses — the server scopes everything to the signed-in customer (from the token). */
const BASE = "/customer/addresses";

async function call<T>(run: () => Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await run()).data.data;
  } catch (err) {
    throw normalizeApiError(err);
  }
}

export const addressesApi = {
  list: () => call<AddressDto[]>(() => http.get(BASE)),
  create: (input: AddressInput) => call<AddressDto>(() => http.post(BASE, input)),
  update: (id: string, patch: AddressPatch) => call<AddressDto>(() => http.patch(`${BASE}/${id}`, patch)),
  /** "Deliver here": makes this the default, which is the address the dashboard shows. */
  setDefault: (id: string) => call<AddressDto>(() => http.put(`${BASE}/${id}/default`)),
  remove: (id: string) => call<{ id: string }>(() => http.delete(`${BASE}/${id}`)),
};

export function useAddresses() {
  const { user } = useAuth();
  return useQuery<AddressDto[], NormalizedApiError>({
    queryKey: customerKeys.addresses(user?.id),
    queryFn: addressesApi.list,
    staleTime: 30_000,
    retry: (count, error) => count < 2 && (error.status === null || error.status >= 500),
  });
}

/** After any change, refresh the address list AND the dashboard (which shows the default address). */
function useRefreshAfterChange() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["customer"] });
}

export function useCreateAddress() {
  const refresh = useRefreshAfterChange();
  return useMutation<AddressDto, NormalizedApiError, AddressInput>({ mutationFn: addressesApi.create, onSuccess: refresh });
}

export function useUpdateAddress() {
  const refresh = useRefreshAfterChange();
  return useMutation<AddressDto, NormalizedApiError, { id: string; patch: AddressPatch }>({
    mutationFn: ({ id, patch }) => addressesApi.update(id, patch),
    onSuccess: refresh,
  });
}

export function useSetDefaultAddress() {
  const refresh = useRefreshAfterChange();
  return useMutation<AddressDto, NormalizedApiError, string>({ mutationFn: addressesApi.setDefault, onSuccess: refresh });
}

export function useDeleteAddress() {
  const refresh = useRefreshAfterChange();
  return useMutation<{ id: string }, NormalizedApiError, string>({ mutationFn: addressesApi.remove, onSuccess: refresh });
}
