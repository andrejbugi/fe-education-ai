import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import HomeworkListCard from './components/HomeworkListCard';
import { TASK_STATUS } from './data/mockTasks';
import StudentWorkspacePage from './pages/StudentWorkspacePage';
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

function studentCheckedAssignmentPayload() {
  return {
    id: 7,
    title: 'Равенки',
    description: 'Реши ги чекорите по ред и предај ја задачата.',
    teacher_notes: 'Провери го првиот чекор пред да продолжиш.',
    content_json: [
      { type: 'heading', text: 'Работен лист' },
      { type: 'paragraph', text: 'Решавај чекор по чекор.' },
    ],
    assignment_type: 'step_by_step',
    status: 'published',
    due_at: '2026-03-19T09:00:00.000Z',
    published_at: '2026-03-10T08:00:00.000Z',
    max_points: 20,
    subject: {
      id: 9,
      name: 'Математика',
    },
    teacher: {
      id: 10,
      full_name: 'Јована Георгиева',
    },
    classroom: {
      id: 6,
      name: '7-A',
    },
    resources: [],
    steps: [
      {
        id: 21,
        position: 1,
        title: 'Реши равенка',
        content: '2x + 3 = 13',
        prompt: 'Внеси го решението на равенката.',
        example_answer: 'Пример: x = 5',
        step_type: 'text',
        required: true,
        evaluation_mode: 'normalized_text',
        metadata: {
          estimated_minutes: 5,
        },
        content_json: [],
      },
      {
        id: 22,
        position: 2,
        title: 'Објасни ја постапката',
        content: 'Опиши ги чекорите што ги направи.',
        prompt: 'Опиши ја постапката со 2-3 реченици.',
        example_answer: 'Прво одземав 3, потоа поделив со 2.',
        step_type: 'text',
        required: true,
        evaluation_mode: 'manual',
        metadata: {
          estimated_minutes: 10,
        },
        content_json: [],
      },
    ],
    submission: null,
  };
}

function installStudentRoutes(options = {}) {
  const assignment = options.assignment || studentAssignmentPayload();
  const assignmentId = String(assignment.id || 7);
  const createdSubmissionId = String(options.submissionId || 44);
  const notificationsPayload =
    options.notifications ?? [
      {
        id: 1,
        title: 'Нова домашна задача',
        message: 'Додадена е домашна по македонски.',
        read: false,
        created_at: '2026-03-10T08:30:00.000Z',
      },
    ];
  let submissionState = options.initialSubmission || assignment.submission || null;

  const assignmentResponse = () => ({
    ...assignment,
    submission: submissionState,
  });

  const normalizeStepAnswer = (value = '') =>
    String(value).toLowerCase().replace(/\s+/g, '').trim();

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
    'GET /api/v1/student/assignments': () => [assignmentResponse()],
    [`GET /api/v1/student/assignments/${assignmentId}`]: () => assignmentResponse(),
    [`POST /api/v1/assignments/${assignmentId}/submissions`]: () => {
      submissionState = {
        id: Number(createdSubmissionId),
        status: 'in_progress',
        started_at: '2026-03-14T09:00:00.000Z',
        submitted_at: null,
        total_score: null,
        late: false,
        step_answers: [],
      };
      return submissionState;
    },
    [`PATCH /api/v1/submissions/${createdSubmissionId}`]: ({ options: requestOptions }) => {
      const body = JSON.parse(requestOptions.body);
      const incomingStepAnswers = Array.isArray(body?.step_answers) ? body.step_answers : [];
      const existingStepAnswers = Array.isArray(submissionState?.step_answers)
        ? submissionState.step_answers
        : [];

      const nextStepAnswers = incomingStepAnswers.map((stepAnswer, index) => {
        const stepId = Number(stepAnswer.assignment_step_id);
        const answerText = stepAnswer.answer_text || '';
        let status = 'answered';

        if (stepId === 21) {
          status =
            normalizeStepAnswer(answerText) === 'x=5' ? 'correct' : 'incorrect';
        }

        return {
          id: index + 1,
          assignment_step_id: stepId,
          answer_text: answerText,
          status,
        };
      });

      submissionState = {
        ...(submissionState || {
          id: Number(createdSubmissionId),
          started_at: '2026-03-14T09:00:00.000Z',
          submitted_at: null,
          total_score: null,
          late: false,
        }),
        status: 'in_progress',
        step_answers: [
          ...existingStepAnswers.filter(
            (existingStepAnswer) =>
              !nextStepAnswers.some(
                (nextStepAnswer) =>
                  Number(nextStepAnswer.assignment_step_id) ===
                  Number(existingStepAnswer.assignment_step_id)
              )
          ),
          ...nextStepAnswers,
        ],
      };

      return submissionState;
    },
    [`POST /api/v1/submissions/${createdSubmissionId}/submit`]: () => {
      submissionState = {
        ...(submissionState || {
          id: Number(createdSubmissionId),
          started_at: '2026-03-14T09:00:00.000Z',
          late: false,
          step_answers: [],
        }),
        status: 'submitted',
        submitted_at: '2026-03-14T09:15:00.000Z',
      };
      return submissionState;
    },
    'GET /api/v1/notifications': {
      notifications: notificationsPayload,
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

function installTeacherRoutes(options = {}) {
  const uploadedResources = [];
  let createdAssignment = null;

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
    'GET /api/v1/teacher/classrooms/1': {
      id: 1,
      name: '7-A',
      grade_level: '7',
      academic_year: '2025/2026',
      students: [],
    },
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
    'GET /api/v1/teacher/subjects': [{ id: 6, name: 'Македонски јазик' }],
    'GET /api/v1/assignments': options.initialAssignments || [],
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
    'POST /api/v1/assignments': ({ options }) => {
      const body = JSON.parse(options.body);
      createdAssignment = {
        id: 14,
        title: body.title,
        description: body.description || '',
        teacher_notes: body.teacher_notes || '',
        content_json: body.content_json || [],
        assignment_type: body.assignment_type || 'homework',
        status: 'draft',
        due_at: body.due_at || null,
        published_at: null,
        max_points: body.max_points || null,
        classroom: { id: body.classroom_id || 1, name: '7-A' },
        subject: { id: body.subject_id || 6, name: 'Македонски јазик' },
        resources: [],
        steps: [],
      };
      return createdAssignment;
    },
    'POST /api/v1/assignments/14/resources': ({ options: requestOptions }) => {
      const formData = requestOptions.body;
      const file = formData.get('file');
      const resource = {
        id: uploadedResources.length + 1,
        title: formData.get('title') || file?.name || `Материјал ${uploadedResources.length + 1}`,
        resource_type: formData.get('resource_type') || 'file',
        file_url: `https://example.com/uploads/${encodeURIComponent(file?.name || 'resource')}`,
        external_url: null,
        embed_url: null,
        description: formData.get('description') || '',
        position: Number(formData.get('position') || uploadedResources.length + 1),
        is_required: String(formData.get('is_required')) === 'true',
        metadata: {},
        uploaded_file: file
          ? {
              filename: file.name,
              byte_size: file.size,
              content_type: file.type,
              url: `https://example.com/uploads/${encodeURIComponent(file.name)}`,
            }
          : null,
      };
      uploadedResources.push(resource);
      if (typeof options.onAssignmentResourceUpload === 'function') {
        options.onAssignmentResourceUpload(formData);
      }
      return resource;
    },
    'GET /api/v1/assignments/14': () => ({
      ...(createdAssignment || {
        id: 14,
        title: 'Нова задача',
        description: '',
        teacher_notes: '',
        content_json: [],
        assignment_type: 'homework',
        status: 'draft',
        due_at: null,
        published_at: null,
        max_points: null,
        classroom: { id: 1, name: '7-A' },
        subject: { id: 6, name: 'Македонски јазик' },
        steps: [],
      }),
      resources: uploadedResources,
    }),
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
  expect(await screen.findByText(/Успешно се најавивте./i)).toBeInTheDocument();
  expect(await screen.findByText(/Нова домашна задача/i)).toBeInTheDocument();
  expect(
    await screen.findAllByRole('button', { name: /Отвори/i })
  ).not.toHaveLength(0);
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
  expect(await screen.findByText(/Успешно се најавивте како наставник./i)).toBeInTheDocument();
  expect(await screen.findByText(/Добредојдовте, Јована Георгиева/i)).toBeInTheDocument();
});

test('teacher can create an assignment and upload files as resources', async () => {
  const uploadedForms = [];
  installTeacherRoutes({
    onAssignmentResourceUpload: (formData) => uploadedForms.push(formData),
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getAllByRole('button', { name: /Нова задача/i })[0]);
  await userEvent.type(screen.getByLabelText(/Наслов/i), 'Домашна задача со PDF');
  await userEvent.upload(
    screen.getByLabelText(/Прикачи материјали/i),
    new File(['pdf-body'], 'task.pdf', { type: 'application/pdf' })
  );
  await userEvent.click(screen.getByRole('button', { name: /Зачувај/i }));

  await waitFor(() => {
    expect(uploadedForms).toHaveLength(1);
  });

  expect(await screen.findByText(/Задачата е успешно креирана./i)).toBeInTheDocument();
  expect(uploadedForms[0].get('title')).toBe('task.pdf');
  expect(uploadedForms[0].get('resource_type')).toBe('pdf');
  expect(uploadedForms[0].get('position')).toBe('1');
  expect(uploadedForms[0].get('is_required')).toBe('true');
  expect(uploadedForms[0].get('file')).toBeInstanceOf(File);
  expect(uploadedForms[0].get('file').name).toBe('task.pdf');
});

test('teacher credentials are rejected on the student login form', async () => {
  installFetchMock({
    'POST /api/v1/auth/login': {
      token: 'teacher-token',
      user: {
        id: 10,
        email: 'teacher@edu.mk',
        full_name: 'Јована Георгиева',
        roles: ['teacher'],
      },
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
  });

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /Продолжи/i }));
  await userEvent.type(screen.getByLabelText(/Е-пошта/i), 'teacher@edu.mk');
  await userEvent.type(screen.getByLabelText(/Лозинка/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /^Најава$/i }));

  expect(
    await screen.findByText(
      /Овој профил е наставнички. Најави се преку формата за наставник и избери училиште./i
    )
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Ученик/i })).toBeInTheDocument();
  expect(window.localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
});

test('server-side login errors are generalized for the user', async () => {
  installFetchMock({
    'POST /api/v1/auth/login': {
      body: { error: 'Internal Server Error' },
      status: 500,
    },
  });

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /Продолжи/i }));
  await userEvent.type(screen.getByLabelText(/Е-пошта/i), 'student1@edu.mk');
  await userEvent.type(screen.getByLabelText(/Лозинка/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /^Најава$/i }));

  expect(
    await screen.findByText(/Нешто тргна наопаку. Обиди се повторно./i)
  ).toBeInTheDocument();
  expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
});

test('student credentials are rejected on the teacher login form', async () => {
  installFetchMock({
    'GET /api/v1/schools': [{ id: 1, name: 'ОУ Браќа Миладиновци' }],
    'POST /api/v1/auth/login': {
      token: 'student-token',
      user: {
        id: 45,
        email: 'student1@edu.mk',
        full_name: 'Марија Стојанова',
        roles: ['student'],
      },
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
  });

  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /Наставник/i }));
  await userEvent.click(screen.getByRole('button', { name: /Продолжи/i }));
  await screen.findByText(/Избери училиште пред најава/i);
  await userEvent.type(screen.getByLabelText(/Е-пошта/i), 'student1@edu.mk');
  await userEvent.type(screen.getByLabelText(/Лозинка/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /^Најава$/i }));

  expect(
    await screen.findByText(/Овој профил е ученички. Најави се преку формата за ученик./i)
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Наставник/i })).toBeInTheDocument();
  expect(window.localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
});

test('restores authenticated student session from local storage', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);

  expect(await screen.findByText(/Следно за тебе/i)).toBeInTheDocument();
  expect(await screen.findByText(/Нова домашна задача/i)).toBeInTheDocument();
});

test('student dashboard and notifications page stay empty when notifications endpoint returns none', async () => {
  installStudentRoutes({ notifications: [] });
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);

  expect(await screen.findByText(/Следно за тебе/i)).toBeInTheDocument();
  expect(await screen.findByText(/Нема активни известувања./i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Известувања$/i }));
  expect(await screen.findByText(/Нема известувања./i)).toBeInTheDocument();
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
  expect(await screen.findByText(/Успешно се одјавивте./i)).toBeInTheDocument();
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

test('hero continue opens the workspace even for an already solved assignment', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getByRole('button', { name: /^Продолжи$/i }));

  expect(await screen.findByText(/Твој одговор/i)).toBeInTheDocument();
});

test('student assignment workspace uses backend submission checks and submit flow', async () => {
  installStudentRoutes({ assignment: studentCheckedAssignmentPayload() });
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getByRole('button', { name: /^Продолжи$/i }));

  expect(await screen.findByText(/Проверка: Автоматска проверка/i)).toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox'), 'x = 5');
  await userEvent.click(screen.getByRole('button', { name: /Провери чекор/i }));

  expect(
    await screen.findByText(/Точно. Чекорот е автоматски проверен./i)
  ).toBeInTheDocument();
  expect(await screen.findByText(/Проверка: Потребен преглед/i)).toBeInTheDocument();

  await userEvent.type(
    screen.getByRole('textbox'),
    'Прво одземав 3, потоа поделив со 2.'
  );
  await userEvent.click(screen.getByRole('button', { name: /Провери чекор/i }));

  expect(
    await screen.findByText(
      /Одговорот е зачуван. Чекорот треба да го прегледа наставник./i
    )
  ).toBeInTheDocument();
  expect(await screen.findByText(/Статус на чекор: Одговорено/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Заврши задача/i }));

  expect(await screen.findByRole('heading', { name: /Успешно предадено/i })).toBeInTheDocument();
  expect(await screen.findByText(/Задачата е успешно завршена./i)).toBeInTheDocument();

  confirmSpy.mockRestore();
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
  expect(await screen.findByRole('button', { name: /Предадено/i })).toBeDisabled();

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
  expect(await screen.findByRole('heading', { name: /Присуство/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Поставки/i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /AI сесии/i })).not.toBeInTheDocument();
});

test('checking a non-auto-checked step keeps the student in the workspace flow', async () => {
  const onDraftFeedbackChange = jest.fn();
  const onTaskCompleted = jest.fn();

  render(
    <StudentWorkspacePage
      theme="dark"
      onToggleTheme={jest.fn()}
      tasks={[
        {
          id: 'history-step-1',
          title: 'Историја',
          status: TASK_STATUS.IN_PROGRESS,
          expectedAnswers: [],
          hint: 'Провери ги белешките.',
        },
      ]}
      activeTask={{
        id: 'history-step-1',
        title: 'Историја',
        status: TASK_STATUS.IN_PROGRESS,
        placeholder: 'Внеси одговор',
        expectedAnswers: [],
        hint: 'Провери ги белешките.',
      }}
      onBackToDashboard={jest.fn()}
      onCompleteTask={jest.fn()}
      onSkipTask={jest.fn()}
      onNextTask={jest.fn()}
      getNextTaskId={() => null}
      draft={{ answer: '1008-1012', feedback: null }}
      onDraftAnswerChange={jest.fn()}
      onDraftFeedbackChange={onDraftFeedbackChange}
      onTaskCompleted={onTaskCompleted}
    />
  );

  await userEvent.click(screen.getByRole('button', { name: /Провери чекор/i }));

  expect(onDraftFeedbackChange).toHaveBeenCalledWith({
    type: 'success',
    message: 'Одговорот е зачуван. Оваа задача нема автоматска проверка.',
  });
  expect(onTaskCompleted).not.toHaveBeenCalled();
});

test('homework submit button triggers submit instead of opening task details', async () => {
  const onOpenTask = jest.fn();
  const onContinueTask = jest.fn();
  const onSubmitTask = jest.fn();

  render(
    <HomeworkListCard
      items={[
        {
          id: 'task-1',
          subject: 'Историја',
          title: 'Car Samoil',
          dueText: 'Mon, 03/16, 01:00 AM',
          status: TASK_STATUS.IN_PROGRESS,
          submission: null,
        },
      ]}
      onOpenTask={onOpenTask}
      onContinueTask={onContinueTask}
      onSubmitTask={onSubmitTask}
    />
  );

  await userEvent.click(screen.getByRole('button', { name: /Предај/i }));

  expect(onSubmitTask).toHaveBeenCalledWith('task-1');
  expect(onOpenTask).not.toHaveBeenCalled();
  expect(onContinueTask).not.toHaveBeenCalled();
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
