import { useEffect, useMemo, useRef, useState } from 'react';

const MEMORY_ITEMS = [
  { id: 'book', emoji: '📘', label: 'Книга' },
  { id: 'star', emoji: '⭐', label: 'Ѕвезда' },
  { id: 'leaf', emoji: '🍃', label: 'Лист' },
  { id: 'music', emoji: '🎵', label: 'Нота' },
  { id: 'apple', emoji: '🍎', label: 'Јаболко' },
  { id: 'sun', emoji: '☀', label: 'Сонце' },
];

function shuffleItems(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

function buildDeck() {
  return shuffleItems(
    MEMORY_ITEMS.flatMap((item, index) => [
      { ...item, cardId: `${item.id}-a-${index}` },
      { ...item, cardId: `${item.id}-b-${index}` },
    ])
  );
}

function MemoryPairsGame({ disabled, availability }) {
  const [deck, setDeck] = useState(() => buildDeck());
  const [revealedIds, setRevealedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [feedback, setFeedback] = useState('Отвори две картички и најди парови.');
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const mismatchTimeoutRef = useRef(null);

  const matchedCardIds = useMemo(
    () =>
      deck
        .filter((card) => matchedIds.includes(card.id))
        .map((card) => card.cardId),
    [deck, matchedIds]
  );
  const isFinished = matchedIds.length === MEMORY_ITEMS.length;
  const lockedBoard = revealedIds.length === 2;

  useEffect(() => {
    return () => {
      if (mismatchTimeoutRef.current) {
        clearTimeout(mismatchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }

    setDeck(buildDeck());
    setRevealedIds([]);
    setMatchedIds([]);
    setMoveCount(0);
    setFeedback('Отвори две картички и најди парови.');
    setCompletionDismissed(false);
  }, [disabled]);

  const handleRestart = () => {
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }

    setDeck(buildDeck());
    setRevealedIds([]);
    setMatchedIds([]);
    setMoveCount(0);
    setFeedback('Отвори две картички и најди парови.');
    setCompletionDismissed(false);
  };

  const handleCardClick = (cardId) => {
    if (disabled || isFinished || lockedBoard || revealedIds.includes(cardId) || matchedCardIds.includes(cardId)) {
      return;
    }

    const nextRevealedIds = [...revealedIds, cardId];
    setRevealedIds(nextRevealedIds);

    if (nextRevealedIds.length < 2) {
      setFeedback('Избери уште една картичка за да провериш пар.');
      return;
    }

    setMoveCount((current) => current + 1);

    const [firstCardId, secondCardId] = nextRevealedIds;
    const firstCard = deck.find((card) => card.cardId === firstCardId);
    const secondCard = deck.find((card) => card.cardId === secondCardId);

    if (!firstCard || !secondCard) {
      setRevealedIds([]);
      return;
    }

    if (firstCard.id === secondCard.id) {
      setMatchedIds((current) => [...current, firstCard.id]);
      setRevealedIds([]);
      setFeedback(`Одлично! Го најде парот „${firstCard.label}“.`);
      return;
    }

    setFeedback('Овие две картички не се пар. Запомни ги и пробај повторно.');
    mismatchTimeoutRef.current = setTimeout(() => {
      setRevealedIds([]);
      mismatchTimeoutRef.current = null;
    }, 700);
  };

  return (
    <section className={`learning-game-panel memory-game-panel ${disabled ? 'is-disabled' : ''}`}>
      <div className="learning-game-panel-top">
        <div>
          <p className="quiz-games-eyebrow">Меморија</p>
          <h2 className="section-title">Најди ги сите парови</h2>
          <p className="item-meta">Сврти картички, памети позиции и исчисти ја таблата.</p>
        </div>
        <div className="learning-game-stats">
          <span>Парови {matchedIds.length}/{MEMORY_ITEMS.length}</span>
          <span>Потези {moveCount}</span>
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

      {!disabled ? (
        <>
          <div className="learning-game-toolbar">
            <button type="button" className="btn btn-primary" onClick={handleRestart}>
              Нова игра
            </button>
          </div>

          <div className="memory-grid">
            {deck.map((card, index) => {
              const isRevealed = revealedIds.includes(card.cardId);
              const isMatched = matchedCardIds.includes(card.cardId);
              const shouldShowBack = isRevealed || isMatched;

              return (
                <button
                  key={card.cardId}
                  type="button"
                  className={`memory-card ${isRevealed ? 'is-revealed' : ''} ${
                    isMatched ? 'is-matched' : ''
                  }`}
                  onClick={() => handleCardClick(card.cardId)}
                  aria-label={isRevealed || isMatched ? card.label : `Скриена картичка ${index + 1}`}
                  disabled={isMatched || isFinished}
                >
                  {shouldShowBack ? (
                    <span className="memory-card-face memory-card-back is-visible">
                      <strong>{card.emoji}</strong>
                      <small>{card.label}</small>
                    </span>
                  ) : (
                    <span className="memory-card-face memory-card-front">?</span>
                  )}
                </button>
              );
            })}
          </div>

          {!isFinished ? (
            <p className="item-meta learning-game-feedback">{feedback}</p>
          ) : !completionDismissed ? (
            <div className="learning-game-result memory-game-result">
              <h3>Таблата е исчистена.</h3>
              <p>
                Ги најде сите {MEMORY_ITEMS.length} пара во {moveCount} потези.
              </p>
              <div className="item-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCompletionDismissed(true)}
                >
                  Готово
                </button>
                <button type="button" className="btn btn-primary" onClick={handleRestart}>
                  Нова игра
                </button>
              </div>
            </div>
          ) : (
            <p className="item-meta learning-game-feedback">Таблата останува отворена додека не почнеш нова игра.</p>
          )}
        </>
      ) : null}
    </section>
  );
}

export default MemoryPairsGame;
