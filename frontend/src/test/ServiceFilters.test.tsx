import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ServiceFilters from "../components/public/ServiceFilters";
import type { SortOption } from "../components/public/ServiceFilters";

/* =====================================================
   Constants
===================================================== */

const SEARCH_PLACEHOLDER = "Search for cleaning, plumbing, electrical...";

// Anchored so it does NOT match the "Clear filters" button
const FILTERS_BUTTON = /^filters/i;

/* =====================================================
   Test Wrapper
   Simulates how ServicesPage controls the filters
===================================================== */

interface TestWrapperProps {
  onQueryChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onSortChange?: (value: SortOption) => void;
  onPincodeChange?: (value: string) => void;
  onClear?: () => void;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  onQueryChange = vi.fn(),
  onCategoryChange = vi.fn(),
  onSortChange = vi.fn(),
  onPincodeChange = vi.fn(),
  onClear = vi.fn(),
}) => {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOption>("popular");
  const [pincode, setPincode] = useState("");

  return (
    <ServiceFilters
      q={q}
      category={category}
      sort={sort}
      pincode={pincode}
      onQueryChange={(value: string) => {
        setQ(value);
        onQueryChange(value);
      }}
      onCategoryChange={(value: string) => {
        setCategory(value);
        onCategoryChange(value);
      }}
      onSortChange={(value: SortOption) => {
        setSort(value);
        onSortChange(value);
      }}
      onPincodeChange={(value: string) => {
        setPincode(value);
        onPincodeChange(value);
      }}
      onClear={() => {
        setQ("");
        setCategory("");
        setSort("popular");
        setPincode("");
        onClear();
      }}
    />
  );
};

/* =====================================================
   ServiceFilters Tests
===================================================== */

describe("ServiceFilters", () => {
  it("allows the user to search for a service", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();

    render(<TestWrapper onQueryChange={onQueryChange} />);

    await user.type(
      screen.getByPlaceholderText(SEARCH_PLACEHOLDER),
      "Cleaning"
    );

    expect(onQueryChange).toHaveBeenLastCalledWith("Cleaning");
  });

  it("allows the user to open filters and select a category", async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();

    render(<TestWrapper onCategoryChange={onCategoryChange} />);

    await user.click(screen.getByRole("button", { name: FILTERS_BUTTON }));
    await user.selectOptions(screen.getByLabelText("Category"), "Cleaning");

    expect(onCategoryChange).toHaveBeenLastCalledWith("Cleaning");
  });

  it("allows the user to change the sort option", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(<TestWrapper onSortChange={onSortChange} />);

    await user.click(screen.getByRole("button", { name: FILTERS_BUTTON }));
    await user.selectOptions(screen.getByLabelText("Sort By"), "price-low");

    expect(onSortChange).toHaveBeenLastCalledWith("price-low");
  });

  it("allows the user to enter a pincode", async () => {
    const user = userEvent.setup();
    const onPincodeChange = vi.fn();

    render(<TestWrapper onPincodeChange={onPincodeChange} />);

    await user.click(screen.getByRole("button", { name: FILTERS_BUTTON }));
    await user.type(screen.getByLabelText("Your Location"), "517501");

    expect(onPincodeChange).toHaveBeenLastCalledWith("517501");
  });

  it("calls clear filters", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(<TestWrapper onClear={onClear} />);

    const searchInput = screen.getByPlaceholderText(
      SEARCH_PLACEHOLDER
    ) as HTMLInputElement;

    await user.type(searchInput, "Cleaning");
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(searchInput.value).toBe("");
  });
});