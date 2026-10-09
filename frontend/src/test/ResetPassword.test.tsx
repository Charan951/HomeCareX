import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from '../pages/public/ResetPassword';
import { resetStateStore } from '../features/auth/resetStateStore';
import { authApi } from '../services/authApi';

// Mock authApi
vi.mock('../services/authApi', () => ({
  authApi: {
    resetPassword: vi.fn(),
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ResetPassword Page - Submit & Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStateStore.clear();
  });

  // Test 1: Valid password -> Reset Password -> API success -> /login
  it('Valid password -> Reset Password -> API success -> navigates to /login', async () => {
    const user = userEvent.setup();
    resetStateStore.setResetToken('valid-token-123');
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({
      success: true,
      message: 'Password reset successfully',
    } as never);

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /reset password/i });

    await user.type(passwordInput, 'ValidPass123!');
    await user.type(confirmInput, 'ValidPass123!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        resetToken: 'valid-token-123',
        newPassword: 'ValidPass123!',
      });
    });

    // Reset token must be cleared from memory immediately
    expect(resetStateStore.getResetToken()).toBeNull();

    // Must navigate to /login
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { resetSuccess: true },
    });
  });

  // Test 2: Invalid token -> remain on reset page and show error
  it('Invalid token -> remains on reset page and shows error', async () => {
    const user = userEvent.setup();
    resetStateStore.setResetToken('invalid-token');
    vi.mocked(authApi.resetPassword).mockRejectedValueOnce({
      status: 400,
      code: 'INVALID_RESET_TOKEN',
      message: 'Invalid or expired reset token.',
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /reset password/i });

    await user.type(passwordInput, 'ValidPass123!');
    await user.type(confirmInput, 'ValidPass123!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/invalid or expired/i)).toBeDefined();
    });

    // Does NOT navigate
    expect(mockNavigate).not.toHaveBeenCalled();
    // Form remains rendered
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDefined();
  });

  // Test 3: Expired token -> remain on reset page and show error
  it('Expired token -> remains on reset page and shows error with request new link', async () => {
    const user = userEvent.setup();
    resetStateStore.setResetToken('expired-token');
    vi.mocked(authApi.resetPassword).mockRejectedValueOnce({
      status: 400,
      code: 'RESET_TOKEN_EXPIRED',
      message: 'This password reset session is invalid or has expired.',
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /reset password/i });

    await user.type(passwordInput, 'ValidPass123!');
    await user.type(confirmInput, 'ValidPass123!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/invalid or has expired/i)).toBeDefined();
      expect(screen.getByRole('link', { name: /request a new verification code/i })).toBeDefined();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Test 4: Double click -> only one API request
  it('Double click -> only triggers a single API request', async () => {
    const user = userEvent.setup();
    resetStateStore.setResetToken('token-double-click');

    let resolveApi!: (val: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    vi.mocked(authApi.resetPassword).mockReturnValueOnce(pendingPromise as never);

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /reset password/i });

    await user.type(passwordInput, 'ValidPass123!');
    await user.type(confirmInput, 'ValidPass123!');

    // First click initiates request
    await user.click(submitBtn);
    // Rapid second click while request is in flight
    await user.click(submitBtn);

    expect(authApi.resetPassword).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolveApi({ success: true });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  // Test 5: Successful reset -> reset token is cleared from memory
  it('Successful reset -> reset token is cleared from memory', async () => {
    const user = userEvent.setup();
    resetStateStore.setResetToken('token-to-clear');
    expect(resetStateStore.getResetToken()).toBe('token-to-clear');

    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({ success: true } as never);

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^new password/i);
    const confirmInput = screen.getByLabelText(/^confirm new password/i);
    const submitBtn = screen.getByRole('button', { name: /reset password/i });

    await user.type(passwordInput, 'ValidPass123!');
    await user.type(confirmInput, 'ValidPass123!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(resetStateStore.getResetToken()).toBeNull();
    });
  });

  // Test 6: Refresh after successful reset -> old reset token cannot be reused
  it('Refresh after successful reset -> shows Invalid Reset Session and blocks submission', () => {
    // Memory store is empty (as it is after resetStateStore.clear() or on page refresh)
    expect(resetStateStore.getResetToken()).toBeNull();

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    // Form is not rendered; invalid reset session warning is displayed
    expect(screen.getByText('Invalid Reset Session')).toBeDefined();
    expect(
      screen.getByText(/this password reset session is missing a valid verification token or has expired/i)
    ).toBeDefined();
    expect(screen.getByRole('link', { name: /request new code/i })).toBeDefined();

    // Reset password button is NOT available
    expect(screen.queryByRole('button', { name: /reset password/i })).toBeNull();
  });
});
