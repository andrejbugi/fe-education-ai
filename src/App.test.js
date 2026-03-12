import { render, screen } from '@testing-library/react';
import App from './App';

test('renders student dashboard sections', () => {
  render(<App />);
  const heroTitle = screen.getByText(/Следно за тебе/i);
  const homeworkSection = screen.getByText(/Домашни задачи/i);
  expect(heroTitle).toBeInTheDocument();
  expect(homeworkSection).toBeInTheDocument();
});
