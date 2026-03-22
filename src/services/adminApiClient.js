const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';
export const ADMIN_UNAUTHORIZED_EVENT = 'admin-app:unauthorized';

export const ADMIN_STORAGE_KEYS = {
  theme: 'admin-app-theme',
  palette: 'admin-app-palette',
  schoolName: 'admin-app-school',
  schoolId: 'admin-app-school-id',
  token: 'admin-app-token',
  user: 'admin-app-user',
  loggedIn: 'admin-app-logged-in',
};

const API_ERROR_TRANSLATIONS = {
  'School context is invalid': 'Избравте погрешно училиште',
  'Invalid email or password': 'Е-поштата или лозинката не се точни',
  Unauthorized: 'Немате пристап. Најавете се повторно',
  Forbidden: 'Немате дозвола за оваа акција',
  'Missing or invalid token': 'Сесијата е истечена. Најавете се повторно',
};

const GENERIC_API_ERROR_MESSAGE = 'Нешто тргна наопаку. Обиди се повторно.';

function getStorageItem(key) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
}

function setStorageItem(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStorageItem(key) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

function getStatusFallbackMessage(status) {
  if (status === 401) {
    return 'Немате пристап. Најавете се повторно';
  }
  if (status === 403) {
    return 'Немате дозвола за оваа акција';
  }
  if (status === 404) {
    return 'Бараниот ресурс не е пронајден';
  }
  if (status === 422) {
    return 'Внесените податоци не се валидни';
  }

  return GENERIC_API_ERROR_MESSAGE;
}

function translateApiMessage(message, status) {
  const normalized = typeof message === 'string' ? message.trim() : '';
  if (!normalized) {
    return getStatusFallbackMessage(status);
  }

  if (API_ERROR_TRANSLATIONS[normalized]) {
    return API_ERROR_TRANSLATIONS[normalized];
  }

  if (normalized.toLowerCase().includes('school context is invalid')) {
    return API_ERROR_TRANSLATIONS['School context is invalid'];
  }

  if (normalized.toLowerCase().startsWith('request failed with status')) {
    return getStatusFallbackMessage(status);
  }

  if (status >= 500) {
    return GENERIC_API_ERROR_MESSAGE;
  }

  return normalized;
}

async function parseError(response) {
  let errorMessage = getStatusFallbackMessage(response.status);

  try {
    const payload = await response.json();
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      errorMessage = payload.errors
        .map((item) => translateApiMessage(item, response.status))
        .join(', ');
    } else {
      const rawMessage = payload?.error || payload?.message;
      if (rawMessage) {
        errorMessage = translateApiMessage(rawMessage, response.status);
      }
    }
  } catch {
    // ignore parse error
  }

  const error = new Error(errorMessage);
  error.status = response.status;
  return error;
}

function notifyUnauthorized() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(ADMIN_UNAUTHORIZED_EVENT));
}

function buildSearchSuffix(params) {
  const search = new URLSearchParams();

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, String(value));
      }
    });
  }

  return search.toString() ? `?${search.toString()}` : '';
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const schoolId = getStoredAdminSchoolId();

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!options.skipSchoolHeader && schoolId && !headers.has('X-School-Id')) {
    headers.set('X-School-Id', String(schoolId));
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    credentials: 'include',
    headers,
    body:
      options.body && headers.get('Content-Type')?.includes('application/json')
        ? JSON.stringify(options.body)
        : options.body,
  });

  if (!response.ok) {
    const error = await parseError(response);
    if (response.status === 401 && !options.skipUnauthorizedHandler) {
      clearAdminSession();
      notifyUnauthorized();
    }
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

export function getStoredAdminTheme() {
  return getStorageItem(ADMIN_STORAGE_KEYS.theme);
}

export function getStoredAdminPalette() {
  return getStorageItem(ADMIN_STORAGE_KEYS.palette);
}

export function getStoredAdminToken() {
  return getStorageItem(ADMIN_STORAGE_KEYS.token);
}

export function getStoredAdminSchoolId() {
  return getStorageItem(ADMIN_STORAGE_KEYS.schoolId);
}

export function getStoredAdminSchoolName() {
  return getStorageItem(ADMIN_STORAGE_KEYS.schoolName) || '';
}

export function getStoredAdminUser() {
  try {
    const value = getStorageItem(ADMIN_STORAGE_KEYS.user);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveAdminSession({ token, user, school, clearSchool = false } = {}) {
  if (token) {
    removeStorageItem(ADMIN_STORAGE_KEYS.token);
  }
  if (user) {
    setStorageItem(ADMIN_STORAGE_KEYS.user, JSON.stringify(user));
  }
  if (clearSchool) {
    removeStorageItem(ADMIN_STORAGE_KEYS.schoolId);
    removeStorageItem(ADMIN_STORAGE_KEYS.schoolName);
  }
  if (school?.id) {
    setStorageItem(ADMIN_STORAGE_KEYS.schoolId, String(school.id));
  }
  if (school?.name) {
    setStorageItem(ADMIN_STORAGE_KEYS.schoolName, school.name);
  }

  setStorageItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
}

export function clearAdminSession() {
  removeStorageItem(ADMIN_STORAGE_KEYS.token);
  removeStorageItem(ADMIN_STORAGE_KEYS.user);
  removeStorageItem(ADMIN_STORAGE_KEYS.schoolId);
  removeStorageItem(ADMIN_STORAGE_KEYS.schoolName);
  removeStorageItem(ADMIN_STORAGE_KEYS.loggedIn);
}

export const adminApi = {
  request,
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: payload,
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    }),
  logout: () =>
    request('/auth/logout', {
      method: 'DELETE',
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    }),
  me: () =>
    request('/auth/me', {
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    }),
  meWithToken: () =>
    request('/auth/me', {
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    }),
  adminSchools: (params) =>
    request(`/admin/schools${buildSearchSuffix(params)}`, {
      skipSchoolHeader: true,
    }),
  createAdminSchool: (payload) =>
    request('/admin/schools', {
      method: 'POST',
      body: payload,
      skipSchoolHeader: true,
    }),
  adminSchoolDetails: (id) => request(`/admin/schools/${id}`),
  adminTeachers: (params) => request(`/admin/teachers${buildSearchSuffix(params)}`),
  adminTeacher: (id) => request(`/admin/teachers/${id}`),
  createAdminTeacher: (payload) =>
    request('/admin/teachers', {
      method: 'POST',
      body: payload,
    }),
  updateAdminTeacher: (id, payload) =>
    request(`/admin/teachers/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  resendAdminTeacherInvitation: (id) =>
    request(`/admin/teachers/${id}/resend_invitation`, {
      method: 'POST',
    }),
  updateAdminTeacherSubjects: (id, payload) =>
    request(`/admin/teachers/${id}/subjects`, {
      method: 'PUT',
      body: payload,
    }),
  updateAdminTeacherClassrooms: (id, payload) =>
    request(`/admin/teachers/${id}/classrooms`, {
      method: 'PUT',
      body: payload,
    }),
  adminStudents: (params) => request(`/admin/students${buildSearchSuffix(params)}`),
  adminStudent: (id) => request(`/admin/students/${id}`),
  createAdminStudent: (payload) =>
    request('/admin/students', {
      method: 'POST',
      body: payload,
    }),
  updateAdminStudent: (id, payload) =>
    request(`/admin/students/${id}`, {
      method: 'PATCH',
      body: payload,
    }),
  resendAdminStudentInvitation: (id) =>
    request(`/admin/students/${id}/resend_invitation`, {
      method: 'POST',
    }),
  updateAdminStudentClassrooms: (id, payload) =>
    request(`/admin/students/${id}/classrooms`, {
      method: 'PUT',
      body: payload,
    }),
  adminClassrooms: (params) => request(`/admin/classrooms${buildSearchSuffix(params)}`),
  adminClassroomSchedule: (id) => request(`/admin/classrooms/${id}/schedule`),
  updateAdminClassroomSchedule: (id, payload) =>
    request(`/admin/classrooms/${id}/schedule`, {
      method: 'PUT',
      body: payload,
    }),
  createAdminClassroom: (payload) =>
    request('/admin/classrooms', {
      method: 'POST',
      body: payload,
    }),
  adminSubjects: (params) => request(`/admin/subjects${buildSearchSuffix(params)}`),
  createAdminSubject: (payload) =>
    request('/admin/subjects', {
      method: 'POST',
      body: payload,
    }),
};
