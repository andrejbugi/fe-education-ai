import ThemeToggle from './ThemeToggle';

function Navbar({ theme, onToggleTheme, activePage, onNavigate }) {
  const navItems = [
    { label: 'Почетна', page: 'dashboard' },
    { label: 'Домашни', page: 'dashboard' },
    { label: 'Задачи', page: 'dashboard' },
    { label: 'Календар', page: 'calendar' },
    { label: 'Известувања', page: 'dashboard' },
    { label: 'Профил', page: 'dashboard' },
  ];

  return (
    <header className="navbar">
      <div className="nav-brand">
        <span className="brand-logo">Лого</span>
      </div>
      <nav className="top-nav" aria-label="Главна навигација">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`nav-link ${
              (activePage === 'calendar' && item.page === 'calendar') ||
              (activePage !== 'calendar' && item.label === 'Почетна')
                ? 'active'
                : ''
            }`}
            onClick={() => onNavigate(item.page)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="nav-right">
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        <span className="profile-pill">Профил</span>
      </div>
    </header>
  );
}

export default Navbar;
