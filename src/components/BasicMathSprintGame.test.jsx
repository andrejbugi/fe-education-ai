import { act, fireEvent, render, screen } from '@testing-library/react';
import BasicMathSprintGame from './BasicMathSprintGame';

test('basic math sprint keeps answer feedback visible for 500ms before moving on', () => {
  jest.useFakeTimers();
  const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

  render(
    <BasicMathSprintGame
      disabled={false}
      availability={{ availableFrom: '00:00', availableUntil: '23:59' }}
    />
  );

  const answerInput = screen.getByLabelText(/Одговор за математичката задача/i);

  fireEvent.change(answerInput, { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: /Провери/i }));

  expect(screen.getByText(/Точно\. Продолжи со следната задача\./i)).toBeInTheDocument();
  expect(screen.getByText(/Рунда 1\/5/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Одговор за математичката задача/i)).toBeDisabled();
  expect(screen.getByDisplayValue('3')).toHaveClass('is-correct');

  act(() => {
    jest.advanceTimersByTime(499);
  });

  expect(screen.getByText(/Рунда 1\/5/i)).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(1);
  });

  expect(screen.getByText(/Рунда 2\/5/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Одговор за математичката задача/i)).not.toBeDisabled();

  randomSpy.mockRestore();
  jest.useRealTimers();
});
