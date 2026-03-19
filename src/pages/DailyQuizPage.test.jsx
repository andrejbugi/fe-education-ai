import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyQuizPage from './DailyQuizPage';
import { getDailyQuizAvailability, getDailyQuizForDate } from '../data/quizGames';

test('daily quiz page submits a selected answer and becomes read-only after answering', async () => {
  const quiz = getDailyQuizForDate(new Date('2026-03-19T18:30:00'));
  const availability = getDailyQuizAvailability();
  const onSubmitAnswer = jest.fn().mockResolvedValue(null);
  const baseProps = {
    theme: 'light',
    onToggleTheme: jest.fn(),
    onNavigate: jest.fn(),
    onLogout: jest.fn(),
    profile: {
      school: 'ОУ Браќа Миладиновци',
      fullName: 'Марија Стојанова',
      className: '7-A',
      initials: 'МС',
    },
    availability,
    quiz,
    onSubmitAnswer,
  };

  const { rerender } = render(
    <DailyQuizPage
      {...baseProps}
      answerRecord={null}
    />
  );

  await userEvent.click(screen.getByLabelText(quiz.correctAnswer));
  await userEvent.click(screen.getByRole('button', { name: /^Испрати$/i }));

  await waitFor(() => {
    expect(onSubmitAnswer).toHaveBeenCalledWith(quiz, quiz.correctAnswer);
  });
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /^Испрати$/i })).not.toBeDisabled();
  });

  rerender(
    <DailyQuizPage
      {...baseProps}
      answerRecord={{
        selectedAnswer: quiz.correctAnswer,
        correct: true,
        explanation: quiz.explanation,
        xpAwarded: 1,
      }}
    />
  );

  expect(screen.getByRole('heading', { name: /Точен одговор! \+1 XP/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Испрати$/i })).toBeDisabled();
});
