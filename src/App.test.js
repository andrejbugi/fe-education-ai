import { render, screen } from '@testing-library/react';
import App from './App';

test('renders onboarding flow', () => {
  render(<App />);
  const onboardingTitle = screen.getByText(/Избери улога за почеток/i);
  const continueButton = screen.getByRole('button', { name: /Продолжи/i });
  expect(onboardingTitle).toBeInTheDocument();
  expect(continueButton).toBeInTheDocument();
});
