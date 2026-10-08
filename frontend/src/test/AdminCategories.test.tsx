import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: h }));

import AdminCategoriesPage from '@/pages/admin/Categories';
import { __resetCategoryApiForTests, getApiMode } from '@/services/adminCategoryApi';

/** Exactly what categories.service.ts toDto() returns today: no parentId, images or timestamps. */
const BACKEND_ROWS = [
  { id: 'a1', name: 'Home Cleaning', slug: 'home-cleaning', description: 'Deep cleaning', icon: '🧹', sortOrder: 0, active: true, services: 2 },
  { id: 'a2', name: 'Pest Control', slug: 'pest-control', description: '', icon: '🐜', sortOrder: 1, active: false, services: 0 },
];
const ok = (data: unknown) => Promise.resolve({ data: { success: true, data } });

const renderPage = () => render(<MemoryRouter><AdminCategoriesPage /></MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  __resetCategoryApiForTests();
  Object.values(h).forEach((f) => f.mockReset());
});

describe('Admin categories page', () => {
  it('renders the flat categories the real backend returns (regression: images was undefined)', async () => {
    h.get.mockReturnValue(ok(BACKEND_ROWS));
    renderPage();
    expect(await screen.findByText('Home Cleaning')).toBeTruthy();
    expect(screen.getByText('Pest Control')).toBeTruthy();
    expect(getApiMode()).toBe('live');
  });

  it('a 409 on delete is shown as an error and does not switch to demo data', async () => {
    h.get.mockReturnValue(ok(BACKEND_ROWS));
    h.delete.mockRejectedValue({ message: '1 service is still in “Pest Control”.', status: 409, code: 'CATEGORY_IN_USE' });
    renderPage();
    await screen.findByText('Pest Control');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Delete Pest Control' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText(/still in “Pest Control”/)).toBeTruthy();
    expect(getApiMode()).toBe('live');
    expect(screen.queryByText('Washing Machine')).toBeNull(); // demo seed row must not appear
  });

  it('falls back to demo data only when the list endpoint is unreachable', async () => {
    h.get.mockRejectedValue({ message: 'Unable to reach the server.', status: undefined });
    renderPage();
    expect(await screen.findByText('Home Cleaning')).toBeTruthy();
    expect(getApiMode()).toBe('demo');
    expect(screen.getByText(/showing local demo data/i)).toBeTruthy();
  });

  it('shows an auth error instead of hiding it behind demo data', async () => {
    h.get.mockRejectedValue({ message: 'Unauthorized', status: 401 });
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(getApiMode()).toBe('unknown');
  });

  it('creating a category sends only fields the backend accepts', async () => {
    const created = { id: 'n1', name: 'Gardening', slug: 'gardening', description: '', icon: '', sortOrder: 2, active: true, services: 0 };
    // First load returns the two existing rows; the reload after creating includes the new one.
    h.get.mockReturnValueOnce(ok(BACKEND_ROWS)).mockReturnValue(ok([...BACKEND_ROWS, created]));
    h.post.mockReturnValue(ok(created));
    renderPage();
    await screen.findByText('Home Cleaning');
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: /New category/i })[0]);
    await user.type(await screen.findByLabelText('Name *'), 'Gardening');
    await user.click(screen.getByRole('button', { name: 'Create category' }));
    await waitFor(() => expect(h.post).toHaveBeenCalled());
    const [url, body] = h.post.mock.calls[0];
    expect(url).toBe('/admin/categories');
    expect(body).toMatchObject({ name: 'Gardening', active: true });
    expect(body).not.toHaveProperty('slug');
    expect(body).not.toHaveProperty('images');
    expect(body).not.toHaveProperty('parentId');
    expect(await screen.findByText('Gardening')).toBeTruthy();
  });
});
