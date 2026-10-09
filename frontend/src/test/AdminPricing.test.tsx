import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: h }));

import AdminPricingPage from '@/pages/admin/Pricing';
import { validatePricing } from '@/pages/admin/Pricing/validate';
import { __resetCategoryApiForTests } from '@/pages/admin/Services/adminCategoryApi';
import { __resetServiceApiForTests } from '@/services/adminServiceApi';
import { __resetPricingApiForTests, getPricingApiMode } from '@/services/adminPricingApi';
import { useAuthStore } from '@/store/useAuthStore';
import type { PricingFormValues } from '@/types/adminPricing';

const CATS = [{ id: 'a1', name: 'Home Cleaning', slug: 'home-cleaning', description: '', icon: '🧹', sortOrder: 0, active: true, services: 2 }];
const SERVICES = [
  { id: 's1', slug: 'deep-cleaning', name: 'Deep Cleaning', description: 'd', categoryId: 'a1', category: { id: 'a1', name: 'Home Cleaning' }, basePrice: 599, durationMinutes: 90, addOns: [], active: true },
  { id: 's2', slug: 'sofa', name: 'Sofa Shampooing', description: 'd', categoryId: 'a1', category: { id: 'a1', name: 'Home Cleaning' }, basePrice: 799, durationMinutes: 120, addOns: [], active: true },
];
const rule = (over: Record<string, unknown> = {}) => ({
  id: 'r1', categoryId: 'a1', serviceId: 's1', city: '', mode: 'FIXED', basePrice: 599, durationMinutes: 90, cancellationFee: 99, active: true,
  addOns: [{ name: 'Priority slot', price: 99 }], surgeWindows: [{ label: 'Evening', startTime: '18:00', endTime: '20:00', percent: 10 }], ...over,
});
const ok = (data: unknown) => Promise.resolve({ data: { success: true, data } });

let rules: ReturnType<typeof rule>[];
const serve = () => h.get.mockImplementation((url: string) => {
  if (url.includes('categories')) return ok(CATS);
  if (url.includes('pricing')) return ok({ items: rules });
  return ok(SERVICES);
});
const renderPage = () => render(<MemoryRouter><AdminPricingPage /></MemoryRouter>);
const signIn = (permissions: string[], role = 'staff') => useAuthStore.setState({ isAuthenticated: true, user: { role, permissions } });

beforeEach(() => {
  // jsdom has no matchMedia; FullScreenPanel reads it to place itself beside the sidebar.
  window.matchMedia = ((query: string) => ({
    matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  signIn(['pricing:manage']);
  localStorage.clear();
  __resetCategoryApiForTests();
  __resetServiceApiForTests();
  __resetPricingApiForTests();
  Object.values(h).forEach((f) => f.mockReset());
  rules = [rule(), rule({ id: 'r2', serviceId: null, city: 'Hyderabad', mode: 'HOURLY', basePrice: 350, active: false, addOns: [], surgeWindows: [] })];
  serve();
});

const values = (over: Partial<PricingFormValues> = {}): PricingFormValues => ({
  mode: 'FIXED', basePrice: '500', durationMinutes: '60', cancellationFee: '0', active: true, addOns: [], surgeWindows: [], ...over,
});

describe('pricing validation', () => {
  const scope = { categoryId: 'a1', serviceId: null, city: '' };
  it('accepts a valid rule', () => expect(validatePricing(scope, values()).input).not.toBeNull());
  it('requires a category', () => expect(validatePricing({ ...scope, categoryId: '' }, values()).errors.categoryId).toBeTruthy());
  it('rejects overlapping surge windows', () => {
    const w = (startTime: string, endTime: string) => ({ label: 'x', startTime, endTime, percent: '10' });
    expect(validatePricing(scope, values({ surgeWindows: [w('10:00', '12:00'), w('11:00', '13:00')] })).errors['surgeWindows.1.startTime']).toMatch(/overlap/i);
  });
});

describe('Admin pricing page', () => {
  it('shows the rules in a table with status, edit and remove', async () => {
    renderPage();
    const table = await screen.findByRole('table', { name: /pricing rules/i });
    expect(getPricingApiMode()).toBe('live');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Deep Cleaning')).toBeInTheDocument();
    expect(within(rows[0]).getByRole('switch', { name: /is active/i })).toBeChecked();
    expect(within(rows[1]).getByRole('switch', { name: /is inactive/i })).not.toBeChecked();
    expect(within(rows[1]).getByText('Hyderabad')).toBeInTheDocument();
    expect(within(rows[0]).getByRole('button', { name: /edit rule/i })).toBeInTheDocument();
    expect(within(rows[0]).getByRole('button', { name: /remove rule/i })).toBeInTheDocument();
  });

  it('puts Create rule beside the title and opens the full form with a quote preview', async () => {
    renderPage();
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: /create rule/i }));
    const dialog = await screen.findByRole('dialog', { name: /create pricing rule/i });
    for (const label of [/category/i, /^service/i, /city rule/i, /base price/i, /duration/i, /cancellation fee/i]) {
      expect(within(dialog).getAllByLabelText(label).length).toBeGreaterThan(0);
    }
    expect(within(dialog).getByRole('radio', { name: 'Fixed' })).toBeChecked();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Hourly' }));
    expect(within(dialog).getByLabelText(/rate per hour/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /add-ons/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /surge windows/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /quote preview/i })).toBeInTheDocument();
  });

  it('creates a rule with PUT and records it in the audit log', async () => {
    h.put.mockImplementation((_u: string, body: object) => ok({ ...body, id: 'r9' }));
    renderPage();
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: /create rule/i }));
    const dialog = await screen.findByRole('dialog', { name: /create pricing rule/i });
    await userEvent.selectOptions(within(dialog).getByLabelText(/category/i), 'a1');
    await userEvent.selectOptions(within(dialog).getByLabelText(/^service/i), 's2');
    expect(within(dialog).getByLabelText(/base price/i)).toHaveValue(799); // prefilled from the service
    await userEvent.click(within(dialog).getByRole('button', { name: /add add-on/i }));
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Gas refill');
    await userEvent.type(within(dialog).getByLabelText('Price (₹)'), '250');
    await userEvent.click(within(dialog).getByRole('button', { name: /create rule/i }));

    await waitFor(() => expect(h.put).toHaveBeenCalledTimes(1));
    expect(h.put.mock.calls[0][0]).toBe('/admin/pricing');
    expect(h.put.mock.calls[0][1]).toMatchObject({
      categoryId: 'a1', serviceId: 's2', city: '', mode: 'FIXED', basePrice: 799, durationMinutes: 120, addOns: [{ name: 'Gas refill', price: 250 }],
    });

    await userEvent.click(screen.getByRole('button', { name: /audit log/i }));
    const log = await screen.findByRole('dialog', { name: /pricing audit log/i });
    expect(await within(log).findByText(/Sofa Shampooing/)).toBeInTheDocument();
  });

  it('blocks a duplicate scope instead of silently replacing the rule', async () => {
    renderPage();
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: /create rule/i }));
    const dialog = await screen.findByRole('dialog', { name: /create pricing rule/i });
    await userEvent.selectOptions(within(dialog).getByLabelText(/category/i), 'a1');
    await userEvent.selectOptions(within(dialog).getByLabelText(/^service/i), 's1');
    expect(await within(dialog).findByText(/rule already exists/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /create rule/i }));
    expect(h.put).not.toHaveBeenCalled();
  });

  it('treats city names case-insensitively', async () => {
    renderPage();
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: /create rule/i }));
    const dialog = await screen.findByRole('dialog', { name: /create pricing rule/i });
    await userEvent.selectOptions(within(dialog).getByLabelText(/category/i), 'a1');
    await userEvent.type(within(dialog).getByLabelText(/city rule/i), '  hyderabad ');
    expect(await within(dialog).findByText(/rule already exists/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /create rule/i }));
    expect(h.put).not.toHaveBeenCalled();
  });

  it('removes a rule with DELETE after confirmation', async () => {
    h.delete.mockImplementation(() => ok({ id: 'r1' }));
    renderPage();
    const table = await screen.findByRole('table');
    await userEvent.click(within(table).getAllByRole('button', { name: /remove rule/i })[0]);
    await userEvent.click(await screen.findByRole('button', { name: /^remove$/i }));
    await waitFor(() => expect(h.delete).toHaveBeenCalledWith('/admin/pricing/r1'));
  });

  it('toggles status by sending the whole rule with active flipped', async () => {
    h.put.mockImplementation((_u: string, body: object) => ok({ ...body, id: 'r1' }));
    renderPage();
    const table = await screen.findByRole('table');
    await userEvent.click(within(table).getAllByRole('switch')[0]);
    await waitFor(() => expect(h.put).toHaveBeenCalledTimes(1));
    expect(h.put.mock.calls[0][1]).toMatchObject({ serviceId: 's1', active: false, basePrice: 599 });
  });

  it('hides create, edit and remove without the permission', async () => {
    signIn([]);
    useAuthStore.setState({ user: { role: 'staff', permissions: ['other:perm'] } });
    renderPage();
    const table = await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: /create rule/i })).not.toBeInTheDocument();
    expect(within(table).queryByRole('button', { name: /edit rule/i })).not.toBeInTheDocument();
  });
});
