const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

export const STORAGE_KEYS = {
  theme: 'student-app-theme',
  schoolName: 'student-app-school',
  schoolId: 'student-app-school-id',
  role: 'student-app-role',
  token: 'student-app-token',
  user: 'student-app-user',
  loggedIn: 'student-app-logged-in',
};

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

export function getStoredToken() {
  return getStorageItem(STORAGE_KEYS.token);
}

export function getStoredSchoolId() {
  return getStorageItem(STORAGE_KEYS.schoolId);
}

export function getStoredRole() {
  return getStorageItem(STORAGE_KEYS.role) || 'student';
}

export function getStoredUser() {
  try {
    const value = getStorageItem(STORAGE_KEYS.user);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession({ token, user, school }) {
  if (token) {
    setStorageItem(STORAGE_KEYS.token, token);
  }
  if (user) {
    setStorageItem(STORAGE_KEYS.user, JSON.stringify(user));
    const roles = user.roles || [];
    if (roles.includes('teacher') || roles.includes('admin')) {
      setStorageItem(STORAGE_KEYS.role, 'teacher');
    } else {
      setStorageItem(STORAGE_KEYS.role, 'student');
    }
  }
  if (school?.id) {
    setStorageItem(STORAGE_KEYS.schoolId, String(school.id));
  }
  if (school?.name) {
    setStorageItem(STORAGE_KEYS.schoolName, school.name);
  }
  setStorageItem(STORAGE_KEYS.loggedIn, 'true');
}

export function clearAuthSession() {
  removeStorageItem(STORAGE_KEYS.token);
  removeStorageItem(STORAGE_KEYS.user);
  removeStorageItem(STORAGE_KEYS.schoolId);
  removeStorageItem(STORAGE_KEYS.schoolName);
  removeStorageItem(STORAGE_KEYS.role);
  removeStorageItem(STORAGE_KEYS.loggedIn);
}

const API_ERROR_TRANSLATIONS = {
  'School context is invalid': 'Избравте погрешно училиште',
  'Invalid email or password': 'Е-поштата или лозинката не се точни',
  Unauthorized: 'Немате пристап. Најавете се повторно',
  Forbidden: 'Немате дозвола за оваа акција',
  'Missing or invalid token': 'Сесијата е истечена. Најавете се повторно',
};

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
  return `Барањето не успеа (код ${status})`;
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

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getStoredToken();
  const schoolId = getStoredSchoolId();

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!options.skipSchoolHeader && schoolId && !headers.has('X-School-Id')) {
    headers.set('X-School-Id', String(schoolId));
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body:
      options.body && headers.get('Content-Type')?.includes('application/json')
        ? JSON.stringify(options.body)
        : options.body,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

export const api = {
  request,
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: payload,
      skipSchoolHeader: true,
    }),
  logout: () => request('/auth/logout', { method: 'DELETE' }),
  me: () => request('/auth/me', { skipSchoolHeader: true }),
  meWithToken: (token) =>
    request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      skipSchoolHeader: true,
    }),
  schoolsForLogin: () =>
    request('/schools', {
      skipSchoolHeader: true,
    }),
  schools: () => request('/schools'),
  schoolDetails: (id) => request(`/schools/${id}`),
  schoolsWithToken: (token) =>
    request('/schools', {
      headers: { Authorization: `Bearer ${token}` },
      skipSchoolHeader: true,
    }),
  studentDashboard: () => request('/student/dashboard'),
  studentAssignments: () => request('/student/assignments'),
  studentAssignmentDetails: (id) => request(`/student/assignments/${id}`),
  teacherDashboard: () => request('/teacher/dashboard'),
  teacherClassrooms: () => request('/teacher/classrooms'),
  teacherClassroomDetails: (id) => request(`/teacher/classrooms/${id}`),
  teacherSubjects: () => request('/teacher/subjects'),
  teacherStudentDetails: (id) => request(`/teacher/students/${id}`),
  teacherHomerooms: () => request('/teacher/homerooms'),
  assignments: () => request('/assignments'),
  assignmentDetails: (id) => request(`/assignments/${id}`),
  createAssignment: (payload) =>
    request('/assignments', { method: 'POST', body: payload }),
  updateAssignment: (id, payload) =>
    request(`/assignments/${id}`, { method: 'PATCH', body: payload }),
  createAssignmentStep: (assignmentId, payload) =>
    request(`/assignments/${assignmentId}/steps`, { method: 'POST', body: payload }),
  updateAssignmentStep: (assignmentId, id, payload) =>
    request(`/assignments/${assignmentId}/steps/${id}`, { method: 'PATCH', body: payload }),
  announcements: (params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/announcements${suffix}`);
  },
  createAnnouncement: (payload) =>
    request('/announcements', { method: 'POST', body: payload }),
  announcementDetails: (id) => request(`/announcements/${id}`),
  updateAnnouncement: (id, payload) =>
    request(`/announcements/${id}`, { method: 'PATCH', body: payload }),
  publishAnnouncement: (id) =>
    request(`/announcements/${id}/publish`, { method: 'POST' }),
  archiveAnnouncement: (id) =>
    request(`/announcements/${id}/archive`, { method: 'POST' }),
  attendanceRecords: (params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/attendance_records${suffix}`);
  },
  createAttendanceRecord: (payload) =>
    request('/attendance_records', { method: 'POST', body: payload }),
  updateAttendanceRecord: (id, payload) =>
    request(`/attendance_records/${id}`, { method: 'PATCH', body: payload }),
  classroomAttendance: (id, params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/classrooms/${id}/attendance${suffix}`);
  },
  studentAttendance: (id, params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/students/${id}/attendance${suffix}`);
  },
  studentPerformance: () => request('/student/performance'),
  studentPerformanceSnapshots: (id, params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/students/${id}/performance_snapshots${suffix}`);
  },
  classroomPerformanceOverview: (id, params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/classrooms/${id}/performance_overview${suffix}`);
  },
  aiSessions: (params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/ai_sessions${suffix}`);
  },
  createAiSession: (payload) =>
    request('/ai_sessions', { method: 'POST', body: payload }),
  aiSessionDetails: (id) => request(`/ai_sessions/${id}`),
  updateAiSession: (id, payload) =>
    request(`/ai_sessions/${id}`, { method: 'PATCH', body: payload }),
  closeAiSession: (id) => request(`/ai_sessions/${id}/close`, { method: 'POST' }),
  aiMessages: (aiSessionId) => request(`/ai_sessions/${aiSessionId}/messages`),
  createAiMessage: (aiSessionId, payload) =>
    request(`/ai_sessions/${aiSessionId}/messages`, { method: 'POST', body: payload }),
  calendarEvents: () => request('/calendar/events'),
  notifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/mark_as_read`, { method: 'POST' }),
};
