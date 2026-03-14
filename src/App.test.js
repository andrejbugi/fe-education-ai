import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEYS } from './services/apiClient';

function createJsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function normalizeUrl(input) {
  const url = typeof input === 'string' ? input : input.url;
  const marker = '/api/v1';
  const markerIndex = url.indexOf(marker);
  return markerIndex >= 0 ? url.slice(markerIndex) : url;
}

function installFetchMock(routeMap) {
  global.fetch = jest.fn((input, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const url = normalizeUrl(input);
    const key = `${method} ${url}`;
    const response = routeMap[key];

    if (!response) {
      throw new Error(`Unhandled fetch: ${key}`);
    }

    if (typeof response === 'function') {
      const result = response({ input, options, url, method });
      if (typeof result?.status === 'number') {
        return createJsonResponse(result.body, result.status);
      }
      return createJsonResponse(result);
    }

    if (typeof response?.status === 'number') {
      return createJsonResponse(response.body, response.status);
    }

    return createJsonResponse(response);
  });
}

function studentAssignmentPayload() {
  return {
    id: 7,
    title: 'Македонски јазик - 7-A Домашна задача 1',
    description: 'Подгответе решенија и кратко образложение за секој чекор.',
    teacher_notes: 'Прво отвори го PDF материјалот и следи ги чекорите по ред.',
    content_json: [
      { type: 'heading', text: 'Упатство' },
      { type: 'paragraph', text: 'Решавај по редослед и запиши кратко образложение.' },
      { type: 'instruction', text: 'Отвори ги материјалите пред да започнеш.' },
    ],
    assignment_type: 'Домашна задача',
    status: 'published',
    due_at: '2026-03-19T09:00:00.000Z',
    published_at: '2026-03-10T08:00:00.000Z',
    max_points: 100,
    subject: {
      id: 6,
      name: 'Македонски јазик',
    },
    teacher: {
      id: 10,
      full_name: 'Јована Георгиева',
    },
    classroom: {
      id: 6,
      name: '7-A',
    },
    resources: [
      {
        id: 1,
        title: 'PDF упатство',
        resource_type: 'pdf',
        file_url: 'https://example.com/task.pdf',
        description: 'Главен материјал',
        position: 1,
        is_required: true,
        metadata: { mime_type: 'application/pdf', file_size: '2 MB' },
      },
    ],
    steps: [
      {
        id: 17,
        position: 1,
        title: 'Прочитај лекција',
        content: 'Прегледај ја лекцијата и издвој ги клучните поими.',
        prompt: 'Издвои 3 клучни поими од лекцијата.',
        resource_url: 'https://example.com/lesson',
        example_answer: 'Пример: поим 1, поим 2, поим 3',
        step_type: 'reading',
        required: true,
        metadata: {
          estimated_minutes: 10,
        },
        content_json: [{ type: 'text', text: 'Запиши ги поимите со кратко објаснување.' }],
      },
      {
        id: 18,
        position: 2,
        title: 'Реши задача',
        content: 'Реши го главниот проблем и објасни го пристапот.',
        prompt: 'Опиши го пристапот со 2-3 реченици.',
        resource_url: '',
        example_answer: 'Прво го анализирам текстот, потоа го составувам одговорот.',
        step_type: 'text',
        required: true,
        metadata: {
          estimated_minutes: 15,
        },
        content_json: [],
      },
    ],
    submission: {
      id: 13,
      status: 'reviewed',
      started_at: '2026-03-10T10:00:00.000Z',
      submitted_at: '2026-03-11T10:00:00.000Z',
      total_score: '92.0',
      late: false,
    },
  };
}

function installStudentRoutes() {
  const assignment = studentAssignmentPayload();
  installFetchMock({
    'POST /api/v1/auth/login': {
      token: 'student-token',
      user: {
        id: 45,
        email: 'student1@edu.mk',
        full_name: 'Марија Стојанова',
        roles: ['student'],
      },
      school: { id: 1, name: 'ОУ Браќа Миладиновци' },
    },
    'GET /api/v1/auth/me': {
      user: {
        id: 45,
        email: 'student1@edu.mk',
        full_name: 'Марија Стојанова',
        roles: ['student'],
      },
      schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM' }],
    },
    'GET /api/v1/student/dashboard': {
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
        classroom_name: '7-A',
        homeroom_teacher_name: 'Јована Георгиева',
      },
      announcements: [{ id: 10, title: 'Важно известување', body: 'Понеси тетратка.' }],
      performance_snapshot: {
        average_grade: '92.5',
        completed_assignments_count: 5,
        in_progress_assignments_count: 1,
        overdue_assignments_count: 0,
        missed_assignments_count: 0,
        attendance_rate: '100.0',
      },
      ai_resume: {
        id: 3,
        title: 'AI помош - Македонски',
        status: 'active',
        assignment_id: 7,
      },
    },
    'GET /api/v1/student/assignments': [assignment],
    'GET /api/v1/student/assignments/7': assignment,
    'GET /api/v1/notifications': {
      notifications: [
        {
          id: 1,
          title: 'Нова домашна задача',
          message: 'Додадена е домашна по македонски.',
          read: false,
          created_at: '2026-03-10T08:30:00.000Z',
        },
      ],
    },
    'GET /api/v1/announcements?status=published': {
      announcements: [{ id: 10, title: 'Важно известување', body: 'Понеси тетратка.' }],
    },
    'GET /api/v1/student/performance': {
      average_grade: '92.5',
      completed_assignments_count: 5,
      in_progress_assignments_count: 1,
      overdue_assignments_count: 0,
      missed_assignments_count: 0,
      attendance_rate: '100.0',
    },
    'GET /api/v1/ai_sessions': {
      ai_sessions: [
        {
          id: 3,
          title: 'AI помош - Македонски',
          status: 'active',
          assignment_id: 7,
          messages: [
            {
              id: 101,
              role: 'assistant',
              message_type: 'hint',
              content: 'Прво издвој ги клучните поими.',
              sequence_number: 1,
            },
          ],
        },
      ],
    },
    'GET /api/v1/students/45/attendance': {
      attendance_records: [
        {
          id: 20,
          attendance_date: '2026-03-10',
          status: 'present',
          classroom: { id: 6, name: '7-A' },
          subject: { id: 6, name: 'Македонски јазик' },
        },
      ],
    },
    'POST /api/v1/notifications/1/mark_as_read': { id: 1, read: true },
    'DELETE /api/v1/auth/logout': { body: null, status: 204 },
  });
}

function installTeacherRoutes() {
  installFetchMock({
    'GET /api/v1/schools': [{ id: 1, name: 'ОУ Браќа Миладиновци' }],
    'POST /api/v1/auth/login': {
      token: 'teacher-token',
      user: {
        id: 10,
        email: 'teacher@edu.mk',
        full_name: 'Јована Георгиева',
        roles: ['teacher'],
      },
      school: { id: 1, name: 'ОУ Браќа Миладиновци' },
    },
    'GET /api/v1/auth/me': {
      user: {
        id: 10,
        email: 'teacher@edu.mk',
        full_name: 'Јована Георгиева',
        roles: ['teacher'],
      },
      schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM' }],
    },
    'GET /api/v1/teacher/dashboard': {
      teacher: { full_name: 'Јована Георгиева' },
      classroom_count: 1,
      student_count: 25,
      active_assignments: 3,
      review_queue: [],
      upcoming_calendar_events: [],
      homerooms: [
        {
          id: 1,
          classroom: { id: 1, name: '7-A' },
          teacher: { id: 10, full_name: 'Јована Георгиева' },
          active: true,
        },
      ],
      announcement_feed: [
        { id: 11, title: 'Состанок', body: 'Во 12:00', priority: 'important', status: 'published' },
      ],
    },
    'GET /api/v1/teacher/classrooms': [
      { id: 1, name: '7-A', grade_level: '7', academic_year: '2025/2026', student_count: 25 },
    ],
    'GET /api/v1/schools/1': {
      id: 1,
      classrooms: [{ id: 1, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
      subjects: [{ id: 6, name: 'Македонски јазик' }],
    },
    'GET /api/v1/teacher/homerooms': [
      {
        id: 1,
        classroom: { id: 1, name: '7-A' },
        teacher: { id: 10, full_name: 'Јована Георгиева' },
        active: true,
      },
    ],
    'GET /api/v1/announcements?status=published': {
      announcements: [
        { id: 11, title: 'Состанок', body: 'Во 12:00', priority: 'important', status: 'published' },
      ],
    },
    'GET /api/v1/classrooms/1/attendance': { attendance_records: [] },
    'GET /api/v1/classrooms/1/performance_overview': {
      classroom_name: '7-A',
      student_count: 25,
      average_grade: '87.40',
      average_attendance_rate: '96.20',
      average_engagement_score: '58.10',
      students: [
        {
          student_id: 45,
          student_name: 'Марија Стојанова',
          average_grade: '92.50',
          attendance_rate: '100.0',
          engagement_score: '60.0',
          completed_assignments_count: 5,
          overdue_assignments_count: 0,
        },
      ],
    },
    'POST /api/v1/announcements': ({ options }) => {
      const body = JSON.parse(options.body);
      return {
        id: 12,
        title: body.title,
        body: body.body,
        priority: body.priority,
        audience_type: body.audience_type,
        status: 'draft',
      };
    },
    'POST /api/v1/announcements/12/publish': {
      id: 12,
      title: 'Родителска средба',
      body: 'Средба во петок.',
      priority: 'urgent',
      audience_type: 'school',
      status: 'published',
      published_at: '2026-03-10T10:00:00.000Z',
    },
    'DELETE /api/v1/auth/logout': { body: null, status: 204 },
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = () => ({
    matches: false,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
});

afterEach(() => {
  jest.clearAllMocks();
  if (global.fetch) {
    global.fetch.mockClear?.();
  }
});

test('renders onboarding flow', () => {
  render(<App />);
  expect(screen.getByText(/Избери улога за почеток/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Продолжи/i })).toBeInTheDocument();
});

test('student can log in and load the dashboard', async () => {
  installStudentRoutes();
  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /Продолжи/i }));
  await userEvent.type(screen.getByLabelText(/Е-пошта/i), 'student1@edu.mk');
  await userEvent.type(screen.getByLabelText(/Лозинка/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /^Најава$/i }));

  expect(await screen.findByText(/Следно за тебе/i)).toBeInTheDocument();
  expect(
    await screen.findByRole('button', { name: /Отвори/i })
  ).toBeInTheDocument();
  expect(window.localStorage.getItem(STORAGE_KEYS.token)).toBe('student-token');
});

test('teacher can log in and load the teacher area', async () => {
  installTeacherRoutes();
  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /Наставник/i }));
  await userEvent.click(screen.getByRole('button', { name: /Продолжи/i }));
  expect(await screen.findByText(/Избери училиште пред најава/i)).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/Е-пошта/i), 'teacher@edu.mk');
  await userEvent.type(screen.getByLabelText(/Лозинка/i), 'password123');
  fireEvent.change(screen.getByLabelText(/Училиште/i), { target: { value: '1' } });
  await userEvent.click(screen.getByRole('button', { name: /^Најава$/i }));

  expect(await screen.findByText(/Наставничка контролна табла/i)).toBeInTheDocument();
  expect(await screen.findByText(/Добредојдовте, Јована Георгиева/i)).toBeInTheDocument();
});

test('restores authenticated student session from local storage', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);

  expect(await screen.findByText(/Следно за тебе/i)).toBeInTheDocument();
  expect((await screen.findAllByText(/Важно известување/i)).length).toBeGreaterThan(0);
});

test('logout clears the stored session and returns to onboarding', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getByRole('button', { name: /Одјава/i }));

  expect(await screen.findByText(/Избери улога за почеток/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(window.localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
  });
});

test('logged in student can open protected assignment details', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getAllByRole('button', { name: /Отвори/i })[0]);

  expect(await screen.findByText(/Белешки од наставник/i)).toBeInTheDocument();
  expect(screen.getByText(/Јована Георгиева/i)).toBeInTheDocument();
  expect(screen.getByText(/PDF упатство/i)).toBeInTheDocument();
  expect(screen.getByText(/Издвои 3 клучни поими од лекцијата/i)).toBeInTheDocument();
  expect(screen.getByText(/Поени: 92.0/i)).toBeInTheDocument();
});

test('logged in student can navigate to homework, assignments, notifications, and profile', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getByRole('button', { name: /^Домашни$/i }));
  expect(await screen.findByRole('button', { name: /Предадено/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Задачи$/i }));
  expect(
    await screen.findAllByText(/Македонски јазик - 7-A Домашна задача 1/i)
  ).not.toHaveLength(0);
  expect(screen.getByText(/Резултат: 92.0/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Известувања$/i }));
  expect(await screen.findByText(/Нова домашна задача/i)).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: /Прочитано/i }));
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /Прочитано/i })).not.toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: /^Профил$/i }));
  expect(
    await screen.findByRole('heading', { name: /AI сесии/i })
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Присуство/i })).toBeInTheDocument();
});

test('logged in teacher can open announcements, attendance, and reports', async () => {
  installTeacherRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getAllByRole('button', { name: /^Објави$/i })[0]);
  expect(
    await screen.findByRole('heading', { name: /^Објави$/i })
  ).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/Наслов/i), 'Родителска средба');
  await userEvent.type(screen.getByLabelText(/Содржина/i), 'Средба во петок.');
  fireEvent.change(screen.getByLabelText(/Приоритет/i), { target: { value: 'urgent' } });
  await userEvent.click(screen.getByRole('button', { name: /Креирај објава/i }));
  expect(await screen.findByText(/Родителска средба/i)).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole('button', { name: /Објави/i })[0]);
  expect(await screen.findByText(/Статус: published/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Присуство$/i }));
  expect(
    await screen.findByRole('heading', { name: /^Присуство$/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/Нема записи за присуство/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Извештаи$/i }));
  expect(
    await screen.findByRole('heading', { name: /Извештаи по клас/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/Просечна оценка/i)).toBeInTheDocument();
  expect(screen.getByText(/Марија Стојанова/i)).toBeInTheDocument();
});
