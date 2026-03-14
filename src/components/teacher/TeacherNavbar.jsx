import ThemeToggle from '../ThemeToggle';

function TeacherNavbar({ theme, activePage, onToggleTheme, onNavigate, onLogout }) {
  const navItems = [
    { label: 'Почетна', page: 'dashboard' },
    { label: 'Класови', page: 'classes' },
    { label: 'Ученици', page: 'students' },
    { label: 'Задачи', page: 'assignments' },
    { label: 'Објави', page: 'announcements' },
    { label: 'Присуство', page: 'attendance' },
    { label: 'Извештаи', page: 'reports' },
    { label: 'Календар', page: 'calendar' },
    { label: 'Известувања', page: 'notifications' },
    { label: 'Профил', page: 'profile' },
  ];

  return (
    <header className="navbar teacher-navbar">
      <div className="nav-brand">
        <span className="brand-logo">Teacher Panel</span>
      </div>
      <nav className="top-nav" aria-label="Наставничка навигација">
        {navItems.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`nav-link ${activePage === item.page ? 'active' : ''}`}
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

export default TeacherNavbar;
