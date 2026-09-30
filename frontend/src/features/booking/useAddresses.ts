import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "@/services/addressApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { AddressView, CreateAddressRequest } from "@/types/address";

export const ADDRESSES_QUERY_KEY = ["addresses"] as const;

export interface UseAddressesResult {
  addresses: AddressView[];
  isLoading: boolean;
  isError: boolean;
  error: NormalizedApiError | null;
  refetch: () => void;
  createAddress: (payload: CreateAddressRequest) => Promise<AddressView>;
  isCreating: boolean;
}

/**
 * Saved addresses for the signed-in customer.
 * NOTE: this is the booking module's working version of the `useAddresses` contract. If the
 * Addresses page (Nanditha) ships its own hook/endpoints, keep this return shape and swap the
 * addressApi calls — StepAddress only depends on the shape above.
 */
export function useAddresses(): UseAddressesResult {
  const queryClient = useQueryClient();

  const query = useQuery<AddressView[], NormalizedApiError>({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: () => addressApi.list(),
  });

  const create = useMutation<AddressView, NormalizedApiError, CreateAddressRequest>({
    mutationFn: (payload) => addressApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY }),
  });

  return {
    addresses: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    createAddress: create.mutateAsync,
    isCreating: create.isPending,
  };
}
