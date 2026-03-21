import { formatQuizCategoryLabel } from '../data/quizGames';

function QuizGamesCard({
  quizAvailability,
  gamesAvailability,
  quiz,
  games,
  answerRecord,
  onOpenQuiz,
  onOpenGames,
}) {
  const previewGames = Array.isArray(games) ? games.slice(0, 3) : [];

  return (
    <section className="dashboard-card content-card quiz-games-card">
      <div className="quiz-games-card-top">
        <div>
          <p className="quiz-games-eyebrow">Квиз и игри</p>
          <h2 className="section-title">Краток дневен предизвик за учење</h2>
          <p className="item-meta">
            {quizAvailability?.helperText || 'Квизот е достапен денес.'}
            {' '}
            {gamesAvailability?.helperText || 'Игри се достапни во текот на целиот ден.'}
          </p>
        </div>
        <span
          className={`quiz-games-status-pill ${
            gamesAvailability?.availableNow ? 'is-open' : 'is-closed'
          }`}
        >
          {gamesAvailability?.statusLabel || 'Игри цел ден'}
        </span>
      </div>

      <div className="quiz-games-preview-grid">
        <article className="quiz-games-preview quiz-of-day-preview">
          <div className="quiz-preview-head">
            <div>
              <p className="quiz-preview-label">Квиз на денот</p>
              <h3>{quiz ? formatQuizCategoryLabel(quiz?.category) : 'Нема квиз денес'}</h3>
            </div>
            <span className="quiz-preview-reward">+1 XP</span>
          </div>
          <p className="quiz-preview-body">
            {quiz?.body || 'Нема активен квиз за денес. Провери повторно подоцна.'}
          </p>
          <p className="item-meta">
            {!quiz
              ? 'Кога backend ќе постави прашање за денес, ќе се појави тука.'
              : answerRecord
              ? 'Веќе одговоривте денес. Повторно достапно утре.'
              : 'Едно прашање, еден обид, кратко објаснување по одговорот.'}
          </p>
          <div className="item-actions quiz-games-actions">
            <button type="button" className="btn btn-primary" onClick={onOpenQuiz}>
              Отвори квиз
            </button>
            <button type="button" className="btn btn-secondary" onClick={onOpenGames}>
              Види игри
            </button>
          </div>
        </article>

        <article className="quiz-games-preview learning-games-preview">
          <div className="quiz-preview-head">
            <div>
              <p className="quiz-preview-label">Игри за учење</p>
              <h3>Мали вежби за фокус</h3>
            </div>
          </div>
          <div className="quiz-games-chip-row">
            {previewGames.map((game) => (
              <div key={game.gameKey} className={`quiz-game-chip tone-${game.accent || 'neutral'}`}>
                <span>{game.icon}</span>
                <div>
                  <strong>{game.title}</strong>
                  <small>{game.statusLabel}</small>
                </div>
              </div>
            ))}
          </div>
          <p className="item-meta">
            Почни со една кратка игра кога сакаш и загреј се за учење.
          </p>
        </article>
      </div>
    </section>
  );
}

export default QuizGamesCard;
