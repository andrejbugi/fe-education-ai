import ThemeToggle from './ThemeToggle';

function WorkspaceHeader({
  title,
  currentIndex,
  total,
  onBack,
  theme,
  onToggleTheme,
}) {
  const progress = Math.round((currentIndex / total) * 100);

  return (
    <header className="workspace-header">
      <button type="button" className="back-button" onClick={onBack}>
        Назад
      </button>
      <div className="workspace-header-main">
        <p className="workspace-label">Работен простор</p>
        <h1>{title}</h1>
        <p className="workspace-progress-text">
          Задача {currentIndex} од {total}
        </p>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
    </header>
  );
}

export default WorkspaceHeader;
