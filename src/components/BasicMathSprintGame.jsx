import { useEffect, useRef, useState } from 'react';

const TOTAL_ROUNDS = 5;
const OPERATIONS = ['+', '-', 'x'];

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildChallenge() {
  const operation = OPERATIONS[randomNumber(0, OPERATIONS.length - 1)];
  const left = randomNumber(2, 12);
  let right = randomNumber(1, 9);

  if (operation === '-') {
    right = randomNumber(1, left - 1);
  }

  const answer =
    operation === '+'
      ? left + right
      : operation === '-'
        ? left - right
        : left * right;

  return {
    id: `${operation}-${left}-${right}-${Date.now()}`,
    left,
    right,
    operation,
    answer,
  };
}

function BasicMathSprintGame({ disabled, availability }) {
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [challenge, setChallenge] = useState(() => buildChallenge());
  const [feedback, setFeedback] = useState('');
  const [answerState, setAnswerState] = useState('idle');
  const nextRoundTimeoutRef = useRef(null);
  const isFinished = round > TOTAL_ROUNDS;
  const isResolvingAnswer = answerState === 'correct' || answerState === 'incorrect';

  useEffect(() => {
    return () => {
      if (nextRoundTimeoutRef.current) {
        clearTimeout(nextRoundTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
    setRound(1);
    setCorrectCount(0);
    setStreak(0);
    setInputValue('');
    setChallenge(buildChallenge());
    setFeedback('');
    setAnswerState('idle');
  }, [disabled]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (disabled || isFinished || isResolvingAnswer || inputValue.trim() === '') {
      return;
    }

    const parsedAnswer = Number(inputValue);
    const isCorrect = parsedAnswer === challenge.answer;

    if (isCorrect) {
      setCorrectCount((current) => current + 1);
      setStreak((current) => current + 1);
      setAnswerState('correct');
      setFeedback('Точно. Продолжи со следната задача.');
    } else {
      setStreak(0);
      setAnswerState('incorrect');
      setFeedback(`Точниот одговор беше ${challenge.answer}. Следна рунда.`);
    }

    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
    }
    nextRoundTimeoutRef.current = setTimeout(() => {
      setRound((current) => current + 1);
      setInputValue('');
      setChallenge(buildChallenge());
      setAnswerState('idle');
      nextRoundTimeoutRef.current = null;
    }, 500);
  };

  const handleRestart = () => {
    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
    setRound(1);
    setCorrectCount(0);
    setStreak(0);
    setInputValue('');
    setChallenge(buildChallenge());
    setFeedback('');
    setAnswerState('idle');
  };

  return (
    <section className={`learning-game-panel ${disabled ? 'is-disabled' : ''}`}>
      <div className="learning-game-panel-top">
        <div>
          <p className="quiz-games-eyebrow">Брза математика</p>
          <h2 className="section-title">5 кратки рунди за загревање</h2>
        </div>
        <div className="learning-game-stats">
          <span>Рунда {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
          <span>{correctCount} точни</span>
          <span>Низа: {streak}</span>
        </div>
      </div>

      {disabled ? (
        <div className="learning-game-placeholder">
          <h3>Игри моментално не се достапни.</h3>
          <p>
            Обиди се повторно од {availability?.availableFrom || '00:00'} до{' '}
            {availability?.availableUntil || '23:59'}.
          </p>
        </div>
      ) : null}

      {!disabled && isFinished ? (
        <div className="learning-game-result">
          <h3>Сесијата е завршена.</h3>
          <p>
            Освои {correctCount} од {TOTAL_ROUNDS} точни одговори.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleRestart}>
            Играј повторно
          </button>
        </div>
      ) : null}

      {!disabled && !isFinished ? (
        <form className="learning-game-form" onSubmit={handleSubmit}>
          <div
            className={`learning-game-challenge ${
              answerState === 'correct'
                ? 'is-correct'
                : answerState === 'incorrect'
                  ? 'is-incorrect'
                  : ''
            }`}
            aria-live="polite"
          >
            <span>{challenge.left}</span>
            <span>{challenge.operation}</span>
            <span>{challenge.right}</span>
            <span>=</span>
            <input
              type="number"
              inputMode="numeric"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              aria-label="Одговор за математичката задача"
              placeholder="?"
              className={`learning-game-answer-input ${
                answerState === 'correct'
                  ? 'is-correct'
                  : answerState === 'incorrect'
                    ? 'is-incorrect'
                    : ''
              }`}
              disabled={isResolvingAnswer}
            />
          </div>
          <div className="item-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inputValue.trim() === '' || isResolvingAnswer}
            >
              Провери
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRestart}
              disabled={isResolvingAnswer}
            >
              Нова сесија
            </button>
          </div>
          <p
            className={`item-meta learning-game-feedback ${
              answerState === 'correct'
                ? 'is-correct'
                : answerState === 'incorrect'
                  ? 'is-incorrect'
                  : ''
            }`}
          >
            {feedback || 'Внеси број и кликни „Провери“.'}
          </p>
        </form>
      ) : null}
    </section>
  );
}

export default BasicMathSprintGame;
