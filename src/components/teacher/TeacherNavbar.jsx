import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '../ThemeToggle';

function getInitials(fullName) {
  return String(fullName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function TeacherNavbar({
  theme,
  activePage,
  onToggleTheme,
  onNavigate,
  onLogout,
  school,
  teacherName,
}) {
  const navItems = [
    { label: 'Класови', page: 'classes' },
    { label: 'Ученици', page: 'students' },
    { label: 'Задачи', page: 'assignments' },
    { label: 'Оценки', page: 'grades' },
    { label: 'Аналитика', page: 'reports' },
    { label: 'Објави', page: 'announcements' },
  ];
  const profileMenuItems = [
    { label: 'Календар', page: 'calendar' },
    { label: 'Известувања', page: 'notifications' },
    { label: 'Пораки', page: 'messages' },
    { label: 'Дискусии', page: 'discussions' },
    { label: 'Профил', page: 'profile' },
    { label: 'Поставки', page: 'settings' },
  ];
  const brandTitle = school || 'Наставнички простор';
  const brandSubtitle = teacherName
    ? `${teacherName} · наставник`
    : 'Едноставен преглед на паралелки и задачи';
  const teacherInitials = getInitials(teacherName) || 'NP';
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
    <header className="navbar teacher-navbar">
      <div className="nav-brand teacher-navbar-brand">
        <button
          type="button"
          className="teacher-nav-icon"
          aria-label="Почетна"
          onClick={() => onNavigate('dashboard')}
        >
          ⌂
        </button>
        <div className="teacher-brand-copy">
          <span className="brand-logo">{brandTitle}</span>
          <span className="teacher-brand-subtitle">{brandSubtitle}</span>
        </div>
      </div>
      <nav className="top-nav teacher-top-nav" aria-label="Наставничка навигација">
        {navItems.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`nav-link ${activePage === item.page ? 'active' : ''}`}
            onClick={() => {
              onNavigate(item.page);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="nav-right teacher-nav-right">
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        <div className="teacher-profile-menu" ref={profileMenuRef}>
          <button
            type="button"
            className={`teacher-nav-avatar ${isProfileSectionActive ? 'is-active' : ''}`}
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-label="Отвори профил мени"
          >
            {teacherInitials}
          </button>
          {isProfileMenuOpen ? (
            <div className="teacher-profile-dropdown" role="menu" aria-label="Профил мени">
              {profileMenuItems.map((item) => (
                <button
                  key={item.page}
                  type="button"
                  className={`teacher-profile-option ${activePage === item.page ? 'active' : ''}`}
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

export default TeacherNavbar;
