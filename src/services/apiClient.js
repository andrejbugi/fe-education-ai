const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';
const SESSION_REQUEST_CACHE = new Map();
export const AUTH_UNAUTHORIZED_EVENT = 'student-app:unauthorized';

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
    removeStorageItem(STORAGE_KEYS.token);
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
  clearSessionRequestCache();
}

function buildSessionCacheKey(path, options, schoolId) {
  const method = String(options.method || 'GET').toUpperCase();
  const scopeKey = options.skipSchoolHeader ? 'no-school' : schoolId || 'school:none';
  return options.cacheKey || `${method}:${path}:${scopeKey}`;
}

function clearSessionRequestCache(matcher) {
  if (!matcher) {
    SESSION_REQUEST_CACHE.clear();
    return;
  }

  SESSION_REQUEST_CACHE.forEach((value, key) => {
    if (typeof matcher === 'function' ? matcher(key, value) : key.includes(String(matcher))) {
      SESSION_REQUEST_CACHE.delete(key);
    }
  });
}

const API_ERROR_TRANSLATIONS = {
  'School context is invalid': 'Избравте погрешно училиште',
  'Invalid email or password': 'Е-поштата или лозинката не се точни',
  Unauthorized: 'Немате пристап. Најавете се повторно',
  Forbidden: 'Немате дозвола за оваа акција',
  'Missing or invalid token': 'Сесијата е истечена. Најавете се повторно',
};
const GENERIC_API_ERROR_MESSAGE = 'Нешто тргна наопаку. Обиди се повторно.';

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

  const lowerCasedMessage = normalized.toLowerCase();
  if (
    lowerCasedMessage.includes('internal server error') ||
    lowerCasedMessage.includes('server error') ||
    lowerCasedMessage.includes('bad gateway') ||
    lowerCasedMessage.includes('service unavailable') ||
    lowerCasedMessage.includes('gateway timeout') ||
    lowerCasedMessage.includes('timeout') ||
    lowerCasedMessage.includes('exception')
  ) {
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

  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const schoolId = getStoredSchoolId();
  const method = String(options.method || 'GET').toUpperCase();
  const cacheTtlMs = Number(options.cacheTtlMs || 0);
  const canUseSessionCache =
    cacheTtlMs > 0 && method === 'GET' && !options.body && !options.skipCache;

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!options.skipSchoolHeader && schoolId && !headers.has('X-School-Id')) {
    headers.set('X-School-Id', String(schoolId));
  }

  if (canUseSessionCache) {
    const cacheKey = buildSessionCacheKey(path, options, schoolId);
    const cachedEntry = SESSION_REQUEST_CACHE.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.createdAt < cacheTtlMs) {
      return cachedEntry.promise;
    }

    const cachedPromise = fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body:
        options.body && headers.get('Content-Type')?.includes('application/json')
          ? JSON.stringify(options.body)
          : options.body,
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await parseError(response);
          if (response.status === 401 && !options.skipUnauthorizedHandler) {
            clearAuthSession();
            notifyUnauthorized();
          }
          throw error;
        }

        if (response.status === 204) {
          return null;
        }

        return response.json().catch(() => null);
      })
      .catch((error) => {
        SESSION_REQUEST_CACHE.delete(cacheKey);
        throw error;
      });

    SESSION_REQUEST_CACHE.set(cacheKey, {
      createdAt: Date.now(),
      promise: cachedPromise,
    });

    return cachedPromise;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
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
      clearAuthSession();
      notifyUnauthorized();
    }
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

function buildAnnouncementRequestBody(payload) {
  const file = payload?.file;
  const removeFile = payload?.remove_file;

  if (!file && removeFile === undefined) {
    return payload;
  }

  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (key === 'file') {
      formData.append('file', value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

function buildDiscussionRequestBody(payload) {
  const files = Array.isArray(payload?.files) ? payload.files.filter(Boolean) : [];

  if (files.length === 0) {
    return payload;
  }

  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || key === 'files') {
      return;
    }

    formData.append(key, String(value));
  });

  files.forEach((file) => {
    formData.append('files[]', file);
  });

  return formData;
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

export const api = {
  request,
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: payload,
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    }),
  logout: () => {
    clearSessionRequestCache();
    return request('/auth/logout', {
      method: 'DELETE',
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    });
  },
  invalidateSessionCache: clearSessionRequestCache,
  me: () =>
    request('/auth/me', {
      skipSchoolHeader: true,
      cacheTtlMs: 60000,
      skipUnauthorizedHandler: true,
    }),
  meWithToken: () =>
    request('/auth/me', {
      skipSchoolHeader: true,
      cacheTtlMs: 60000,
      skipUnauthorizedHandler: true,
    }),
  schoolsForLogin: () =>
    request('/schools', {
      skipSchoolHeader: true,
    }),
  invitationDetails: (token) =>
    request(`/invitations/${encodeURIComponent(token)}`, {
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    }),
  acceptInvitation: (token, payload) =>
    request(`/invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      body: payload,
      skipSchoolHeader: true,
      skipUnauthorizedHandler: true,
    }),
  schools: () => request('/schools'),
  schoolDetails: (id) => request(`/schools/${id}`, { cacheTtlMs: 60000 }),
  schoolsWithToken: () =>
    request('/schools', {
      skipSchoolHeader: true,
    }),
  studentDashboard: () => request('/student/dashboard'),
  studentAssignments: () => request('/student/assignments'),
  studentAssignmentDetails: (id) => request(`/student/assignments/${id}`),
  teacherDashboard: () => request('/teacher/dashboard', { cacheTtlMs: 30000 }),
  teacherClassrooms: () => request('/teacher/classrooms', { cacheTtlMs: 60000 }),
  teacherClassroomDetails: (id) => request(`/teacher/classrooms/${id}`, { cacheTtlMs: 30000 }),
  teacherSubjects: () => request('/teacher/subjects', { cacheTtlMs: 60000 }),
  createTeacherSubjectTopic: (subjectId, payload) =>
    request(`/teacher/subjects/${subjectId}/topics`, { method: 'POST', body: payload }),
  teacherStudentDetails: (id) => request(`/teacher/students/${id}`, { cacheTtlMs: 30000 }),
  teacherSubmissionDetails: (id) => request(`/teacher/submissions/${id}`, { cacheTtlMs: 30000 }),
  teacherHomerooms: () => request('/teacher/homerooms', { cacheTtlMs: 60000 }),
  assignments: () => request('/assignments'),
  assignmentDetails: (id) => request(`/assignments/${id}`),
  createAssignment: (payload) =>
    request('/assignments', { method: 'POST', body: payload }),
  updateAssignment: (id, payload) =>
    request(`/assignments/${id}`, { method: 'PATCH', body: payload }),
  publishAssignment: (id) =>
    request(`/assignments/${id}/publish`, { method: 'POST' }),
  createAssignmentSubmission: (assignmentId, payload = {}) =>
    request(`/assignments/${assignmentId}/submissions`, {
      method: 'POST',
      body: payload,
    }),
  updateSubmission: (id, payload) =>
    request(`/submissions/${id}`, { method: 'PATCH', body: payload }),
  submitSubmission: (id) =>
    request(`/submissions/${id}/submit`, { method: 'POST' }),
  createSubmissionGrade: (submissionId, payload) =>
    request(`/submissions/${submissionId}/grades`, { method: 'POST', body: payload }),
  createAssignmentResource: (assignmentId, payload) => {
    const formData = new FormData();
    if (payload?.title) {
      formData.append('title', payload.title);
    }
    if (payload?.resource_type) {
      formData.append('resource_type', payload.resource_type);
    }
    if (payload?.description) {
      formData.append('description', payload.description);
    }
    if (payload?.position !== undefined && payload?.position !== null) {
      formData.append('position', String(payload.position));
    }
    if (payload?.is_required !== undefined) {
      formData.append('is_required', String(payload.is_required));
    }
    if (payload?.file) {
      formData.append('file', payload.file);
    }
    return request(`/assignments/${assignmentId}/resources`, {
      method: 'POST',
      body: formData,
    });
  },
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
    return request(`/announcements${suffix}`, { cacheTtlMs: 30000 });
  },
  createAnnouncement: (payload) =>
    request('/announcements', { method: 'POST', body: buildAnnouncementRequestBody(payload) }),
  announcementDetails: (id) => request(`/announcements/${id}`, { cacheTtlMs: 30000 }),
  updateAnnouncement: (id, payload) =>
    request(`/announcements/${id}`, {
      method: 'PATCH',
      body: buildAnnouncementRequestBody(payload),
    }),
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
  studentDailyQuiz: () => request('/student/daily_quiz', { cacheTtlMs: 30000 }),
  answerStudentDailyQuiz: (payload) =>
    request('/student/daily_quiz/answer', {
      method: 'POST',
      body: payload,
    }).finally(() => {
      clearSessionRequestCache('/student/daily_quiz');
    }),
  studentLearningGames: () => request('/student/learning_games', { cacheTtlMs: 60000 }),
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
  conversations: (params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/conversations${suffix}`);
  },
  createConversation: (payload) =>
    request('/conversations', { method: 'POST', body: payload }),
  conversationMessages: (conversationId, params) => {
    const search = new URLSearchParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.set(key, String(value));
        }
      });
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request(`/conversations/${conversationId}/messages${suffix}`);
  },
  createConversationMessage: (conversationId, payload) =>
    request(`/conversations/${conversationId}/messages`, { method: 'POST', body: payload }),
  addMessageReaction: (messageId, reaction) =>
    request(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: { reaction },
    }),
  removeMessageReaction: (messageId, reaction) =>
    request(`/messages/${messageId}/reactions`, {
      method: 'DELETE',
      body: { reaction },
    }),
  markMessageDelivered: (messageId) =>
    request(`/messages/${messageId}/deliver`, { method: 'POST' }),
  markMessageRead: (messageId) => request(`/messages/${messageId}/read`, { method: 'POST' }),
  updatePresence: (status) =>
    request('/presence/update', {
      method: 'POST',
      body: { status },
    }),
  discussionSpaces: (params) => request(`/discussion_spaces${buildSearchSuffix(params)}`),
  createDiscussionSpace: (payload) =>
    request('/discussion_spaces', {
      method: 'POST',
      body: payload,
    }),
  discussionSpaceDetails: (id) => request(`/discussion_spaces/${id}`),
  discussionThreads: (discussionSpaceId) =>
    request(`/discussion_spaces/${discussionSpaceId}/threads`),
  createDiscussionThread: (discussionSpaceId, payload) =>
    request(`/discussion_spaces/${discussionSpaceId}/threads`, {
      method: 'POST',
      body: buildDiscussionRequestBody(payload),
    }),
  discussionThreadDetails: (id) => request(`/discussion_threads/${id}`),
  discussionThreadPosts: (discussionThreadId) =>
    request(`/discussion_threads/${discussionThreadId}/posts`),
  createDiscussionPost: (discussionThreadId, payload) =>
    request(`/discussion_threads/${discussionThreadId}/posts`, {
      method: 'POST',
      body: buildDiscussionRequestBody(payload),
    }),
  lockDiscussionThread: (id) => request(`/discussion_threads/${id}/lock`, { method: 'POST' }),
  unlockDiscussionThread: (id) =>
    request(`/discussion_threads/${id}/unlock`, { method: 'POST' }),
  archiveDiscussionThread: (id) =>
    request(`/discussion_threads/${id}/archive`, { method: 'POST' }),
  pinDiscussionThread: (id) => request(`/discussion_threads/${id}/pin`, { method: 'POST' }),
  unpinDiscussionThread: (id) => request(`/discussion_threads/${id}/unpin`, { method: 'POST' }),
  hideDiscussionPost: (id) => request(`/discussion_posts/${id}/hide`, { method: 'POST' }),
  unhideDiscussionPost: (id) => request(`/discussion_posts/${id}/unhide`, { method: 'POST' }),
  calendarEvents: () => request('/calendar/events'),
  notifications: () => request('/notifications', { cacheTtlMs: 30000 }),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/mark_as_read`, { method: 'POST' }).finally(() => {
      clearSessionRequestCache('/notifications');
    }),
};
