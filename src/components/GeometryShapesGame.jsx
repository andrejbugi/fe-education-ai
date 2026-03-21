import { useEffect, useMemo, useRef, useState } from 'react';

const MAX_HINTS = 3;
const GEOMETRY_PAIRS = [
  {
    id: 'triangle',
    term: 'Триаголник',
    definition: 'Форма со 3 страни и 3 агли.',
    emoji: '△',
  },
  {
    id: 'rectangle',
    term: 'Правоаголник',
    definition: 'Четириаголник со 4 прави агли.',
    emoji: '▭',
  },
  {
    id: 'circle',
    term: 'Круг',
    definition: 'Заоблена форма без агли и без страни.',
    emoji: '◯',
  },
  {
    id: 'perimeter',
    term: 'Периметар',
    definition: 'Вкупната должина околу надворешната страна на формата.',
    emoji: '📏',
  },
  {
    id: 'area',
    term: 'Површина',
    definition: 'Просторот што го зафаќа формата внатре.',
    emoji: '▣',
  },
  {
    id: 'angle',
    term: 'Агол',
    definition: 'Просторот меѓу две линии што се сечат во една точка.',
    emoji: '∠',
  },
];

function shuffleItems(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

function buildInitialState() {
  return {
    termOrder: shuffleItems(GEOMETRY_PAIRS.map((item) => item.id)),
    definitionOrder: shuffleItems(GEOMETRY_PAIRS.map((item) => item.id)),
    selectedTermId: '',
    selectedDefinitionId: '',
    matchedIds: [],
    hintsRemaining: MAX_HINTS,
    hintedId: '',
    feedbackTone: 'neutral',
    highlightedIds: [],
    highlightTone: 'neutral',
    feedback: 'Кликни на термин, па на неговата точна дефиниција.',
  };
}

function GeometryShapesGame({ disabled, availability }) {
  const pairById = useMemo(
    () => new Map(GEOMETRY_PAIRS.map((item) => [item.id, item])),
    []
  );
  const [gameState, setGameState] = useState(() => buildInitialState());
  const feedbackTimeoutRef = useRef(null);

  const clearFeedbackHighlight = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearFeedbackHighlight();
    };
  }, []);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    clearFeedbackHighlight();
    setGameState(buildInitialState());
  }, [disabled]);

  const totalPairs = GEOMETRY_PAIRS.length;
  const {
    termOrder,
    definitionOrder,
    selectedTermId,
    selectedDefinitionId,
    matchedIds,
    hintsRemaining,
    hintedId,
    feedbackTone,
    highlightedIds,
    highlightTone,
    feedback,
  } = gameState;
  const isFinished = matchedIds.length === totalPairs;

  const resetGame = () => {
    clearFeedbackHighlight();
    setGameState(buildInitialState());
  };

  const flashResolution = (ids, tone) => {
    clearFeedbackHighlight();

    setGameState((current) => ({
      ...current,
      highlightedIds: ids,
      highlightTone: tone,
    }));

    feedbackTimeoutRef.current = setTimeout(() => {
      setGameState((current) => ({
        ...current,
        highlightedIds: [],
        highlightTone: 'neutral',
      }));
      feedbackTimeoutRef.current = null;
    }, 500);
  };

  const resolveSelection = (termId, definitionId) => {
    const isMatch = termId === definitionId;
    flashResolution([termId, definitionId], isMatch ? 'correct' : 'incorrect');

    setGameState((current) => ({
      ...current,
      selectedTermId: '',
      selectedDefinitionId: '',
      hintedId: '',
      feedbackTone: isMatch ? 'correct' : 'incorrect',
      matchedIds: isMatch
        ? [...current.matchedIds, termId]
        : current.matchedIds,
      feedback: isMatch
        ? `Точно! „${pairById.get(termId)?.term}“ е успешно поврзано.`
        : 'Не е точно совпаѓање. Пробај повторно со друг пар.',
    }));
  };

  const handleSelectTerm = (termId) => {
    if (disabled || isFinished || matchedIds.includes(termId)) {
      return;
    }

    if (selectedDefinitionId) {
      resolveSelection(termId, selectedDefinitionId);
      return;
    }

    setGameState((current) => ({
      ...current,
      selectedTermId: current.selectedTermId === termId ? '' : termId,
      hintedId: '',
      feedbackTone: 'neutral',
      feedback: 'Сега избери ја дефиницијата што одговара на терминот.',
    }));
  };

  const handleSelectDefinition = (definitionId) => {
    if (disabled || isFinished || matchedIds.includes(definitionId)) {
      return;
    }

    if (selectedTermId) {
      resolveSelection(selectedTermId, definitionId);
      return;
    }

    setGameState((current) => ({
      ...current,
      selectedDefinitionId: current.selectedDefinitionId === definitionId ? '' : definitionId,
      hintedId: '',
      feedbackTone: 'neutral',
      feedback: 'Сега избери го терминот што одговара на дефиницијата.',
    }));
  };

  const handleHint = () => {
    if (disabled || isFinished || hintsRemaining <= 0) {
      return;
    }

    const nextHintId = GEOMETRY_PAIRS.find((item) => !matchedIds.includes(item.id))?.id;

    if (!nextHintId) {
      return;
    }

    setGameState((current) => ({
      ...current,
      hintsRemaining: Math.max(0, current.hintsRemaining - 1),
      hintedId: nextHintId,
      selectedTermId: '',
      selectedDefinitionId: '',
      feedbackTone: 'hint',
      feedback: `Совет: побарај ја врската за „${pairById.get(nextHintId)?.term}“.`,
    }));
  };

  return (
    <section className={`learning-game-panel geometry-game-panel ${disabled ? 'is-disabled' : ''}`}>
      <div className="learning-game-panel-top">
        <div>
          <p className="quiz-games-eyebrow">Геометрија</p>
          <h2 className="section-title">Геометрија совпаѓање</h2>
          <p className="item-meta">
            Поврзи го секој термин со неговата точна дефиниција.
          </p>
        </div>
        <div className="learning-game-stats">
          <span>Совпаѓања {matchedIds.length}/{totalPairs}</span>
          <span>Совети {hintsRemaining}</span>
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleHint}
              disabled={hintsRemaining <= 0 || isFinished}
            >
              Побарај совет
            </button>
            <button type="button" className="btn btn-primary" onClick={resetGame}>
              Нова игра
            </button>
          </div>

          {!isFinished ? (
            <div className="geometry-match-grid">
              <section className="geometry-match-column">
                <h3>Термини</h3>
                <div className="geometry-match-list">
                  {termOrder.map((termId) => {
                    const item = pairById.get(termId);
                    const isMatched = matchedIds.includes(termId);
                    const isSelected = selectedTermId === termId;
                    const isHinted = hintedId === termId;
                    const isHighlighted = highlightedIds.includes(termId);

                    return (
                      <button
                        key={termId}
                        type="button"
                        className={`geometry-match-card is-term ${isMatched ? 'is-matched' : ''} ${
                          isSelected ? 'is-selected' : ''
                        } ${isHinted ? 'is-hinted' : ''} ${
                          isHighlighted && highlightTone === 'correct' ? 'is-correct-flash' : ''
                        } ${isHighlighted && highlightTone === 'incorrect' ? 'is-incorrect-flash' : ''}`}
                        onClick={() => handleSelectTerm(termId)}
                        disabled={isMatched}
                      >
                        <span className="geometry-match-symbol">{item?.emoji}</span>
                        <span className="geometry-match-copy">{item?.term}</span>
                        <span className="geometry-match-state">{isMatched ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="geometry-match-column">
                <h3>Дефиниции</h3>
                <div className="geometry-match-list">
                  {definitionOrder.map((definitionId) => {
                    const item = pairById.get(definitionId);
                    const isMatched = matchedIds.includes(definitionId);
                    const isSelected = selectedDefinitionId === definitionId;
                    const isHinted = hintedId === definitionId;
                    const isHighlighted = highlightedIds.includes(definitionId);

                    return (
                      <button
                        key={definitionId}
                        type="button"
                        className={`geometry-match-card is-definition ${
                          isMatched ? 'is-matched' : ''
                        } ${isSelected ? 'is-selected' : ''} ${isHinted ? 'is-hinted' : ''} ${
                          isHighlighted && highlightTone === 'correct' ? 'is-correct-flash' : ''
                        } ${isHighlighted && highlightTone === 'incorrect' ? 'is-incorrect-flash' : ''}`}
                        onClick={() => handleSelectDefinition(definitionId)}
                        disabled={isMatched}
                      >
                        <span className="geometry-match-copy">{item?.definition}</span>
                        <span className="geometry-match-state">{isMatched ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="learning-game-result geometry-game-result">
              <h3>Одлично завршено.</h3>
              <p>Ги поврза сите {totalPairs} термини по геометрија.</p>
              <button type="button" className="btn btn-primary" onClick={resetGame}>
                Играј повторно
              </button>
            </div>
          )}

          <p className={`item-meta learning-game-feedback is-${feedbackTone}`}>{feedback}</p>
        </>
      ) : null}
    </section>
  );
}

export default GeometryShapesGame;
