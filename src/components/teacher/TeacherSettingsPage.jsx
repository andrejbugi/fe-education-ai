import SettingsPanel from '../settings/SettingsPanel';

function TeacherSettingsPage({
  theme,
  onThemeModeChange,
  themeColor,
  onThemeColorChange,
  accessibility,
  onSaveAccessibility,
  preferencesLoading,
  preferencesSaving,
}) {
  return (
    <div className="teacher-page">
      <SettingsPanel
        eyebrow="Поставки"
        title="Наставнички приказ и пристапност"
        description="Прилагоди фонт, големина на текст, контраст и боја на интерфејсот за поудобна работа низ таблата, оценките и комуникацијата."
        theme={theme}
        onThemeModeChange={onThemeModeChange}
        themeColor={themeColor}
        onThemeColorChange={onThemeColorChange}
        accessibility={accessibility}
        onSaveAccessibility={onSaveAccessibility}
        preferencesLoading={preferencesLoading}
        preferencesSaving={preferencesSaving}
      />
    </div>
  );
}

export default TeacherSettingsPage;
