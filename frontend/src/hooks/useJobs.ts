import { useQuery } from "@tanstack/react-query";
import { partnerApi } from "@/services/partnerApi";
import type { JobTab } from "@/types/partner";

export function useJobs(
  tab: JobTab,
  search = "",
  page = 1
) {
  return useQuery({
    queryKey: ["partner", "jobs", tab, search, page],

    queryFn: () =>
      partnerApi.getJobs(
        tab,
        page,
        10,
        search
      ),

    retry: 1,

    staleTime: 15_000,
  });
}