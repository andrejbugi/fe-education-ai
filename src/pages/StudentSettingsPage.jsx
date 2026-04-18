import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import SettingsPanel from '../components/settings/SettingsPanel';

function StudentSettingsPage({
  theme,
  onToggleTheme,
  onThemeModeChange,
  onNavigate,
  onLogout,
  profile,
  accessibility,
  onSaveAccessibility,
  preferencesLoading,
  preferencesSaving,
  themeColor,
  onThemeColorChange,
}) {
  return (
    <div className={`dashboard-root theme-${theme} student-root`}>
      <Navbar
        theme={theme}
        activePage="settings"
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onLogout={onLogout}
        brandTitle={profile?.school || 'Ученички простор'}
        brandSubtitle={[profile?.fullName, profile?.className].filter(Boolean).join(' · ')}
        avatarLabel={profile?.initials || 'УЧ'}
      />

      <main className="dashboard-main student-main">
        <SettingsPanel
          eyebrow="Поставки"
          title="Твој простор за читање и изглед"
          description="Промени го начинот на прикажување за да ти биде полесно за читање, фокус и секојдневна работа."
          theme={theme}
          onThemeModeChange={onThemeModeChange}
          themeColor={themeColor}
          onThemeColorChange={onThemeColorChange}
          accessibility={accessibility}
          onSaveAccessibility={onSaveAccessibility}
          preferencesLoading={preferencesLoading}
          preferencesSaving={preferencesSaving}
        />
      </main>

      <Footer />
    </div>
  );
}

export default StudentSettingsPage;
