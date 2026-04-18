import { useEffect, useState } from 'react';
import {
  CONTRAST_MODE_OPTIONS,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  FONT_SCALE_OPTIONS,
  READING_FONT_OPTIONS,
  THEME_COLOR_OPTIONS,
  areAccessibilityPreferencesEqual,
} from '../../utils/userPreferences';

function SettingsPanel({
  eyebrow,
  title,
  description,
  theme,
  onThemeModeChange,
  themeColor,
  onThemeColorChange,
  accessibility = DEFAULT_ACCESSIBILITY_PREFERENCES,
  onSaveAccessibility,
  preferencesLoading = false,
  preferencesSaving = false,
  currentEmail = '',
  onRequestPasswordReset,
  passwordResetLoading = false,
}) {
  const [draftAccessibility, setDraftAccessibility] = useState(accessibility);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setDraftAccessibility(accessibility);
  }, [accessibility]);

  const hasUnsavedAccessibilityChanges = !areAccessibilityPreferencesEqual(
    draftAccessibility,
    accessibility
  );

  const updateDraftField = (field, value) => {
    setSaveMessage('');
    setSaveError('');
    setDraftAccessibility((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaveMessage('');
    setSaveError('');

    try {
      await onSaveAccessibility?.(draftAccessibility);
      setSaveMessage('Поставките за пристапност се зачувани.');
    } catch (error) {
      setSaveError(error.message || 'Не успеа зачувувањето на поставките.');
    }
  };

  const handleReset = () => {
    setSaveMessage('');
    setSaveError('');
    setDraftAccessibility(DEFAULT_ACCESSIBILITY_PREFERENCES);
  };

  return (
    <div className="settings-page-shell">
      <section className="dashboard-card content-card settings-hero-card">
        <p className="settings-eyebrow">{eyebrow}</p>
        <h1 className="section-title settings-page-title">{title}</h1>
        <p className="settings-page-description">{description}</p>
      </section>

      <section className="dashboard-grid settings-grid">
        <section className="dashboard-card content-card settings-section-card">
          <div className="settings-section-head">
            <div>
              <p className="settings-section-label">Пристапност</p>
              <h2 className="section-title">Читање и приказ</h2>
            </div>
            <span className="settings-section-hint">Се зачувува за вашата сметка</span>
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>Големина на текст</span>
              <select
                value={draftAccessibility.fontScale}
                onChange={(event) => updateDraftField('fontScale', event.target.value)}
                disabled={preferencesLoading || preferencesSaving}
              >
                {FONT_SCALE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="settings-field">
              <span>Фонт за читање</span>
              <select
                value={draftAccessibility.readingFont}
                onChange={(event) => updateDraftField('readingFont', event.target.value)}
                disabled={preferencesLoading || preferencesSaving}
              >
                {READING_FONT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="settings-choice-group">
            <span className="settings-choice-label">Контраст</span>
            <div className="settings-chip-row">
              {CONTRAST_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`settings-chip-button ${
                    draftAccessibility.contrastMode === option.value ? 'is-active' : ''
                  }`}
                  onClick={() => updateDraftField('contrastMode', option.value)}
                  disabled={preferencesLoading || preferencesSaving}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="profile-setting-item setting-toggle settings-toggle">
            <span>Намали анимации</span>
            <input
              type="checkbox"
              checked={draftAccessibility.reduceMotion}
              onChange={(event) => updateDraftField('reduceMotion', event.target.checked)}
              disabled={preferencesLoading || preferencesSaving}
            />
          </label>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleSave()}
              disabled={!hasUnsavedAccessibilityChanges || preferencesLoading || preferencesSaving}
            >
              {preferencesSaving ? 'Се зачувува...' : 'Зачувај пристапност'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={preferencesSaving}
            >
              Врати стандарден приказ
            </button>
          </div>

          {saveMessage ? <p className="settings-success">{saveMessage}</p> : null}
          {saveError ? <p className="auth-error">{saveError}</p> : null}
        </section>

        <section className="dashboard-card content-card settings-section-card">
          <div className="settings-section-head">
            <div>
              <p className="settings-section-label">Изглед</p>
              <h2 className="section-title">Тема и боја</h2>
            </div>
            <span className="settings-section-hint">Се зачувува на овој уред</span>
          </div>

          <div className="settings-choice-group">
            <span className="settings-choice-label">Режим</span>
            <div className="settings-chip-row">
              <button
                type="button"
                className={`settings-chip-button ${theme === 'light' ? 'is-active' : ''}`}
                onClick={() => onThemeModeChange?.('light')}
              >
                Светла тема
              </button>
              <button
                type="button"
                className={`settings-chip-button ${theme === 'dark' ? 'is-active' : ''}`}
                onClick={() => onThemeModeChange?.('dark')}
              >
                Темна тема
              </button>
            </div>
          </div>

          <div className="settings-choice-group">
            <span className="settings-choice-label">Акцентна боја</span>
            <div className="settings-color-grid">
              {THEME_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`settings-color-card ${
                    themeColor === option.value ? 'is-active' : ''
                  }`}
                  onClick={() => onThemeColorChange?.(option.value)}
                >
                  <span
                    className="settings-color-preview"
                    style={{ background: option.preview }}
                    aria-hidden="true"
                  />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="dashboard-card content-card settings-section-card">
        <div className="settings-section-head">
          <div>
            <p className="settings-section-label">Безбедност</p>
            <h2 className="section-title">Ресетирање лозинка</h2>
          </div>
          <span className="settings-section-hint">Активно</span>
        </div>

        <div className="settings-password-placeholder">
          <div>
            <p className="item-meta">
              Безбедносниот flow користи reset линк по е-пошта, според backend договорот.
              Откако ќе поставите нова лозинка, постоечките сесии ќе бидат поништени.
            </p>
            <p className="item-meta">
              Адреса: <strong>{currentEmail || 'Нема е-пошта'}</strong>
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!currentEmail || passwordResetLoading}
            onClick={() => onRequestPasswordReset?.(currentEmail)}
          >
            {passwordResetLoading ? 'Се испраќа...' : 'Испрати reset линк'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default SettingsPanel;
