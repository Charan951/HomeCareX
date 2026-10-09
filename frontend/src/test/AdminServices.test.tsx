import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: h }));

import AdminServicesPage from '@/pages/admin/Services';
import { __resetCategoryApiForTests } from '@/pages/admin/Services/adminCategoryApi';
import { adminServiceApi, __resetServiceApiForTests, getServiceApiMode, toWire } from '@/services/adminServiceApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { validateService } from '@/lib/serviceValidation';
import { arrayMove } from '@/lib/arrayMove';
import type { ServiceInput } from '@/types/adminService';

const CATS = [
  { id: 'a1', name: 'Home Cleaning', slug: 'home-cleaning', description: '', icon: '🧹', sortOrder: 0, active: true, services: 2 },
  { id: 'a2', name: 'Pest Control', slug: 'pest-control', description: '', icon: '🐜', sortOrder: 1, active: true, services: 0 },
];
/** Exactly what services.service.ts toDto() returns today: no media, inclusions, exclusions, FAQs or checklist. */
const row = (id: string, name: string, active = true) => ({
  id, slug: name.toLowerCase().replace(/\s+/g, '-'), name, description: 'd', categoryId: 'a1',
  category: { id: 'a1', name: 'Home Cleaning', slug: 'home-cleaning' }, basePrice: 599, durationMinutes: 90, addOns: [], active,
});
const ok = (data: unknown) => Promise.resolve({ data: { success: true, data } });

let services: ReturnType<typeof row>[];
const serve = () => h.get.mockImplementation((url: string) => ok(url.includes('categories') ? CATS : services));
const renderPage = () => render(<MemoryRouter><AdminServicesPage /></MemoryRouter>);

const signIn = (permissions: string[], role = 'staff') => useAuthStore.setState({ isAuthenticated: true, user: { role, permissions } });

beforeEach(() => {
  signIn(['catalog:manage']);
  localStorage.clear();
  useUIStore.setState({ pageSearch: '' });
  __resetCategoryApiForTests();
  __resetServiceApiForTests();
  Object.values(h).forEach((f) => f.mockReset());
  services = [row('s1', 'Deep Cleaning'), row('s2', 'Sofa Shampooing'), row('s3', 'Kitchen Cleaning', false), row('s4', 'Carpet Cleaning', false)];
  serve();
});

const baseInput = (over: Partial<ServiceInput> = {}): ServiceInput => ({
  name: 'Deep Cleaning', categoryId: 'a1', description: '', basePrice: 500, durationMinutes: 60,
  images: [], inclusions: [], exclusions: [], faqs: [], addOns: [], checklist: [], active: true, ...over,
});

describe('service validation', () => {
  const cats = [{ id: 'a1', active: true }];
  it('accepts a valid service', () => expect(validateService(baseInput(), cats)).toEqual({}));
  it('rejects an invalid category', () => {
    expect(validateService(baseInput({ categoryId: 'nope' }), cats).categoryId).toMatch(/invalid category/i);
    expect(validateService(baseInput({ categoryId: '' }), cats).categoryId).toBeTruthy();
  });
  it('checks name, price and duration bounds', () => {
    const e = validateService(baseInput({ name: 'x', basePrice: -1, durationMinutes: 2 }), cats);
    expect(Object.keys(e).sort()).toEqual(['basePrice', 'durationMinutes', 'name']);
    expect(validateService(baseInput({ basePrice: Number.NaN }), cats).basePrice).toBeTruthy();
  });
  it('flags blank or duplicate list lines, half-filled FAQs and unnamed add-ons', () => {
    expect(validateService(baseInput({ inclusions: ['a', ' '] }), cats).inclusions).toBeTruthy();
    expect(validateService(baseInput({ exclusions: ['A', 'a'] }), cats).exclusions).toMatch(/duplicate/i);
    expect(validateService(baseInput({ faqs: [{ id: '1', question: 'q', answer: '' }] }), cats).faqs).toBeTruthy();
    expect(validateService(baseInput({ addOns: [{ id: '1', name: '', price: 5 }] }), cats).addOns).toBeTruthy();
    expect(validateService(baseInput({ checklist: [{ id: '1', label: '', required: true }] }), cats).checklist).toBeTruthy();
  });
});

describe('request payload', () => {
  it('sends the primary image first and only real ObjectIds for add-ons', () => {
    const body = toWire(baseInput({
      images: [{ id: 'i1', url: 'u1', alt: 'one', isPrimary: false }, { id: 'i2', url: 'u2', alt: 'two', isPrimary: true }],
      addOns: [{ id: 'abc', name: 'Fast', price: 10 }, { id: '65000000000000000000aa01', name: 'Wax', price: 20 }],
    }));
    expect(body.media.map((m) => m.url)).toEqual(['u2', 'u1']);
    expect(body.addOns[0]).not.toHaveProperty('id');
    expect(body.addOns[1]).toHaveProperty('id', '65000000000000000000aa01');
  });
  it('arrayMove ignores out-of-range moves', () => {
    expect(arrayMove([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(arrayMove([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
});

describe('Admin services page', () => {
  it('is read-only without the catalog:manage permission', async () => {
    signIn(['bookings:read']);
    renderPage();
    await screen.findByText('Deep Cleaning');
    expect(screen.queryByRole('button', { name: /new service/i })).toBeNull();
    expect(screen.queryByLabelText('Select row s1')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit Deep Cleaning' })).toBeNull();
    expect(screen.getByText(/need the “catalog:manage” permission/)).toBeTruthy();
  });

  it('lists services from the backend and shows loading, then rows', async () => {
    renderPage();
    expect(screen.getByLabelText('Loading services')).toBeTruthy();
    expect(await screen.findByText('Deep Cleaning')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Services' })).toBeTruthy();
    expect(screen.getByText('Kitchen Cleaning')).toBeTruthy();
    expect(getServiceApiMode()).toBe('live');
  });

  it('shows the empty state with a way to create the first service', async () => {
    services = [];
    renderPage();
    expect(await screen.findByText('No services yet')).toBeTruthy();
  });

  it('shows an auth error with Retry instead of hiding it behind demo data', async () => {
    h.get.mockImplementation((url: string) => (url.includes('categories') ? ok(CATS) : Promise.reject({ message: 'Forbidden', status: 403 })));
    renderPage();
    expect(await screen.findByText('Forbidden')).toBeTruthy();
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
    expect(getServiceApiMode()).toBe('unknown');
  });

  it('filters by search and by status', async () => {
    renderPage();
    await screen.findByText('Deep Cleaning');
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Filter by category'));
    await user.click(screen.getByRole('button', { name: /pest control/i }));
    expect(screen.queryByText('Deep Cleaning')).toBeNull();
    expect(await screen.findByText('No services match your filters')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(await screen.findByText('Deep Cleaning')).toBeTruthy();
    useUIStore.setState({ pageSearch: 'sofa' });
    await waitFor(() => expect(screen.queryByText('Deep Cleaning')).toBeNull());
    expect(screen.getByText('Sofa Shampooing')).toBeTruthy();
  });

  it('creates a service, sends the full payload and shows it in the catalog', async () => {
    const created = { ...row('s9', 'Pest Spray'), categoryId: 'a2', category: { id: 'a2', name: 'Pest Control', slug: 'pest-control' }, basePrice: 899 };
    h.post.mockImplementation(() => { services = [...services, created]; return ok(created); });
    renderPage();
    await screen.findByText('Deep Cleaning');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /new service/i }));
    await user.type(await screen.findByLabelText(/^Name/), 'Pest Spray');
    await user.selectOptions(screen.getByLabelText('Category *'), 'a2');
    const price = screen.getByLabelText(/Base price/);
    await user.clear(price);
    await user.type(price, '899');
    await user.click(screen.getByRole('button', { name: /add inclusion/i }));
    await user.type(screen.getByLabelText('Inclusions line 1'), 'Gel treatment');
    await user.click(screen.getByRole('button', { name: 'Create service' }));
    await waitFor(() => expect(h.post).toHaveBeenCalled());
    const [url, body] = h.post.mock.calls[0];
    expect(url).toBe('/admin/services');
    expect(body).toMatchObject({ name: 'Pest Spray', categoryId: 'a2', basePrice: 899, inclusions: ['Gel treatment'], active: true });
    expect(await screen.findByText('Pest Spray')).toBeTruthy();
  });

  it('does not call the API when the form is invalid and tells the admin why', async () => {
    renderPage();
    await screen.findByText('Deep Cleaning');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /new service/i }));
    await user.click(await screen.findByRole('button', { name: 'Create service' }));
    expect(await screen.findByText(/at least 2 characters/i)).toBeTruthy();
    expect(screen.getByText(/choose a category/i)).toBeTruthy();
    expect(h.post).not.toHaveBeenCalled();
  });

  it('bulk deactivate asks to confirm, then patches every selected service', async () => {
    h.patch.mockReturnValue(ok({}));
    renderPage();
    await screen.findByText('Deep Cleaning');
    const user = userEvent.setup();
    await user.click(screen.getByRole('switch', { name: 'Deep Cleaning is active' }));
    await waitFor(() => expect(h.patch).toHaveBeenCalledWith('/admin/services/s1', { active: false }));
    expect(await screen.findByText(/“Deep Cleaning” deactivated/)).toBeTruthy();
  });

  it('reports partial bulk failures by name', async () => {
    h.patch.mockImplementation((url: string) => (url.endsWith('s4') ? Promise.reject({ message: 'Boom', status: 500 }) : ok({})));
    renderPage();
    await screen.findByText('Deep Cleaning');
    const res = await adminServiceApi.setActive(['s3', 's4'], true);
    expect(res.changed).toEqual(['s3']);
    expect(res.failed).toEqual([{ id: 's4', name: 'Carpet Cleaning', message: 'Boom' }]);
  });

  it('shows the server message when a service cannot be deleted', async () => {
    h.delete.mockRejectedValue({ message: 'This service has bookings. Deactivate it instead of deleting.', status: 409, code: 'SERVICE_IN_USE' });
    renderPage();
    await screen.findByText('Deep Cleaning');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Delete Deep Cleaning' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText(/has bookings/i)).toBeTruthy();
    expect(getServiceApiMode()).toBe('live');
  });

  it('warns when the server accepted but did not store the extra fields', async () => {
    const created = row('s9', 'Pest Spray');
    h.post.mockImplementation(() => { services = [...services, created]; return ok(created); }); // no inclusions echoed back
    renderPage();
    await screen.findByText('Deep Cleaning');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /new service/i }));
    await user.type(await screen.findByLabelText(/^Name/), 'Pest Spray');
    await user.selectOptions(screen.getByLabelText('Category *'), 'a1');
    await user.click(screen.getByRole('button', { name: /add inclusion/i }));
    await user.type(screen.getByLabelText('Inclusions line 1'), 'Gel');
    await user.click(screen.getByRole('button', { name: 'Create service' }));
    expect(await screen.findByText(/inclusions are kept in this browser/i)).toBeTruthy();
  });
});
