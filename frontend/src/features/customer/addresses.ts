import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { addressApi } from "@/services/addressApi";
import type { ServiceabilityResult } from "@/types/address";
import type { NormalizedApiError } from "@/services/bookingApi";
import { ADDRESSES_QUERY_KEY } from "@/features/booking/useAddresses";
import { customerKeys } from "./api";
import type { AddressDto, AddressInput, AddressPatch } from "./types";

/** /addresses — the server scopes everything to the signed-in customer (from the token). */
export const addressesApi = {
  list: () => addressApi.list(),
  create: (input: AddressInput) => addressApi.create(input),
  update: (id: string, patch: AddressPatch) => addressApi.update(id, patch),
  /** "Deliver here": makes this the default, which is the address the dashboard shows. */
  setDefault: (id: string) => addressApi.update(id, { isDefault: true }),
  remove: async (id: string) => {
    await addressApi.delete(id);
    return { id };
  },
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

export type ServiceabilityStatus = "idle" | "checking" | "serviceable" | "unserviceable" | "error";

/**
 * GET /serviceability for a pincode, checked once all 6 digits are typed. The query key is shared with
 * SetupAddress and StepAddress, so the same pincode is only ever fetched once.
 */
export function useServiceability(pincode: string) {
  const ready = /^\d{6}$/.test(pincode);
  const query = useQuery<ServiceabilityResult, NormalizedApiError>({
    queryKey: ["serviceability", pincode],
    queryFn: () => addressApi.checkServiceability(pincode),
    enabled: ready,
    staleTime: 5 * 60_000,
    retry: (count, error) => count < 1 && (error.status === null || error.status >= 500),
  });

  let status: ServiceabilityStatus = "idle";
  if (ready) {
    if (query.isError) status = "error";
    else if (query.data) status = query.data.serviceable ? "serviceable" : "unserviceable";
    else status = "checking";
  }
  return { status, result: ready ? query.data : undefined, retry: () => void query.refetch() };
}

/** After any change, refresh the address list, the dashboard (default address) and the booking flow's list. */
function useRefreshAfterChange() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["customer"] }),
      qc.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY }),
    ]);
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