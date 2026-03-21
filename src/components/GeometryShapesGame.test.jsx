import { act, fireEvent, render, screen } from '@testing-library/react';
import GeometryShapesGame from './GeometryShapesGame';

test('geometry game shows temporary incorrect feedback on a wrong match', () => {
  jest.useFakeTimers();

  render(
    <GeometryShapesGame
      disabled={false}
      availability={{ availableFrom: '00:00', availableUntil: '23:59' }}
    />
  );

  const triangleButton = screen.getByRole('button', { name: /Триаголник/i });
  const wrongDefinitionButton = screen.getByRole('button', {
    name: /Четириаголник со 4 прави агли\./i,
  });

  fireEvent.click(triangleButton);
  fireEvent.click(wrongDefinitionButton);

  const feedback = screen.getByText(/Не е точно совпаѓање\. Пробај повторно со друг пар\./i);

  expect(feedback).toHaveClass('is-incorrect');
  expect(triangleButton).toHaveClass('is-incorrect-flash');
  expect(wrongDefinitionButton).toHaveClass('is-incorrect-flash');

  act(() => {
    jest.advanceTimersByTime(500);
  });

  expect(triangleButton).not.toHaveClass('is-incorrect-flash');
  expect(wrongDefinitionButton).not.toHaveClass('is-incorrect-flash');

  jest.useRealTimers();
});
