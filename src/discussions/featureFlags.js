const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

export function isDiscussionFeatureEnabled() {
  const normalized = String(process.env.REACT_APP_ENABLE_DISCUSSIONS || '')
    .trim()
    .toLowerCase();

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  return true;
}

export function getDiscussionProviderMode() {
  const explicitMode = String(process.env.REACT_APP_DISCUSSIONS_PROVIDER || '')
    .trim()
    .toLowerCase();

  if (explicitMode === 'mock' || explicitMode === 'api') {
    return explicitMode;
  }

  return 'api';
}

export function shouldUseMockDiscussionProvider() {
  return getDiscussionProviderMode() === 'mock';
}
