function ThemeToggle({ theme, onToggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggleTheme}
      aria-label={`Префрли на ${isDark ? 'светла' : 'темна'} тема`}
    >
      <span className="theme-toggle-text">Светла/Темна</span>
      <span className={`theme-toggle-knob ${isDark ? 'is-dark' : ''}`} />
    </button>
  );
}

export default ThemeToggle;
