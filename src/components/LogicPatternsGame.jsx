import { useEffect, useRef, useState } from 'react';
import logicTasksData from '../data/logicki_zadaci_30_mk.json';

const TOTAL_ROUNDS = 5;
const LETTER_OPTION_POOL = ['А', 'Б', 'В', 'Г', 'Д', 'Ѓ', 'Е', 'Ж'];
const SHAPE_OPTION_POOL = ['△', '◯', '□', '⬟', '▭'];
const WORD_OPTION_POOL = ['голем', 'мал', 'среден', 'брз', 'бавен'];

function toText(value) {
  return String(value || '').trim();
}

function isNumericAnswer(answer) {
  return /^-?\d+$/.test(toText(answer));
}

function buildNumericDistractors(answer) {
  const numericAnswer = Number(answer);
  const offsets = numericAnswer >= 20 ? [2, 4, 6, 8, 10] : [1, 2, 3, 4, 5];
  const candidates = [];

  offsets.forEach((offset) => {
    const lower = numericAnswer - offset;
    const upper = numericAnswer + offset;

    if (lower > 0) {
      candidates.push(String(lower));
    }
    candidates.push(String(upper));
  });

  return Array.from(new Set(candidates)).filter((value) => value !== String(numericAnswer));
}

function buildQuantifiedDistractors(answer) {
  const match = toText(answer).match(/^(\d+)\s+(.+)$/);
  if (!match) {
    return [];
  }

  const [, numberPart, suffix] = match;
  const numericValue = Number(numberPart);
  const candidates = [numericValue - 1, numericValue + 1, numericValue + 2]
    .filter((value) => value > 0 && value !== numericValue)
    .map((value) => `${value} ${suffix}`);

  return Array.from(new Set(candidates));
}

function buildStringDistractors(answer, type, taskAnswers) {
  const normalizedAnswer = toText(answer);
  const sharedPool =
    type === 'letters'
      ? LETTER_OPTION_POOL
      : type === 'shapes'
        ? SHAPE_OPTION_POOL
        : type === 'words'
          ? WORD_OPTION_POOL
          : taskAnswers;

  return sharedPool.filter((value) => toText(value) !== normalizedAnswer);
}

function rotateOptions(options, seed) {
  const rotation = seed % options.length;
  return options.map((_, index) => options[(index + rotation) % options.length]);
}

function buildOptions(task, taskAnswers) {
  const answer = toText(task.answer);
  const taskType = toText(task.type).toLowerCase();

  let distractors = [];

  if (isNumericAnswer(answer)) {
    distractors = buildNumericDistractors(answer);
  } else if (/^\d+\s+/.test(answer)) {
    distractors = buildQuantifiedDistractors(answer);
  } else {
    distractors = buildStringDistractors(answer, taskType, taskAnswers);
  }

  const optionSet = [answer, ...distractors.slice(0, 3)];
  while (optionSet.length < 4) {
    optionSet.push(`Опција ${optionSet.length}`);
  }

  return rotateOptions(Array.from(new Set(optionSet)).slice(0, 4), Number(task.id || 0));
}

function buildSequence(question) {
  return toText(question)
    .split(',')
    .map((part) => toText(part).replace('__', '?'))
    .filter(Boolean);
}

const TASK_ANSWER_POOL = Array.from(
  new Set(
    (logicTasksData?.tasks || [])
      .map((task) => toText(task.answer))
      .filter((answer) => answer && !isNumericAnswer(answer) && !/^\d+\s+/.test(answer))
  )
);

export const LOGIC_PATTERN_BANK = (logicTasksData?.tasks || []).map((task) => {
  const answer = toText(task.answer);

  return {
    id: `task-${task.id}`,
    sourceTaskId: Number(task.id),
    sequence: buildSequence(task.question),
    prompt: task.prompt_mk || 'Што недостасува?',
    options: buildOptions(task, TASK_ANSWER_POOL),
    correctOption: answer,
    explanation: task.explanation_mk || `Точниот одговор е ${answer}.`,
  };
});

function shuffleItems(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

function buildSessionPatterns() {
  return shuffleItems(LOGIC_PATTERN_BANK).slice(0, TOTAL_ROUNDS);
}

function LogicPatternsGame({ disabled, availability }) {
  const [patterns, setPatterns] = useState(() => buildSessionPatterns());
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [feedback, setFeedback] = useState('Одбери го точниот следен чекор во шемата.');
  const [feedbackTone, setFeedbackTone] = useState('neutral');
  const [lockedOptions, setLockedOptions] = useState(false);
  const nextRoundTimeoutRef = useRef(null);

  const currentPattern = patterns[round - 1] || null;
  const isFinished = round > TOTAL_ROUNDS;

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

    setPatterns(buildSessionPatterns());
    setRound(1);
    setCorrectCount(0);
    setStreak(0);
    setSelectedOption('');
    setFeedback('Одбери го точниот следен чекор во шемата.');
    setFeedbackTone('neutral');
    setLockedOptions(false);
  }, [disabled]);

  const handleRestart = () => {
    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }

    setPatterns(buildSessionPatterns());
    setRound(1);
    setCorrectCount(0);
    setStreak(0);
    setSelectedOption('');
    setFeedback('Одбери го точниот следен чекор во шемата.');
    setFeedbackTone('neutral');
    setLockedOptions(false);
  };

  const handleOptionSelect = (option) => {
    if (disabled || isFinished || lockedOptions || !currentPattern) {
      return;
    }

    const isCorrect = option === currentPattern.correctOption;

    setSelectedOption(option);
    setLockedOptions(true);
    setFeedbackTone(isCorrect ? 'correct' : 'incorrect');
    setFeedback(
      isCorrect
        ? `Точно! ${currentPattern.explanation}`
        : `Не е точно. Точниот одговор е ${currentPattern.correctOption}. ${currentPattern.explanation}`
    );

    if (isCorrect) {
      setCorrectCount((current) => current + 1);
      setStreak((current) => current + 1);
    } else {
      setStreak(0);
    }

    nextRoundTimeoutRef.current = setTimeout(() => {
      setRound((current) => current + 1);
      setSelectedOption('');
      setLockedOptions(false);
      setFeedback('Одбери го точниот следен чекор во шемата.');
      setFeedbackTone('neutral');
      nextRoundTimeoutRef.current = null;
    }, 500);
  };

  return (
    <section className={`learning-game-panel logic-game-panel ${disabled ? 'is-disabled' : ''}`}>
      <div className="learning-game-panel-top">
        <div>
          <p className="quiz-games-eyebrow">Логички шеми</p>
          <h2 className="section-title">Пронајди го следниот чекор</h2>
          <p className="item-meta">Гледај ја низата и избери што логично следува.</p>
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
          <h3>Логичката сесија е завршена.</h3>
          <p>
            Реши {correctCount} од {TOTAL_ROUNDS} шеми точно.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleRestart}>
            Играј повторно
          </button>
        </div>
      ) : null}

      {!disabled && !isFinished && currentPattern ? (
        <>
          <div className="logic-pattern-sequence" aria-live="polite">
            {currentPattern.sequence.map((item, index) => (
              <span key={`${currentPattern.id}-${item}-${index}`}>{item}</span>
            ))}
          </div>

          <div className="logic-pattern-prompt-row">
            <strong>{currentPattern.prompt}</strong>
            <button type="button" className="btn btn-secondary" onClick={handleRestart}>
              Нова сесија
            </button>
          </div>

          <div className="logic-pattern-options">
            {currentPattern.options.map((option) => {
              const isCorrectOption = lockedOptions && option === currentPattern.correctOption;
              const isIncorrectOption =
                lockedOptions && option === selectedOption && option !== currentPattern.correctOption;

              return (
                <button
                  key={`${currentPattern.id}-${option}`}
                  type="button"
                  className={`logic-pattern-option ${selectedOption === option ? 'is-selected' : ''} ${
                    isCorrectOption ? 'is-correct' : ''
                  } ${isIncorrectOption ? 'is-incorrect' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                  disabled={lockedOptions}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <p className={`item-meta learning-game-feedback ${feedbackTone !== 'neutral' ? `is-${feedbackTone}` : ''}`}>
            {feedback}
          </p>
        </>
      ) : null}
    </section>
  );
}

export default LogicPatternsGame;
