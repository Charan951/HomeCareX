import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Stand-in for the Leaflet map: reports one fixed spot when "Pick on map" is pressed.
vi.mock("@/components/customer/maps/MapAddressPicker", () => ({
  default: ({ onPick }: { onPick: (p: { lat: number; lng: number; formatted: string; line1: string; area: string; city: string; state: string; pincode: string }) => void }) => (
    <button
      type="button"
      onClick={() =>
        onPick({ lat: 17.49, lng: 78.39, formatted: "JNTU Road, Kukatpally", line1: "JNTU Road", area: "Kukatpally", city: "Hyderabad", state: "Telangana", pincode: "500081" })
      }
    >
      Pick on map
    </button>
  ),
}));

const create = vi.fn();
vi.mock("@/services/addressApi", () => ({
  addressApi: {
    list: async () => [],
    create: (payload: unknown) => create(payload),
    checkServiceability: async (pincode: string) => ({ serviceable: true, pincode, city: "Hyderabad", state: "Telangana" }),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import StepAddress from "../pages/customer/Book/StepAddress";

beforeEach(() => {
  create.mockReset();
  create.mockImplementation(async (payload: Record<string, unknown>) => ({
    id: "new1", line1: "Flat 9, JNTU Road", isDefault: true, serviceable: true, ...payload,
  }));
});

const renderStep = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StepAddress />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("StepAddress map -> fields", () => {
  it("fills street, area, city, state and pincode from the map and saves them as separate fields", async () => {
    renderStep();
    await userEvent.click(await screen.findByRole("button", { name: /pick on map/i }));

    expect(screen.getByLabelText(/street \/ road/i)).toHaveValue("JNTU Road");
    expect(screen.getByLabelText(/area \/ locality/i)).toHaveValue("Kukatpally");
    expect(screen.getByLabelText(/^city/i)).toHaveValue("Hyderabad");
    expect(screen.getByLabelText(/^state/i)).toHaveValue("Telangana");
    expect(screen.getByLabelText(/^pincode/i)).toHaveValue("500081");
    expect(screen.getByLabelText(/house \/ flat no/i)).toHaveValue("");

    await userEvent.type(screen.getByLabelText(/house \/ flat no/i), "Flat 9");
    const form = document.getElementById("address-form") as HTMLFormElement;
    await act(async () => form.requestSubmit());

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Home", house: "Flat 9", street: "JNTU Road", area: "Kukatpally", city: "Hyderabad", state: "Telangana", pincode: "500081" }),
    );
  });
});
