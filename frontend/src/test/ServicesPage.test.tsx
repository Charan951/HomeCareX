import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import ServicesPage from "../pages/public/Services";

/* =========================================================
   Constants
========================================================= */

const SEARCH_PLACEHOLDER = "Search for cleaning, plumbing, electrical...";

// Anchored so it does NOT match the "Clear filters" button
const FILTERS_BUTTON = /^filters/i;

/* =========================================================
   Location Display
========================================================= */

const LocationDisplay: React.FC = () => {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
};

/* =========================================================
   Test Wrapper
========================================================= */

interface TestWrapperProps {
  initialEntry?: string;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  initialEntry = "/services",
}) => (
  <MemoryRouter initialEntries={[initialEntry]}>
    <ServicesPage />
    <LocationDisplay />
  </MemoryRouter>
);

/* =========================================================
   Helpers
========================================================= */

const getParams = () =>
  new URLSearchParams(
    screen.getByTestId("location-search").textContent ?? ""
  );

// Page resets to 1 (or the param is removed when page is 1)
const expectPageReset = (params: URLSearchParams) => {
  expect(["1", null]).toContain(params.get("page"));
};

const openFilters = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: FILTERS_BUTTON }));
};

/* =========================================================
   ServicesPage Tests
========================================================= */

describe("ServicesPage URL synchronization", () => {
  it("loads filter values from the URL", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper
        initialEntry={
          "/services?q=Cleaning&category=Cleaning&sort=price-low&pincode=517501&page=2"
        }
      />
    );

    const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);

    await waitFor(() =>
      expect((searchInput as HTMLInputElement).value).toBe("Cleaning")
    );

    await openFilters(user);

    await waitFor(() => {
      expect(
        (screen.getByLabelText("Category") as HTMLSelectElement).value
      ).toBe("Cleaning");
      expect(
        (screen.getByLabelText("Sort By") as HTMLSelectElement).value
      ).toBe("price-low");
      expect(
        (screen.getByLabelText("Your Location") as HTMLInputElement).value
      ).toBe("517501");
    });
  });

  it("updates the URL when category changes", async () => {
    const user = userEvent.setup();

    render(<TestWrapper initialEntry="/services?page=3" />);

    await openFilters(user);

    await user.selectOptions(screen.getByLabelText("Category"), "Cleaning");

    await waitFor(() => {
      const params = getParams();
      expect(params.get("category")).toBe("Cleaning");
      expectPageReset(params);
    });
  });

  it("updates the URL when sort changes", async () => {
    const user = userEvent.setup();

    render(<TestWrapper initialEntry="/services?page=4" />);

    await openFilters(user);

    await user.selectOptions(screen.getByLabelText("Sort By"), "price-low");

    await waitFor(() => {
      const params = getParams();
      expect(params.get("sort")).toBe("price-low");
      expectPageReset(params);
    });
  });

  it("updates the URL when pincode changes", async () => {
    const user = userEvent.setup();

    render(<TestWrapper initialEntry="/services?page=5" />);

    await openFilters(user);

    await user.type(screen.getByLabelText("Your Location"), "517501");

    await waitFor(
      () => {
        const params = getParams();
        expect(params.get("pincode")).toBe("517501");
        expectPageReset(params);
      },
      { timeout: 1500 }
    );
  });

  it("updates the URL after search debounce", async () => {
    const user = userEvent.setup();

    render(<TestWrapper initialEntry="/services?page=3" />);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "Cleaning");

    await waitFor(
      () => {
        const params = getParams();
        expect(params.get("q")).toBe("Cleaning");
        expectPageReset(params);
      },
      { timeout: 1500 }
    );
  });

  it("clears the URL when Clear filters is clicked", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper
        initialEntry={
          "/services?q=Cleaning&category=Cleaning&sort=price-low&pincode=517501&page=2"
        }
      />
    );

    // getAll: an empty-results state may also render a "Clear filters" button
    const clearButtons = await screen.findAllByRole("button", {
      name: /clear filters/i,
    });

    await user.click(clearButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("location-search").textContent).toBe("");
    });
  });
});