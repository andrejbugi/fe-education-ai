import { useEffect, useState } from 'react';

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

function BasicMathSprintGame({ disabled }) {
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [challenge, setChallenge] = useState(() => buildChallenge());
  const [feedback, setFeedback] = useState('');
  const isFinished = round > TOTAL_ROUNDS;

  useEffect(() => {
    if (!disabled) {
      return;
    }

    setRound(1);
    setCorrectCount(0);
    setStreak(0);
    setInputValue('');
    setChallenge(buildChallenge());
    setFeedback('');
  }, [disabled]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (disabled || isFinished || inputValue.trim() === '') {
      return;
    }

    const parsedAnswer = Number(inputValue);
    const isCorrect = parsedAnswer === challenge.answer;

    if (isCorrect) {
      setCorrectCount((current) => current + 1);
      setStreak((current) => current + 1);
      setFeedback('Точно. Продолжи со следната задача.');
    } else {
      setStreak(0);
      setFeedback(`Точниот одговор беше ${challenge.answer}. Следна рунда.`);
    }

    setRound((current) => current + 1);
    setInputValue('');
    setChallenge(buildChallenge());
  };

  const handleRestart = () => {
    setRound(1);
    setCorrectCount(0);
    setStreak(0);
    setInputValue('');
    setChallenge(buildChallenge());
    setFeedback('');
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
          <h3>Игри се достапни само во вечерниот прозорец.</h3>
          <p>Отвори ја страницата повторно помеѓу 18:00 и 20:00 за да играш.</p>
        </div>
      ) : null}

      {!disabled && isFinished ? (
        <div className="learning-game-result">
          <h3>Сесијата е завршена.</h3>
          <p>
            Освои {correctCount} од {TOTAL_ROUNDS} точни одговори.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleRestart}>
            Игraj повторно
          </button>
        </div>
      ) : null}

      {!disabled && !isFinished ? (
        <form className="learning-game-form" onSubmit={handleSubmit}>
          <div className="learning-game-challenge" aria-live="polite">
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
            />
          </div>
          <div className="item-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inputValue.trim() === ''}
            >
              Провери
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleRestart}>
              Нова сесија
            </button>
          </div>
          <p className="item-meta learning-game-feedback">{feedback || 'Внеси број и кликни „Провери“.'}</p>
        </form>
      ) : null}
    </section>
  );
}

export default BasicMathSprintGame;
