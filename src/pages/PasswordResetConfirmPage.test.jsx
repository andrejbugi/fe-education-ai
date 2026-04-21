import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordResetConfirmPage from './PasswordResetConfirmPage';
import { api } from '../services/apiClient';

jest.mock('../services/apiClient', () => ({
  STORAGE_KEYS: {
    theme: 'student-app-theme',
  },
  api: {
    passwordResetDetails: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.passwordResetDetails.mockResolvedValue({
    email: 'teacher@example.com',
    status: 'pending',
    confirm_allowed: true,
    expires_at: '2026-04-18T13:30:00.000Z',
    used_at: null,
  });
  api.confirmPasswordReset.mockResolvedValue({
    password_reset: {
      email: 'teacher@example.com',
      status: 'used',
      confirm_allowed: false,
      expires_at: '2026-04-18T13:30:00.000Z',
      used_at: '2026-04-18T13:10:00.000Z',
    },
  });
});

test('confirm page validates token, submits the new password, and redirects to login', async () => {
  const redirectToLogin = jest.fn();
  render(<PasswordResetConfirmPage token="reset-token" onRedirectToLogin={redirectToLogin} />);

  expect(await screen.findByText('teacher@example.com')).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText('Нова лозинка'), 'new-password-123');
  await userEvent.type(screen.getByLabelText('Потврди нова лозинка'), 'new-password-123');
  await userEvent.click(screen.getByRole('button', { name: 'Постави нова лозинка' }));

  await waitFor(() => {
    expect(api.confirmPasswordReset).toHaveBeenCalledWith('reset-token', {
      password: 'new-password-123',
      password_confirmation: 'new-password-123',
    });
    expect(redirectToLogin).toHaveBeenCalledWith('/');
  });
});
