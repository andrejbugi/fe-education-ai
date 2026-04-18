import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordResetRequestPage from './PasswordResetRequestPage';
import { api } from '../services/apiClient';

jest.mock('../services/apiClient', () => ({
  STORAGE_KEYS: {
    theme: 'student-app-theme',
  },
  api: {
    requestPasswordReset: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.requestPasswordReset.mockResolvedValue(undefined);
});

test('request page submits the email and shows a success message', async () => {
  render(<PasswordResetRequestPage />);

  await userEvent.type(screen.getByLabelText('Е-пошта'), 'teacher@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Испрати линк' }));

  await waitFor(() => {
    expect(api.requestPasswordReset).toHaveBeenCalledWith({ email: 'teacher@example.com' });
  });

  expect(
    await screen.findByText(/проверете ја вашата е-пошта и отворете го линкот/i)
  ).toBeInTheDocument();
});
