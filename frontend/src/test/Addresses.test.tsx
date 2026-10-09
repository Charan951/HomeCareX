import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { AddressView } from "@/types/address";

// The map needs a real browser (Leaflet); the forms only care about the location it reports. This stand-in
// reports a fixed spot (and a different one on the second click) when "Pick on map" is pressed.
let pickCount = 0;
vi.mock("@/components/customer/maps/MapAddressPicker", () => ({
  default: ({ onPick }: { onPick: (p: { lat: number; lng: number; formatted: string; line1: string; area: string; city: string; state: string; pincode: string }) => void }) => (
    <button
      type="button"
      onClick={() => {
        pickCount += 1;
        onPick(
          pickCount === 1
            ? { lat: 17.49, lng: 78.39, formatted: "JNTU Road, Kukatpally, Hyderabad", line1: "JNTU Road", area: "Kukatpally", city: "Hyderabad", state: "Telangana", pincode: "500072" }
            : { lat: 17.44, lng: 78.35, formatted: "Mindspace Road, Madhapur, Hyderabad", line1: "Mindspace Road", area: "Madhapur", city: "Hyderabad", state: "Telangana", pincode: "500081" },
        );
      }}
    >
      Pick on map
    </button>
  ),
}));

const checkServiceability = vi.fn();
vi.mock("@/services/addressApi", () => ({ addressApi: { checkServiceability: (p: string) => checkServiceability(p) } }));

import AddressForm from "../pages/customer/Addresses/AddressForm";
import AddressCard from "../pages/customer/Addresses/AddressCard";
import ServiceabilityResult from "../pages/customer/Addresses/ServiceabilityResult";

const wrap = (ui: ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
  pickCount = 0;
  checkServiceability.mockReset();
  checkServiceability.mockImplementation(async (pincode: string) =>
    pincode === "500072" ? { serviceable: true, pincode, city: "Hyderabad", state: "Telangana" } : { serviceable: false, pincode },
  );
});

const baseAddress: AddressView = {
  id: "a1",
  label: "Home",
  line1: "Flat 302, Manjeera Trinity",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500072",
  isDefault: false,
  serviceable: true,
};

describe("ServiceabilityResult", () => {
  it("does not call the API until the pincode has 6 digits", async () => {
    wrap(<ServiceabilityResult pincode="5000" />);
    expect(screen.getByRole("status")).toHaveTextContent(/6-digit pincode/i);
    expect(checkServiceability).not.toHaveBeenCalled();
  });

  it("says we serve the area for a serviceable pincode", async () => {
    wrap(<ServiceabilityResult pincode="500072" />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/we serve this area \(Hyderabad\)/i));
    expect(checkServiceability).toHaveBeenCalledTimes(1);
  });

  it("says unavailable for a pincode we don't serve", async () => {
    wrap(<ServiceabilityResult pincode="999999" />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/unavailable/i));
  });

  it("offers a retry when the check itself fails", async () => {
    // The hook retries a failed check once by itself, so the first two calls fail before the error shows.
    const failure = { status: 500, code: "SERVER_ERROR", message: "boom" };
    checkServiceability.mockRejectedValueOnce(failure).mockRejectedValueOnce(failure);
    wrap(<ServiceabilityResult pincode="500072" />);
    const retry = await screen.findByRole("button", { name: /try again/i }, { timeout: 4000 });
    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/we serve this area/i));
  });
});

describe("AddressForm", () => {
  const setup = (props: Partial<React.ComponentProps<typeof AddressForm>> = {}) => {
    const onSubmit = vi.fn();
    wrap(<AddressForm isFirst={false} saving={false} onSubmit={onSubmit} onCancel={() => undefined} {...props} />);
    return { onSubmit };
  };

  it("offers exactly Home, Work and Other, plus a landmark field", () => {
    setup();
    const chips = screen.getAllByRole("button", { pressed: false }).concat(screen.getAllByRole("button", { pressed: true }));
    const names = chips.map((b) => b.textContent?.trim()).filter((t) => ["Home", "Work", "Other", "Office"].includes(t ?? ""));
    expect(names.sort()).toEqual(["Home", "Other", "Work"]);
    expect(screen.getByLabelText(/landmark/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/house \/ flat no/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street \/ road/i)).toBeInTheDocument();
  });

  it("still lets the customer save an address in an area we don't serve, with a heads-up", async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText(/house \/ flat no/i), "12");
    await userEvent.type(screen.getByLabelText(/street \/ road/i), "Main Rd");
    await userEvent.type(screen.getByLabelText(/^city/i), "Pune");
    await userEvent.type(screen.getByLabelText(/^state/i), "Maharashtra");
    await userEvent.type(screen.getByLabelText(/pincode/i), "411001");

    await screen.findByText(/you can still save this address/i);
    const save = screen.getByRole("button", { name: /save address/i });
    expect(save).toBeEnabled();
    await userEvent.click(save);
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it("saves house, street, area, landmark and the chosen label when the area is served", async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Work" }));
    await userEvent.type(screen.getByLabelText(/house \/ flat no/i), "Flat 302");
    await userEvent.type(screen.getByLabelText(/street \/ road/i), "JNTU Road");
    await userEvent.type(screen.getByLabelText(/area \/ locality/i), "Kukatpally");
    await userEvent.type(screen.getByLabelText(/landmark/i), "Near City Centre");
    await userEvent.type(screen.getByLabelText(/^city/i), "Hyderabad");
    await userEvent.type(screen.getByLabelText(/^state/i), "Telangana");
    await userEvent.type(screen.getByLabelText(/pincode/i), "500072");

    const save = await screen.findByRole("button", { name: /save address/i });
    await waitFor(() => expect(save).toBeEnabled());
    await userEvent.click(save);

    expect(onSubmit).toHaveBeenCalledWith({
      label: "Work",
      house: "Flat 302",
      street: "JNTU Road",
      area: "Kukatpally",
      landmark: "Near City Centre",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500072",
    });
  });

  it("fills street, area, city, state and pincode from the map, and leaves house for the customer", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /pick on map/i }));
    expect(screen.getByLabelText(/street \/ road/i)).toHaveValue("JNTU Road");
    expect(screen.getByLabelText(/area \/ locality/i)).toHaveValue("Kukatpally");
    expect(screen.getByLabelText(/^city/i)).toHaveValue("Hyderabad");
    expect(screen.getByLabelText(/^state/i)).toHaveValue("Telangana");
    expect(screen.getByLabelText(/pincode/i)).toHaveValue("500072");
    expect(screen.getByLabelText(/house \/ flat no/i)).toHaveValue("");
  });

  it("updates every field when the pin moves again, but keeps a street the customer typed", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /pick on map/i }));
    await userEvent.clear(screen.getByLabelText(/street \/ road/i));
    await userEvent.type(screen.getByLabelText(/street \/ road/i), "My own street");
    await userEvent.click(screen.getByRole("button", { name: /pick on map/i }));
    expect(screen.getByLabelText(/street \/ road/i)).toHaveValue("My own street");
    expect(screen.getByLabelText(/area \/ locality/i)).toHaveValue("Madhapur");
    expect(screen.getByLabelText(/pincode/i)).toHaveValue("500081");
  });

  it("requires house and street for a new address", async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText(/^city/i), "Hyderabad");
    await userEvent.type(screen.getByLabelText(/^state/i), "Telangana");
    await userEvent.type(screen.getByLabelText(/pincode/i), "500072");
    const save = await screen.findByRole("button", { name: /save address/i });
    await waitFor(() => expect(save).toBeEnabled());
    await userEvent.click(save);
    expect(await screen.findByText(/enter your house or flat number/i)).toBeInTheDocument();
    expect(screen.getByText(/enter the street or road/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("lets an older single-line address be edited without a street", async () => {
    const { onSubmit } = setup({ initial: baseAddress });
    expect(screen.getByLabelText(/house \/ flat no/i)).toHaveValue("Flat 302, Manjeera Trinity");
    const save = await screen.findByRole("button", { name: /save changes/i });
    await waitFor(() => expect(save).toBeEnabled());
    await userEvent.click(save);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe("invalid pincode format", () => {
    const fillRest = async () => {
      await userEvent.type(screen.getByLabelText(/house \/ flat no/i), "12");
      await userEvent.type(screen.getByLabelText(/street \/ road/i), "Main Rd");
      await userEvent.type(screen.getByLabelText(/^city/i), "Hyderabad");
      await userEvent.type(screen.getByLabelText(/^state/i), "Telangana");
    };

    it("rejects a pincode with fewer than 6 digits, without submitting or calling the API", async () => {
      const { onSubmit } = setup();
      await fillRest();
      await userEvent.type(screen.getByLabelText(/pincode/i), "50007");
      await userEvent.click(screen.getByRole("button", { name: /save address/i }));

      expect(await screen.findByText("Pincode must be 6 digits")).toBeInTheDocument();
      expect(screen.getByLabelText(/pincode/i)).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();
      expect(checkServiceability).not.toHaveBeenCalled();
    });

    it("drops letters and symbols as they are typed, so what is left is still too short", async () => {
      const { onSubmit } = setup();
      await fillRest();
      await userEvent.type(screen.getByLabelText(/pincode/i), "5a0-0b7");
      expect(screen.getByLabelText(/pincode/i)).toHaveValue("5007");

      await userEvent.click(screen.getByRole("button", { name: /save address/i }));
      expect(await screen.findByText("Pincode must be 6 digits")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("stops at 6 digits and only then checks serviceability", async () => {
      setup();
      await userEvent.type(screen.getByLabelText(/pincode/i), "50007234");
      expect(screen.getByLabelText(/pincode/i)).toHaveValue("500072");
      await waitFor(() => expect(checkServiceability).toHaveBeenCalledWith("500072"));
      expect(checkServiceability).toHaveBeenCalledTimes(1);
    });

    it("rejects an empty pincode", async () => {
      const { onSubmit } = setup();
      await fillRest();
      await userEvent.click(screen.getByRole("button", { name: /save address/i }));
      expect(await screen.findByText("Pincode must be 6 digits")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});

describe("AddressCard", () => {
  const noop = () => undefined;

  it("shows an Unavailable badge and no 'Deliver here' for an address we can't serve", () => {
    render(
      <ul>
        <AddressCard address={{ ...baseAddress, serviceable: false }} busy={false} onSelect={noop} onEdit={noop} onDelete={noop} />
      </ul>,
    );
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /deliver here/i })).not.toBeInTheDocument();
  });

  it("shows no badge for a serviceable address, and shows its landmark", () => {
    render(
      <ul>
        <AddressCard address={{ ...baseAddress, landmark: "City Centre" }} busy={false} onSelect={noop} onEdit={noop} onDelete={noop} />
      </ul>,
    );
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
    expect(screen.getByText(/near city centre/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deliver here/i })).toBeInTheDocument();
  });
});
