import { useSearchParams } from "react-router-dom";

export type ServiceSort =
  | "popular"
  | "price_asc"
  | "price_desc";

export const useServiceUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = (searchParams.get("sort") || "popular") as ServiceSort;
  const page = Number(searchParams.get("page") || "1");
  const pincode = searchParams.get("pincode") || "";

  const updateParam = (
    key: string,
    value: string | number | null
  ) => {
    const params = new URLSearchParams(searchParams);

    if (
      value === null ||
      value === "" ||
      (key === "page" && value === 1)
    ) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    setSearchParams(params);
  };

  const setQuery = (value: string) => {
    updateParam("q", value);
    updateParam("page", 1);
  };

  const setCategory = (value: string) => {
    updateParam("category", value);
    updateParam("page", 1);
  };

  const setSort = (value: ServiceSort) => {
    updateParam("sort", value);
    updateParam("page", 1);
  };

  const setPage = (value: number) => {
    updateParam("page", value);
  };

  const setPincode = (value: string) => {
    updateParam("pincode", value);
    updateParam("page", 1);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return {
    q,
    category,
    sort,
    page,
    pincode,
    setQuery,
    setCategory,
    setSort,
    setPage,
    setPincode,
    clearFilters,
  };
};