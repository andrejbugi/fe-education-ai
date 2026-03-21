import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { formatQuizCategoryLabel } from '../data/quizGames';

function DailyQuizPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  profile,
  availability,
  quiz,
  answerRecord,
  onSubmitAnswer,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(answerRecord?.selectedAnswer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionFeedback, setShowSubmissionFeedback] = useState(false);
  const feedbackTimeoutRef = useRef(null);
  const isLocked = !availability?.availableNow && !answerRecord;
  const isReadOnly = Boolean(answerRecord);
  const hasQuiz = Boolean(quiz);

  useEffect(() => {
    setSelectedAnswer(answerRecord?.selectedAnswer || '');
  }, [answerRecord?.selectedAnswer, quiz?.id]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const triggerSubmissionFeedback = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setShowSubmissionFeedback(true);
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowSubmissionFeedback(false);
      feedbackTimeoutRef.current = null;
    }, 900);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasQuiz || !selectedAnswer || isReadOnly || isLocked || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitAnswer?.(quiz, selectedAnswer);
      triggerSubmissionFeedback();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`dashboard-root theme-${theme} student-root`}>
      <Navbar
        theme={theme}
        activePage="dailyQuiz"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
        brandTitle={profile?.school || 'Ученички простор'}
        brandSubtitle={[profile?.fullName, profile?.className].filter(Boolean).join(' · ')}
        avatarLabel={profile?.initials || 'УЧ'}
      />

      <main className="dashboard-main student-main">
        <section className="dashboard-card hero-card quiz-page-hero">
          <div className="student-banner-grid">
            <div>
              <p className="hero-eyebrow">Квиз на денот</p>
              <h1 className="hero-title">Едно прашање за вечерно загревање</h1>
              <p className="student-banner-subtitle">
                Краток квиз надвор од наставата, само со еден обид за денес.
              </p>
              <p className="hero-meta">
                {availability?.helperText || 'Наскоро ќе се отвори вечерниот прозорец.'}
              </p>
            </div>
            <div className="student-banner-metrics">
              <article className="student-banner-metric">
                <p>Категорија</p>
                <strong>{hasQuiz ? formatQuizCategoryLabel(quiz?.category) : 'Нема квиз'}</strong>
              </article>
              <article className="student-banner-metric">
                <p>Награда</p>
                <strong>+{quiz?.rewardXp || 1} XP</strong>
              </article>
              <article className="student-banner-metric">
                <p>Обид денес</p>
                <strong>{answerRecord ? 'Искористен' : 'Достапен'}</strong>
              </article>
              <article className="student-banner-metric">
                <p>Статус</p>
                <strong>{availability?.statusLabel || 'Сега е затворено'}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="dashboard-grid quiz-page-grid">
          <section className="dashboard-card content-card quiz-main-card">
            {hasQuiz ? (
              <>
                <div className="quiz-card-top">
                  <span className="quiz-category-badge">{formatQuizCategoryLabel(quiz?.category)}</span>
                  <span className="quiz-attempt-badge">
                    {answerRecord ? 'Веќе одговоривте денес' : 'Еден обид'}
                  </span>
                </div>

                <h2 className="section-title">{quiz?.title || 'Квиз на денот'}</h2>
                <p className="quiz-question-text">{quiz?.body}</p>

                <form className="quiz-options-form" onSubmit={handleSubmit}>
                  <div className="quiz-options-list" role="radiogroup" aria-label="Одговори за квизот">
                    {(quiz?.answerOptions || []).map((option) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption = Boolean(answerRecord) && quiz?.correctAnswer === option;
                      const isWrongSelected =
                        Boolean(answerRecord) &&
                        answerRecord?.selectedAnswer === option &&
                        !answerRecord?.correct;

                      return (
                        <label
                          key={option}
                          className={`quiz-option-card ${isSelected ? 'is-selected' : ''} ${
                            isCorrectOption ? 'is-correct' : ''
                          } ${isWrongSelected ? 'is-incorrect' : ''} ${
                            showSubmissionFeedback && (isCorrectOption || isWrongSelected)
                              ? 'is-result-revealed'
                              : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="daily-quiz-answer"
                            value={option}
                            checked={isSelected}
                            onChange={(event) => setSelectedAnswer(event.target.value)}
                            disabled={isReadOnly || isLocked}
                            aria-label={option}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="item-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!selectedAnswer || isReadOnly || isLocked || isSubmitting}
                    >
                      {isSubmitting ? 'Се испраќа...' : 'Испрати'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => onNavigate('learningGames')}>
                      Игри за учење
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="learning-game-placeholder">
                <h3>Денес нема активен квиз.</h3>
                <p>Провери повторно подоцна. Кога backend ќе има прашање за денес, ќе се прикаже тука.</p>
                <div className="item-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => onNavigate('learningGames')}>
                    Игри за учење
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="quiz-side-column">
            <section className="dashboard-card content-card quiz-side-card">
              <h2 className="section-title">Достапност</h2>
              <p className="item-meta">{availability?.helperText}</p>
              <p className="item-meta">
                Квизот се ресетира по полноќ и тогаш доаѓа ново прашање.
              </p>
            </section>

            {isLocked ? (
              <section className="dashboard-card content-card quiz-side-card quiz-locked-card">
                <h2 className="section-title">Сега не е достапно</h2>
                <p>{`Квизот ќе биде достапен од ${availability?.availableFrom} до ${availability?.availableUntil}.`}</p>
              </section>
            ) : null}

            {answerRecord ? (
              <section
                className={`dashboard-card content-card quiz-result-card ${
                  answerRecord.correct ? 'is-correct' : 'is-incorrect'
                } ${showSubmissionFeedback ? 'is-revealed' : ''}`}
              >
                <h2 className="section-title">
                  {answerRecord.correct ? 'Точен одговор! +1 XP' : 'Неточен одговор'}
                </h2>
                <p>{answerRecord.explanation}</p>
                <p className="item-meta">Повторно достапно утре.</p>
              </section>
            ) : (
              <section className="dashboard-card content-card quiz-side-card">
                <h2 className="section-title">Награда</h2>
                <p>Точен одговор носи +1 XP кога ќе биде поврзано со backend наградите.</p>
                <p className="item-meta">Во оваа верзија резултатот е локален, само за FE прототип.</p>
              </section>
            )}
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default DailyQuizPage;
