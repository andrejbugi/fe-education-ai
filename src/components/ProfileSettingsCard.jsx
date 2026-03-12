import { useState } from 'react';

function ProfileSettingsCard({ theme, onToggleTheme }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showGoals, setShowGoals] = useState(true);

  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Поставки</h2>
      <div className="profile-settings-list">
        <div className="profile-setting-item">
          <span>Тема</span>
          <button type="button" className="inline-action" onClick={onToggleTheme}>
            {theme === 'dark' ? 'Темна' : 'Светла'}
          </button>
        </div>
        <div className="profile-setting-item">
          <span>Јазик</span>
          <span className="setting-value">Македонски (наскоро)</span>
        </div>
        <label className="profile-setting-item setting-toggle">
          <span>Известувања</span>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(event) => setNotificationsEnabled(event.target.checked)}
          />
        </label>
        <label className="profile-setting-item setting-toggle">
          <span>Прикажи напредок и цели</span>
          <input
            type="checkbox"
            checked={showGoals}
            onChange={(event) => setShowGoals(event.target.checked)}
          />
        </label>
      </div>
    </section>
  );
}

export default ProfileSettingsCard;
