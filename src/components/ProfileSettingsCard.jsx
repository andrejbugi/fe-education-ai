function ProfileSettingsCard({ theme, accessibility, onOpenSettings }) {
  const fontSizeLabel =
    {
      sm: 'Мал',
      md: 'Среден',
      lg: 'Голем',
      xl: 'Многу голем',
    }[accessibility?.fontScale] || 'Среден';
  const contrastLabel = accessibility?.contrastMode === 'high' ? 'Висок' : 'Стандарден';
  const fontLabel = accessibility?.readingFont === 'dyslexic' ? 'Полесен за читање' : 'Стандарден';

  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Поставки</h2>
      <div className="profile-settings-list">
        <div className="profile-setting-item">
          <span>Тема</span>
          <span className="setting-value">
            {theme === 'dark' ? 'Темна' : 'Светла'}
          </span>
        </div>
        <div className="profile-setting-item">
          <span>Големина на текст</span>
          <span className="setting-value">{fontSizeLabel}</span>
        </div>
        <div className="profile-setting-item">
          <span>Контраст</span>
          <span className="setting-value">{contrastLabel}</span>
        </div>
        <div className="profile-setting-item">
          <span>Фонт</span>
          <span className="setting-value">{fontLabel}</span>
        </div>
      </div>

      <div className="item-actions">
        <button type="button" className="btn btn-secondary" onClick={() => onOpenSettings?.()}>
          Отвори поставки
        </button>
      </div>
    </section>
  );
}

export default ProfileSettingsCard;
