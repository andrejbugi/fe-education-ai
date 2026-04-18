export const DEFAULT_ACCESSIBILITY_PREFERENCES = {
  fontScale: 'md',
  contrastMode: 'default',
  readingFont: 'default',
  reduceMotion: false,
};

export const FONT_SCALE_OPTIONS = [
  { value: 'sm', label: 'Мал' },
  { value: 'md', label: 'Среден' },
  { value: 'lg', label: 'Голем' },
  { value: 'xl', label: 'Многу голем' },
];

export const READING_FONT_OPTIONS = [
  { value: 'default', label: 'Стандарден' },
  { value: 'dyslexic', label: 'Полесен за читање' },
];

export const CONTRAST_MODE_OPTIONS = [
  { value: 'default', label: 'Стандарден' },
  { value: 'high', label: 'Висок контраст' },
];

export const THEME_COLOR_OPTIONS = [
  {
    value: 'ocean',
    label: 'Океанска',
    preview: 'linear-gradient(135deg, #2f83d8 0%, #62b4ff 100%)',
  },
  {
    value: 'forest',
    label: 'Шумска',
    preview: 'linear-gradient(135deg, #19795c 0%, #5dbf95 100%)',
  },
  {
    value: 'amber',
    label: 'Килибар',
    preview: 'linear-gradient(135deg, #b86a12 0%, #f0b34f 100%)',
  },
  {
    value: 'coral',
    label: 'Корална',
    preview: 'linear-gradient(135deg, #c95757 0%, #f28c75 100%)',
  },
];

export const DEFAULT_THEME_COLOR = 'ocean';

export function normalizeAccessibilityPreferences(payload) {
  const source = payload?.accessibility || payload || {};
  const fontScale = source.font_scale ?? source.fontScale;
  const contrastMode = source.contrast_mode ?? source.contrastMode;
  const readingFont = source.reading_font ?? source.readingFont;

  return {
    fontScale: FONT_SCALE_OPTIONS.some((option) => option.value === fontScale)
      ? fontScale
      : DEFAULT_ACCESSIBILITY_PREFERENCES.fontScale,
    contrastMode: CONTRAST_MODE_OPTIONS.some((option) => option.value === contrastMode)
      ? contrastMode
      : DEFAULT_ACCESSIBILITY_PREFERENCES.contrastMode,
    readingFont: READING_FONT_OPTIONS.some((option) => option.value === readingFont)
      ? readingFont
      : DEFAULT_ACCESSIBILITY_PREFERENCES.readingFont,
    reduceMotion: Boolean(source.reduce_motion ?? source.reduceMotion),
  };
}

export function buildAccessibilityPayload(preferences) {
  return {
    accessibility: {
      font_scale: preferences.fontScale,
      contrast_mode: preferences.contrastMode,
      reading_font: preferences.readingFont,
      reduce_motion: Boolean(preferences.reduceMotion),
    },
  };
}

export function areAccessibilityPreferencesEqual(left, right) {
  return (
    left?.fontScale === right?.fontScale &&
    left?.contrastMode === right?.contrastMode &&
    left?.readingFont === right?.readingFont &&
    Boolean(left?.reduceMotion) === Boolean(right?.reduceMotion)
  );
}

export function getThemeColorOption(value) {
  return (
    THEME_COLOR_OPTIONS.find((option) => option.value === value) ||
    THEME_COLOR_OPTIONS[0]
  );
}
