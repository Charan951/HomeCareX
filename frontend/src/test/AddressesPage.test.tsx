import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AddressView, CreateAddressRequest } from "@/types/address";

// The map needs a real browser (Leaflet); these flows only care about the form fields.
vi.mock("@/components/customer/maps/MapAddressPicker", () => ({ default: () => <div data-testid="map" /> }));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "customer-1" } }) }));

let online = true;
vi.mock("@/hooks/useOnlineStatus", () => ({ useOnlineStatus: () => online }));

const list = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();
const checkServiceability = vi.fn();
vi.mock("@/services/addressApi", () => ({
  addressApi: {
    list: () => list(),
    create: (payload: CreateAddressRequest) => create(payload),
    update: (id: string, patch: Partial<CreateAddressRequest>) => update(id, patch),
    delete: (id: string) => remove(id),
    checkServiceability: (pincode: string) => checkServiceability(pincode),
  },
}));

import Addresses from "../pages/customer/Addresses";

const home: AddressView = { id: "a1", label: "Home", line1: "Flat 302, Manjeera Trinity", city: "Hyderabad", state: "Telangana", pincode: "500072", isDefault: true, serviceable: true };
const work: AddressView = { id: "a2", label: "Work", line1: "WeWork, Prestige Tech Park", city: "Hyderabad", state: "Telangana", pincode: "500081", isDefault: false, serviceable: true };

// A tiny in-memory "server" so the page re-fetches real-looking data after every change.
let db: AddressView[] = [];

beforeEach(() => {
  online = true;
  db = [{ ...home }, { ...work }];
  list.mockReset().mockImplementation(async () => db.map((a) => ({ ...a })));
  checkServiceability.mockReset().mockImplementation(async (pincode: string) => ({ serviceable: true, pincode, city: "Hyderabad", state: "Telangana" }));
  create.mockReset().mockImplementation(async (p: CreateAddressRequest) => {
    const made: AddressView = {
      id: "a3",
      label: p.label,
      line1: [p.house, p.street].filter(Boolean).join(", "),
      city: p.city,
      state: p.state,
      pincode: p.pincode,
      isDefault: db.length === 0 || Boolean(p.isDefault),
      serviceable: true,
    };
    db = [...db, made];
    return made;
  });
  update.mockReset().mockImplementation(async (id: string, patch: Partial<CreateAddressRequest>) => {
    db = db.map((a) => {
      if (patch.isDefault) return { ...a, isDefault: a.id === id };
      return a.id === id ? { ...a, ...(patch.house ? { line1: patch.house } : {}) } : a;
    });
    return db.find((a) => a.id === id) as AddressView;
  });
  remove.mockReset().mockImplementation(async (id: string) => {
    db = db.filter((a) => a.id !== id);
  });
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/customer/addresses"]}>
        <Routes>
          <Route path="/customer/addresses" element={<Addresses />} />
          <Route path="/customer" element={<p>Dashboard home</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function fillNewAddress() {
  await userEvent.type(screen.getByLabelText(/house \/ flat no/i), "Flat 12");
  await userEvent.type(screen.getByLabelText(/street \/ road/i), "MG Road");
  await userEvent.type(screen.getByLabelText(/^city/i), "Hyderabad");
  await userEvent.type(screen.getByLabelText(/^state/i), "Telangana");
  await userEvent.type(screen.getByLabelText(/pincode/i), "500072");
  await screen.findByText(/we serve this area/i);
}

describe("Addresses page: states", () => {
  it("shows a loading state while the addresses load", () => {
    list.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByText(/loading your addresses/i)).toBeInTheDocument();
  });

  it("shows an error with a retry, and recovers when retried", async () => {
    list.mockRejectedValueOnce({ message: "Server exploded", status: 400, code: "BAD_REQUEST" });
    renderPage();
    expect(await screen.findByText("We couldn't load your addresses")).toBeInTheDocument();
    expect(screen.getByText("Server exploded")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText(/flat 302, manjeera trinity/i)).toBeInTheDocument();
  });

  it("shows the offline state when there is no connection", async () => {
    online = false;
    list.mockRejectedValue({ message: "Network Error", status: 400, code: "NETWORK_ERROR" });
    renderPage();
    expect(await screen.findByText(/you're offline/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("shows the empty state, and its button opens the add form", async () => {
    db = [];
    renderPage();
    expect(await screen.findByText("No saved addresses yet")).toBeInTheDocument();
    // With no addresses there is no "Add new address" tile, only the empty-state call to action.
    expect(screen.queryByRole("button", { name: /add new address/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add your first address/i }));
    expect(await screen.findByRole("form", { name: "Add a new address" })).toBeInTheDocument();
    expect(screen.queryByText("No saved addresses yet")).not.toBeInTheDocument();
  });
});

describe("Addresses page: list and set default", () => {
  it("lists the default address first, marked Selected", async () => {
    db = [{ ...work }, { ...home }];
    renderPage();
    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Home");
    expect(within(items[0]).getByText("Selected")).toBeInTheDocument();
    expect(items[1]).toHaveTextContent("Work");
  });

  it("makes an address the default with 'Deliver here' and returns to the dashboard", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /deliver here/i }));
    await waitFor(() => expect(update).toHaveBeenCalledWith("a2", { isDefault: true }));
    expect(await screen.findByText("Dashboard home")).toBeInTheDocument();
  });
});

describe("Addresses page: add", () => {
  it("adds a new address, closes the form and shows the new card", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /add new address/i }));
    await fillNewAddress();
    await userEvent.click(screen.getByRole("button", { name: /save address/i }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ label: "Home", house: "Flat 12", street: "MG Road", city: "Hyderabad", state: "Telangana", pincode: "500072" })),
    );
    expect(await screen.findByText("Flat 12, MG Road")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Add a new address" })).not.toBeInTheDocument();
  });

  it("shows the server's message and keeps the form open when saving fails", async () => {
    create.mockRejectedValueOnce({ message: "Some fields are invalid", status: 400, code: "VALIDATION_ERROR" });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /add new address/i }));
    await fillNewAddress();
    await userEvent.click(screen.getByRole("button", { name: /save address/i }));

    expect(await screen.findByText("Some fields are invalid")).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Add a new address" })).toBeInTheDocument();
  });

  it("closes the form without saving when cancelled", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /add new address/i }));
    await userEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});

describe("Addresses page: edit", () => {
  it("edits an address and shows the change on its card", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Edit Home address" }));

    const form = await screen.findByRole("form", { name: "Edit address" });
    const house = within(form).getByLabelText(/house \/ flat no/i);
    expect(house).toHaveValue("Flat 302, Manjeera Trinity");
    await userEvent.clear(house);
    await userEvent.type(house, "Flat 500");
    await within(form).findByText(/we serve this area/i);
    await userEvent.click(within(form).getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(update).toHaveBeenCalledWith("a1", expect.objectContaining({ house: "Flat 500" })));
    expect(await screen.findByText("Flat 500")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Edit address" })).not.toBeInTheDocument();
  });
});

describe("Addresses page: delete", () => {
  it("asks for confirmation, then deletes the address", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete Work address" }));
    expect(screen.getByText("Delete this address?")).toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("a2"));
    await waitFor(() => expect(screen.queryByText(/wework, prestige tech park/i)).not.toBeInTheDocument());
    expect(screen.getByText(/flat 302, manjeera trinity/i)).toBeInTheDocument();
  });

  it("keeps the address when the confirmation is dismissed", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete Work address" }));
    await userEvent.click(screen.getByRole("button", { name: /keep it/i }));

    expect(screen.queryByText("Delete this address?")).not.toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByText(/wework, prestige tech park/i)).toBeInTheDocument();
  });

  it("shows an empty state after the last address is deleted", async () => {
    db = [{ ...home }];
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete Home address" }));
    await userEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(await screen.findByText("No saved addresses yet")).toBeInTheDocument();
  });
});
