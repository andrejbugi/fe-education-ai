import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPanel from './SettingsPanel';

const baseAccessibility = {
  fontScale: 'md',
  contrastMode: 'default',
  readingFont: 'default',
  reduceMotion: false,
};

test('settings panel saves updated accessibility preferences', async () => {
  const saveSpy = jest.fn().mockResolvedValue(baseAccessibility);

  render(
    <SettingsPanel
      eyebrow="Поставки"
      title="Тест"
      description="Опис"
      theme="light"
      onThemeModeChange={() => {}}
      themeColor="ocean"
      onThemeColorChange={() => {}}
      accessibility={baseAccessibility}
      onSaveAccessibility={saveSpy}
    />
  );

  await userEvent.selectOptions(screen.getByLabelText(/Големина на текст/i), 'lg');
  await userEvent.click(screen.getByLabelText(/Намали анимации/i));
  await userEvent.click(screen.getByRole('button', { name: /Зачувај пристапност/i }));
  await screen.findByText(/Поставките за пристапност се зачувани\./i);

  expect(saveSpy).toHaveBeenCalledWith({
    fontScale: 'lg',
    contrastMode: 'default',
    readingFont: 'default',
    reduceMotion: true,
  });
});

test('settings panel updates theme mode and theme color immediately', async () => {
  const themeModeSpy = jest.fn();
  const themeColorSpy = jest.fn();

  render(
    <SettingsPanel
      eyebrow="Поставки"
      title="Тест"
      description="Опис"
      theme="light"
      onThemeModeChange={themeModeSpy}
      themeColor="ocean"
      onThemeColorChange={themeColorSpy}
      accessibility={baseAccessibility}
      onSaveAccessibility={jest.fn()}
    />
  );

  await userEvent.click(screen.getByRole('button', { name: /Темна тема/i }));
  await userEvent.click(screen.getByRole('button', { name: /Шумска/i }));

  expect(themeModeSpy).toHaveBeenCalledWith('dark');
  expect(themeColorSpy).toHaveBeenCalledWith('forest');
});
