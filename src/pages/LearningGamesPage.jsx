import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BasicMathSprintGame from '../components/BasicMathSprintGame';
import GeometryShapesGame from '../components/GeometryShapesGame';
import { formatGameCategoryLabel } from '../data/quizGames';

const GAME_COMPONENTS = {
  basic_math_speed: BasicMathSprintGame,
  geometry_shapes: GeometryShapesGame,
};

function LearningGamesPage({
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  profile,
  availability,
  games,
}) {
  const firstGameKey = games?.[0]?.gameKey || '';
  const [selectedGameKey, setSelectedGameKey] = useState(firstGameKey);

  useEffect(() => {
    setSelectedGameKey((current) => current || firstGameKey);
  }, [firstGameKey]);

  const selectedGame = useMemo(
    () => games.find((game) => game.gameKey === selectedGameKey) || games[0] || null,
    [games, selectedGameKey]
  );
  const ActiveGameComponent = selectedGame ? GAME_COMPONENTS[selectedGame.gameKey] : null;
  const isPlayableGameSelected = Boolean(
    ActiveGameComponent && selectedGame?.isImplemented && !selectedGame?.comingSoon
  );

  return (
    <div className={`dashboard-root theme-${theme} student-root`}>
      <Navbar
        theme={theme}
        activePage="learningGames"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
        brandTitle={profile?.school || 'Ученички простор'}
        brandSubtitle={[profile?.fullName, profile?.className].filter(Boolean).join(' · ')}
        avatarLabel={profile?.initials || 'УЧ'}
      />

      <main className="dashboard-main student-main">
        <section className="dashboard-card hero-card learning-games-hero">
          <div className="student-banner-grid">
            <div>
              <p className="hero-eyebrow">Игри за учење</p>
              <h1 className="hero-title">Кратки игри за фокус и загревање</h1>
              <p className="student-banner-subtitle">
                Лесни активности што не се дел од домашните задачи и оценувањето.
              </p>
              <p className="hero-meta">{availability?.helperText}</p>
            </div>
            <div className="student-banner-metrics">
              <article className="student-banner-metric">
                <p>Игри</p>
                <strong>{games.length}</strong>
              </article>
              <article className="student-banner-metric">
                <p>Статус</p>
                <strong>{availability?.statusLabel || 'Сега е затворено'}</strong>
              </article>
              <article className="student-banner-metric">
                <p>Работи сега</p>
                <strong>{games.filter((game) => game.isImplemented && !game.comingSoon).length}</strong>
              </article>
              <article className="student-banner-metric">
                <p>Прозорец</p>
                <strong>{`${availability?.availableFrom} - ${availability?.availableUntil}`}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="dashboard-card content-card learning-games-banner">
          <div>
            <p className="quiz-games-eyebrow">Тест режим</p>
            <h2 className="section-title">Игри за учење се посебни од задачите</h2>
            <p className="item-meta">
              Засега игрите се отворени цел ден за полесно тестирање. Во првата верзија нема
              историја и нема оценки.
            </p>
          </div>
          <div className="item-actions">
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('dailyQuiz')}>
              Квиз на денот
            </button>
          </div>
        </section>

        <section className="learning-games-grid">
          {games.map((game) => (
            <article
              key={game.gameKey}
              className={`dashboard-card content-card learning-game-card ${
                selectedGameKey === game.gameKey ? 'is-active' : ''
              } tone-${game.accent || 'neutral'}`}
            >
              <div className="learning-game-card-top">
                <span className="learning-game-icon">{game.icon}</span>
                <span className="learning-game-status">{game.statusLabel}</span>
              </div>
              <h2 className="section-title">{game.title}</h2>
              <p>{game.description}</p>
              <div className="learning-game-meta-row">
                <span className="learning-game-meta-pill">{formatGameCategoryLabel(game.category)}</span>
                <span className="learning-game-meta-pill">Тежина: {game.difficulty}</span>
                {game.routeSlug ? (
                  <span className="learning-game-meta-pill">/{game.routeSlug}</span>
                ) : null}
              </div>
              <div className="item-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedGameKey(game.gameKey)}
                  disabled={game.comingSoon || (!availability?.availableNow && game.isImplemented)}
                >
                  {game.comingSoon ? 'Наскоро' : game.isImplemented ? 'Отвори' : 'Наскоро'}
                </button>
              </div>
            </article>
          ))}
        </section>

        {isPlayableGameSelected ? (
          <ActiveGameComponent disabled={!availability?.availableNow} availability={availability} />
        ) : (
          <section className="dashboard-card content-card learning-game-placeholder">
            <h2 className="section-title">{selectedGame?.title || 'Наскоро'}</h2>
            <p>
              {selectedGame?.comingSoon
                ? 'Оваа игра е означена како „Наскоро“ во backend конфигурацијата и засега се прикажува како заклучена картичка.'
                : selectedGame?.isImplemented
                  ? 'Оваа игра ќе се отвори тука кога ќе биде завршена.'
                  : 'Оваа игра е подготвена како картичка, а реалната интеракција доаѓа во следната фаза.'}
            </p>
            <p className="item-meta">
              {selectedGame?.routeSlug
                ? `Планиран slug: /learning-games/${selectedGame.routeSlug}`
                : 'Прво ја испорачуваме структурата, а потоа ќе додаваме уште мини-игри една по една.'}
            </p>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default LearningGamesPage;
