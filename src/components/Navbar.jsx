import { useEffect, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle';

function Navbar({
  theme,
  onToggleTheme,
  activePage,
  onNavigate,
  onLogout,
  brandTitle = 'Ученички простор',
  brandSubtitle = 'Следи задачи и рокови',
  avatarLabel = 'УЧ',
}) {
  const navItems = [
    { label: 'Задачи', page: 'assignments' },
    { label: 'Дискусии', page: 'discussions' },
    { label: 'Пораки', page: 'messages' },
  ];
  const profileMenuItems = [
    { label: 'Календар', page: 'calendar' },
    { label: 'Известувања', page: 'notifications' },
    { label: 'Профил', page: 'profile' },
  ];
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const isProfileSectionActive = profileMenuItems.some((item) => item.page === activePage);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className="navbar student-navbar">
      <div className="nav-brand student-navbar-brand">
        <button
          type="button"
          className="student-nav-icon"
          aria-label="Почетна"
          onClick={() => onNavigate('dashboard')}
        >
          ⌂
        </button>
        <div className="student-brand-copy">
          <span className="brand-logo">{brandTitle}</span>
          <span className="student-brand-subtitle">{brandSubtitle}</span>
        </div>
      </div>
      <nav className="top-nav student-top-nav" aria-label="Главна навигација">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`nav-link ${activePage === item.page ? 'active' : ''}`}
            onClick={() => onNavigate(item.page)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="nav-right student-nav-right">
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        <div className="student-profile-menu" ref={profileMenuRef}>
          <button
            type="button"
            className={`student-nav-avatar ${isProfileSectionActive ? 'is-active' : ''}`}
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-label="Отвори профил мени"
          >
            {avatarLabel}
          </button>
          {isProfileMenuOpen ? (
            <div className="student-profile-dropdown" role="menu" aria-label="Профил мени">
              {profileMenuItems.map((item) => (
                <button
                  key={item.page}
                  type="button"
                  className={`student-profile-option ${activePage === item.page ? 'active' : ''}`}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigate(item.page);
                  }}
                  role="menuitem"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" className="top-action-btn" onClick={onLogout}>
          Одјава
        </button>
      </div>
    </header>
  );
}

export default Navbar;
