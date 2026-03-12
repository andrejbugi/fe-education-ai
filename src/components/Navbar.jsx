import ThemeToggle from './ThemeToggle';

function Navbar({ theme, onToggleTheme, activePage, onNavigate, onLogout }) {
  const navItems = [
    { label: 'Почетна', page: 'dashboard' },
    { label: 'Домашни', page: 'dashboard' },
    { label: 'Задачи', page: 'dashboard' },
    { label: 'Календар', page: 'calendar' },
    { label: 'Известувања', page: 'notifications' },
    { label: 'Профил', page: 'profile' },
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
              (activePage === item.page && item.page !== 'dashboard') ||
              (activePage === 'dashboard' && item.label === 'Почетна')
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
        <button type="button" className="top-action-btn" onClick={onLogout}>
          Одјава
        </button>
      </div>
    </header>
  );
}

export default Navbar;
