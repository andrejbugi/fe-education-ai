import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
      feedback: 'Одлично објаснето и јасно решение.',
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

function teacherDraftAssignmentPayload() {
  return {
    id: 19,
    title: 'Zbir na dva broevi',
    description: 'soberi gi broevite',
    teacher_notes: 'probajte da ne koristite AI',
    content_json: [{ type: 'paragraph', text: 'Собери ги броевите и запиши го резултатот.' }],
    assignment_type: 'homework',
    status: 'draft',
    due_at: '2026-03-15T00:00:00.000Z',
    published_at: null,
    max_points: 5,
    classroom: { id: 1, name: '6-A' },
    subject: { id: 6, name: 'Математика' },
    resources: [
      {
        id: 1,
        title: 'worksheet.pdf',
        resource_type: 'pdf',
        file_url: 'https://example.com/worksheet.pdf',
      },
    ],
    steps: [
      {
        id: 31,
        position: 1,
        title: 'Zbir na dva broevi',
        content: 'soberi gi broevite',
        prompt: 'Реши ја задачата.',
        resource_url: '',
        example_answer: '',
        step_type: 'text',
        required: true,
        evaluation_mode: 'manual',
        metadata: {},
        content_json: [{ type: 'paragraph', text: 'Собери ги броевите и запиши го резултатот.' }],
      },
    ],
  };
}

function installStudentRoutes(options = {}) {
  const assignment = options.assignment || studentAssignmentPayload();
  const assignmentDetails = options.assignmentDetails || assignment;
  const assignmentId = String(assignment.id || 7);
  const createdSubmissionId = String(options.submissionId || 44);
  const createdAiSessionId = String(options.aiSessionId || 55);
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
  let submissionState = options.initialSubmission || null;
  let aiSessionsState = Array.isArray(options.aiSessions)
    ? options.aiSessions.map((session) => ({
        ...session,
        messages: Array.isArray(session.messages) ? [...session.messages] : [],
      }))
    : [];
  let dailyQuizState =
    options.dailyQuiz || {
      date: '2026-03-19',
      available_now: true,
      available_from: '18:00',
      available_until: '20:00',
      already_answered: false,
      question: {
        id: 12,
        title: 'Квиз на денот',
        body: 'Кој град е главен град на Македонија?',
        category: 'geography',
        difficulty: null,
        answer_type: 'single_choice',
        answer_options: ['Битола', 'Скопје', 'Охрид', 'Тетово'],
      },
      answer: null,
      reward: {
        correct_xp: 1,
      },
    };
  const learningGamesState =
    options.learningGames || {
      available_now: true,
      available_from: '18:00',
      available_until: '20:00',
      games: [
        {
          game_key: 'basic_math_speed',
          title: 'Брза математика',
          description: 'Решавај кратки математички задачи.',
          icon_key: null,
          is_enabled: true,
          position: 1,
          metadata: {},
        },
        {
          game_key: 'geometry_shapes',
          title: 'Геометрија',
          description: 'Препознај форми и агли.',
          icon_key: null,
          is_enabled: true,
          position: 2,
          metadata: {},
        },
      ],
    };

  const assignmentResponse = (sourceAssignment) => ({
    ...sourceAssignment,
    submission: submissionState || sourceAssignment.submission || null,
  });

  const normalizeStepAnswer = (value = '') =>
    String(value).toLowerCase().replace(/\s+/g, '').trim();

  const getAiSessionById = (sessionId) =>
    aiSessionsState.find((session) => String(session.id) === String(sessionId)) || null;

  const buildAiAssistantReply = ({ content, assignmentStepId }) =>
    options.aiAssistantReply?.({ content, assignmentStepId }) ||
    `Фокусирај се на чекорот ${assignmentStepId || 'што го решаваш'} и почни со првата јасна идеја.`;

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
      progress: {
        total_xp: 155,
        current_level: 2,
        current_streak: 5,
        longest_streak: 5,
        next_level_xp: 200,
        xp_to_next_level: 45,
        level_progress_percent: 55,
        badges_count: 2,
        badges: [
          {
            id: 1,
            code: 'ai_explorer',
            name: 'AI истражувач',
            description: 'Започната е AI сесија за учење.',
            awarded_at: '2026-03-17T10:20:30.000Z',
          },
          {
            id: 2,
            code: 'first_completion',
            name: 'Прва победа',
            description: 'Завршена е првата задача.',
            awarded_at: '2026-03-16T09:20:30.000Z',
          },
        ],
        breakdown: {
          completed_assignments: 90,
          in_progress_assignments: 10,
          grade_bonus: 40,
          attendance: 10,
          ai_learning: 5,
        },
      },
      ai_resume: {
        id: 3,
        title: 'AI помош - Македонски',
        status: 'active',
        assignment_id: 7,
      },
    },
    'GET /api/v1/student/assignments': () => [assignmentResponse(assignment)],
    [`GET /api/v1/student/assignments/${assignmentId}`]: () => assignmentResponse(assignmentDetails),
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
      progress: {
        total_xp: 155,
        current_level: 2,
        current_streak: 5,
        longest_streak: 5,
        next_level_xp: 200,
        xp_to_next_level: 45,
        level_progress_percent: 55,
        badges_count: 2,
        badges: [
          {
            id: 1,
            code: 'ai_explorer',
            name: 'AI истражувач',
            description: 'Започната е AI сесија за учење.',
            awarded_at: '2026-03-17T10:20:30.000Z',
          },
          {
            id: 2,
            code: 'first_completion',
            name: 'Прва победа',
            description: 'Завршена е првата задача.',
            awarded_at: '2026-03-16T09:20:30.000Z',
          },
        ],
        breakdown: {
          completed_assignments: 90,
          in_progress_assignments: 10,
          grade_bonus: 40,
          attendance: 10,
          ai_learning: 5,
          daily_quiz: 1,
        },
      },
    },
    'GET /api/v1/student/daily_quiz': () => dailyQuizState,
    'POST /api/v1/student/daily_quiz/answer': ({ options: requestOptions }) => {
      const body = JSON.parse(requestOptions.body);
      const selectedAnswer = body.selected_answer;
      const correctAnswer = dailyQuizState.question?.answer_options?.includes('Скопје')
        ? 'Скопје'
        : dailyQuizState.question?.answer_options?.[0];
      const correct = selectedAnswer === correctAnswer;
      const responsePayload = {
        correct,
        xp_awarded: correct ? 1 : 0,
        already_answered: true,
        explanation: correct
          ? 'Скопје е главен град на Македонија.'
          : 'Точниот одговор е Скопје.',
        answered_at: '2026-03-19T18:31:00.000Z',
      };

      dailyQuizState = {
        ...dailyQuizState,
        already_answered: true,
        answer: {
          selected_answer: selectedAnswer,
          answer_text: null,
          ...responsePayload,
        },
      };

      return typeof options.onDailyQuizAnswer === 'function'
        ? options.onDailyQuizAnswer(responsePayload, body)
        : responsePayload;
    },
    'GET /api/v1/student/learning_games': () => learningGamesState,
    'GET /api/v1/ai_sessions': () => ({
      ai_sessions: aiSessionsState,
    }),
    'POST /api/v1/ai_sessions': ({ options: requestOptions }) => {
      const body = JSON.parse(requestOptions.body);
      const existingSession = aiSessionsState.find(
        (session) =>
          String(session.assignment_id) === String(body.assignment_id) &&
          String(session.submission_id) === String(body.submission_id) &&
          String(session.session_type || '') === String(body.session_type || '')
      );

      if (existingSession) {
        return existingSession;
      }

      const nextSession = {
        id: Number(createdAiSessionId),
        title: body.title || 'AI help',
        status: 'active',
        assignment_id: body.assignment_id,
        submission_id: body.submission_id,
        subject_id: body.subject_id,
        session_type: body.session_type || 'assignment_help',
        messages: [],
      };
      aiSessionsState = [...aiSessionsState, nextSession];
      return nextSession;
    },
    'GET /api/v1/ai_sessions/3': () => {
      const session = getAiSessionById(3);
      return session || { status: 404, body: { error: 'Not found' } };
    },
    [`GET /api/v1/ai_sessions/${createdAiSessionId}`]: () => {
      const session = getAiSessionById(createdAiSessionId);
      return session || { status: 404, body: { error: 'Not found' } };
    },
    'POST /api/v1/ai_sessions/3/messages': ({ options: requestOptions }) => {
      const session = getAiSessionById(3);
      if (!session) {
        return { status: 404, body: { error: 'Not found' } };
      }

      const body = JSON.parse(requestOptions.body);
      if (typeof options.onAiMessageCreate === 'function') {
        options.onAiMessageCreate(body);
      }
      const assignmentStepId = body.metadata?.assignment_step_id ?? null;
      const nextSequence = session.messages.length + 1;
      const userMessage = {
        id: 1000 + nextSequence,
        role: 'user',
        message_type: body.message_type || 'question',
        content: body.content || '',
        sequence_number: nextSequence,
        metadata: {
          assignment_step_id: assignmentStepId,
        },
      };
      const assistantMessage = {
        id: 1001 + nextSequence,
        role: 'assistant',
        message_type: 'hint',
        content: buildAiAssistantReply({
          content: body.content || '',
          assignmentStepId,
        }),
        sequence_number: nextSequence + 1,
        metadata: {
          assignment_step_id: assignmentStepId,
          generated_for_message_id: 1000 + nextSequence,
          provider: 'mock',
        },
      };
      session.messages = [...session.messages, userMessage, assistantMessage];
      const responsePayload = {
        user_message: userMessage,
        assistant_message: assistantMessage,
      };
      return typeof options.onAiMessageResponse === 'function'
        ? options.onAiMessageResponse(responsePayload, {
            body,
            sessionId: 3,
          })
        : responsePayload;
    },
    [`POST /api/v1/ai_sessions/${createdAiSessionId}/messages`]: ({ options: requestOptions }) => {
      const session = getAiSessionById(createdAiSessionId);
      if (!session) {
        return { status: 404, body: { error: 'Not found' } };
      }

      const body = JSON.parse(requestOptions.body);
      if (typeof options.onAiMessageCreate === 'function') {
        options.onAiMessageCreate(body);
      }
      const assignmentStepId = body.metadata?.assignment_step_id ?? null;
      const nextSequence = session.messages.length + 1;
      const userMessage = {
        id: 2000 + nextSequence,
        role: 'user',
        message_type: body.message_type || 'question',
        content: body.content || '',
        sequence_number: nextSequence,
        metadata: {
          assignment_step_id: assignmentStepId,
        },
      };
      const assistantMessage = {
        id: 2001 + nextSequence,
        role: 'assistant',
        message_type: 'hint',
        content: buildAiAssistantReply({
          content: body.content || '',
          assignmentStepId,
        }),
        sequence_number: nextSequence + 1,
        metadata: {
          assignment_step_id: assignmentStepId,
          generated_for_message_id: 2000 + nextSequence,
          provider: 'mock',
        },
      };
      session.messages = [...session.messages, userMessage, assistantMessage];
      const responsePayload = {
        user_message: userMessage,
        assistant_message: assistantMessage,
      };
      return typeof options.onAiMessageResponse === 'function'
        ? options.onAiMessageResponse(responsePayload, {
            body,
            sessionId: createdAiSessionId,
          })
        : responsePayload;
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
  const createdSteps = [];
  let createdAssignment = null;
  const reviewAssignment =
    options.reviewAssignment || {
      id: 28,
      title: 'Najdi go zbirot',
      description: 'naјdi go zbirot na dvocifrenite broevi',
      teacher_notes: 'Прегледај го образложението.',
      content_json: [{ type: 'paragraph', text: 'Реши ја равенката по чекори.' }],
      assignment_type: 'step_by_step',
      status: 'published',
      due_at: '2026-03-20T00:00:00.000Z',
      published_at: '2026-03-10T09:00:00.000Z',
      max_points: 10,
      classroom: { id: 1, name: '7-A' },
      subject: { id: 6, name: 'Македонски јазик' },
      resources: [],
      steps: [
        {
          id: 67,
          position: 1,
          title: 'Реши равенка',
          content: '43 + 55 = x',
          prompt: 'Најди го x во равенката.',
          example_answer: 'x = 5',
          step_type: 'text',
          required: true,
          evaluation_mode: 'regex',
          metadata: {},
          content_json: [],
          answer_keys: [{ id: 91, value: '^x\\s*=\\s*98$', position: 1, metadata: {} }],
        },
      ],
    };
  let teacherStudent45 = options.teacherStudent45 || {
    student: {
      id: 45,
      full_name: 'Марија Стојанова',
      email: 'student045@edu.mk',
    },
    classrooms: [{ id: 1, name: '7-A' }],
    subjects: [{ id: 6, name: 'Македонски јазик', current_grade: '5', missing_assignments: 0 }],
    recent_submissions: [
      {
        id: 301,
        submission_id: 301,
        assignment_id: 28,
        assignment_title: 'Najdi go zbirot',
        classroom_id: 1,
        classroom_name: '7-A',
        status: 'submitted',
        submitted_at: '2026-03-15T08:15:00.000Z',
        total_score: null,
        feedback: '',
        step_answers: [
          {
            id: 1,
            assignment_step_id: 67,
            answer_text: 'x = 98',
            status: 'correct',
          },
        ],
      },
    ],
  };
  let editableAssignment = options.editableAssignment
    ? {
        ...options.editableAssignment,
        resources: Array.isArray(options.editableAssignment.resources)
          ? [...options.editableAssignment.resources]
          : [],
        steps: Array.isArray(options.editableAssignment.steps)
          ? [...options.editableAssignment.steps]
          : [],
      }
    : null;
  let teacherReviewSubmission =
    options.teacherReviewSubmission ||
    options.reviewStudentAssignment || {
      id: 301,
      status: 'submitted',
      submitted_at: '2026-03-15T08:15:00.000Z',
      reviewed_at: null,
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
      },
      assignment: {
        id: 28,
        title: 'Najdi go zbirot',
        assignment_type: 'step_by_step',
        due_at: '2026-03-20T00:00:00.000Z',
        subject: { id: 6, name: 'Македонски јазик' },
        classroom: { id: 1, name: '7-A' },
        teacher: { id: 10, full_name: 'Јована Георгиева' },
      },
      steps: reviewAssignment.steps,
      step_answers: [
        {
          id: 1,
          assignment_step_id: 67,
          answer_text: 'x = 98',
          status: 'correct',
        },
      ],
      grade: {
        id: 0,
        score: null,
        feedback: '',
        graded_at: null,
      },
    };
  const assignmentList =
    options.initialAssignments ||
    [...(editableAssignment ? [editableAssignment] : []), reviewAssignment];

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
      classroom_count: 2,
      student_count: 25,
      active_assignments: 3,
      review_queue: [
        {
          id: 301,
          submission_id: 301,
          student_id: 45,
          student_name: 'Марија Стојанова',
          classroom_id: 1,
          classroom_name: '7-A',
          assignment_id: 28,
          assignment_title: 'Najdi go zbirot',
          submitted_at: '2026-03-15T08:15:00.000Z',
          status: 'submitted',
        },
        {
          id: 302,
          submission_id: 302,
          student_id: 46,
          student_name: 'Никола Јовановски',
          classroom_id: 2,
          classroom_name: '6-B',
          assignment_id: 44,
          assignment_title: 'Историја - Домашна задача 1',
          submitted_at: '2026-03-14T08:15:00.000Z',
          status: 'late',
        },
      ],
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
      { id: 2, name: '6-B', grade_level: '6', academic_year: '2025/2026', student_count: 22 },
    ],
    'GET /api/v1/teacher/classrooms/1': {
      id: 1,
      name: '7-A',
      grade_level: '7',
      academic_year: '2025/2026',
      students: [
        {
          id: 45,
          full_name: 'Марија Стојанова',
          email: 'student045@edu.mk',
        },
      ],
    },
    'GET /api/v1/schools/1': {
      id: 1,
      classrooms: [
        { id: 1, name: '7-A', grade_level: '7', academic_year: '2025/2026' },
        { id: 2, name: '6-B', grade_level: '6', academic_year: '2025/2026' },
      ],
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
    'GET /api/v1/assignments': () => [
      ...assignmentList.filter((item) => String(item.id) !== String(editableAssignment?.id || '')),
      ...(editableAssignment ? [editableAssignment] : []),
    ],
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
      if (body.audience_type === 'classroom' && !body.classroom_id) {
        return {
          status: 422,
          body: { error: 'classroom_id is required' },
        };
      }
      return {
        id: 12,
        title: body.title,
        body: body.body,
        priority: body.priority,
        audience_type: body.audience_type,
        classroom_id: body.classroom_id || null,
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
        steps: createdSteps,
      };
      return createdAssignment;
    },
    'GET /api/v1/assignments/19': () =>
      editableAssignment || { status: 404, body: { error: 'Not found' } },
    'GET /api/v1/assignments/28': () => reviewAssignment,
    'GET /api/v1/teacher/submissions/301': () => teacherReviewSubmission,
    'GET /api/v1/teacher/students/45': () => teacherStudent45,
    'POST /api/v1/submissions/301/grades': ({ options: requestOptions }) => {
      const body = JSON.parse(requestOptions.body);
      teacherStudent45 = {
        ...teacherStudent45,
        recent_submissions: teacherStudent45.recent_submissions.map((submission) =>
          submission.submission_id === 301
            ? {
                ...submission,
                status: 'reviewed',
                total_score:
                  body.score !== undefined && body.score !== null ? String(body.score) : null,
                feedback: body.feedback || '',
              }
            : submission
        ),
      };
      teacherReviewSubmission = {
        ...teacherReviewSubmission,
        grade: {
          ...(teacherReviewSubmission.grade || {}),
          score: body.score !== undefined && body.score !== null ? String(body.score) : null,
          feedback: body.feedback || '',
        },
      };
      return {
        submission_id: 301,
        status: 'reviewed',
        total_score:
          body.score !== undefined && body.score !== null ? String(body.score) : null,
        feedback: body.feedback || '',
      };
    },
    'PATCH /api/v1/assignments/19': ({ options: requestOptions }) => {
      if (!editableAssignment) {
        return { status: 404, body: { error: 'Not found' } };
      }
      const body = JSON.parse(requestOptions.body);
      editableAssignment = {
        ...editableAssignment,
        ...body,
        assignment_type: body.assignment_type || editableAssignment.assignment_type,
        teacher_notes:
          body.teacher_notes !== undefined
            ? body.teacher_notes
            : editableAssignment.teacher_notes,
        content_json:
          body.content_json !== undefined ? body.content_json : editableAssignment.content_json,
        max_points:
          body.max_points !== undefined ? body.max_points : editableAssignment.max_points,
        due_at: body.due_at !== undefined ? body.due_at : editableAssignment.due_at,
        classroom: {
          ...(editableAssignment.classroom || {}),
          id: body.classroom_id || editableAssignment.classroom?.id || 1,
          name:
            body.classroom_id && Number(body.classroom_id) === 1
              ? '7-A'
              : editableAssignment.classroom?.name || '6-A',
        },
        subject: {
          ...(editableAssignment.subject || {}),
          id: body.subject_id || editableAssignment.subject?.id || 6,
          name:
            body.subject_id && Number(body.subject_id) === 6
              ? 'Македонски јазик'
              : editableAssignment.subject?.name || 'Математика',
        },
      };
      return editableAssignment;
    },
    'POST /api/v1/assignments/19/publish': () => {
      if (!editableAssignment) {
        return { status: 404, body: { error: 'Not found' } };
      }
      editableAssignment = {
        ...editableAssignment,
        status: 'published',
        published_at: '2026-03-10T10:00:00.000Z',
      };
      return editableAssignment;
    },
    'PATCH /api/v1/assignments/19/steps/31': ({ options: requestOptions }) => {
      if (!editableAssignment) {
        return { status: 404, body: { error: 'Not found' } };
      }
      const body = JSON.parse(requestOptions.body);
      editableAssignment = {
        ...editableAssignment,
        steps: (editableAssignment.steps || []).map((step) =>
          String(step.id) === '31' ? { ...step, ...body } : step
        ),
      };
      if (typeof options.onAssignmentStepUpdate === 'function') {
        options.onAssignmentStepUpdate(body);
      }
      return editableAssignment.steps.find((step) => String(step.id) === '31');
    },
    'POST /api/v1/assignments/19/steps': ({ options: requestOptions }) => {
      if (!editableAssignment) {
        return { status: 404, body: { error: 'Not found' } };
      }
      const body = JSON.parse(requestOptions.body);
      const step = {
        id: 31,
        position: body.position || 1,
        title: body.title || 'Чекор 1',
        content: body.content || '',
        prompt: body.prompt || '',
        resource_url: body.resource_url || '',
        example_answer: body.example_answer || '',
        step_type: body.step_type || 'text',
        required: body.required !== false,
        evaluation_mode: body.evaluation_mode || 'manual',
        metadata: body.metadata || {},
        content_json: body.content_json || [],
        answer_keys: body.answer_keys || [],
      };
      editableAssignment = {
        ...editableAssignment,
        steps: [step],
      };
      return step;
    },
    'POST /api/v1/assignments/14/steps': ({ options: requestOptions }) => {
      const body = JSON.parse(requestOptions.body);
      const step = {
        id: createdSteps.length + 1,
        position: body.position || createdSteps.length + 1,
        title: body.title || `Чекор ${createdSteps.length + 1}`,
        content: body.content || '',
        prompt: body.prompt || '',
        resource_url: body.resource_url || '',
        example_answer: body.example_answer || '',
        step_type: body.step_type || 'text',
        required: body.required !== false,
        evaluation_mode: body.evaluation_mode || 'manual',
        metadata: body.metadata || {},
        content_json: body.content_json || [],
        answer_keys: body.answer_keys || [],
      };
      createdSteps.push(step);
      if (typeof options.onAssignmentStepCreate === 'function') {
        options.onAssignmentStepCreate(body);
      }
      return step;
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
        steps: createdSteps,
      }),
      resources: uploadedResources,
      steps: createdSteps,
    }),
    'POST /api/v1/assignments/14/publish': () => ({
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
        resources: uploadedResources,
        steps: createdSteps,
      }),
      status: 'published',
      published_at: '2026-03-10T10:00:00.000Z',
      resources: uploadedResources,
      steps: createdSteps,
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
  window.history.pushState({}, '', '/');
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
  expect(await screen.findByText(/Ниво 2/i)).toBeInTheDocument();
  expect(await screen.findByText(/155 XP/i)).toBeInTheDocument();
  expect(await screen.findByText(/AI истражувач/i)).toBeInTheDocument();
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
  expect(window.location.pathname).toBe('/teacher');
});

test('teacher can create a multi-step assignment and upload files as resources', async () => {
  const uploadedForms = [];
  const createdSteps = [];
  installTeacherRoutes({
    onAssignmentResourceUpload: (formData) => uploadedForms.push(formData),
    onAssignmentStepCreate: (payload) => createdSteps.push(payload),
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getAllByRole('button', { name: /Нова задача/i })[0]);
  expect(await screen.findByRole('heading', { name: /Нова задача/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/teacher/assignments/new');
  const generalInfoSection = screen.getByText(/Општи информации/i).closest('.task-detail-block');
  expect(generalInfoSection).not.toBeNull();
  await userEvent.type(within(generalInfoSection).getByLabelText(/^Наслов$/i), 'Домашна задача со PDF');
  await userEvent.type(within(generalInfoSection).getByLabelText(/Опис/i), 'Реши ги сите чекори.');

  const firstStepCard = screen.getByText(/^Чекор 1$/i).closest('section');
  expect(firstStepCard).not.toBeNull();
  await userEvent.type(within(firstStepCard).getByLabelText(/Наслов на чекор/i), 'Чекор 1');
  await userEvent.type(within(firstStepCard).getByLabelText(/^Содржина$/i), 'Собери ги броевите.');
  await userEvent.upload(
    screen.getByLabelText(/Прикачи материјали/i),
    new File(['pdf-body'], 'task.pdf', { type: 'application/pdf' })
  );
  await userEvent.click(screen.getByRole('button', { name: /Додај чекор/i }));

  const stepCards = screen.getAllByText(/Чекор \d+/i);
  const secondStepCard = stepCards[1].closest('section');
  expect(secondStepCard).not.toBeNull();
  await userEvent.type(within(secondStepCard).getByLabelText(/Наслов на чекор/i), 'Чекор 2');
  await userEvent.type(
    within(secondStepCard).getByLabelText(/^Содржина$/i),
    'Реши ја равенката 2x + 3 = 13.'
  );
  await userEvent.selectOptions(
    within(secondStepCard).getByLabelText(/Проверка/i),
    'normalized_text'
  );
  await userEvent.type(
    within(secondStepCard).getByLabelText(/Одговори, по еден во секој ред/i),
    'x=5'
  );

  await userEvent.click(screen.getByRole('button', { name: /Зачувај задача/i }));

  await waitFor(() => {
    expect(uploadedForms).toHaveLength(1);
  });

  expect(await screen.findByText(/Задачата е успешно креирана./i)).toBeInTheDocument();
  expect(createdSteps).toHaveLength(2);
  expect(createdSteps[0].title).toBe('Чекор 1');
  expect(createdSteps[0].evaluation_mode).toBe('manual');
  expect(createdSteps[0].required).toBe(true);
  expect(createdSteps[1].evaluation_mode).toBe('normalized_text');
  expect(createdSteps[1].answer_keys).toEqual([
    expect.objectContaining({ value: 'x=5', position: 1, case_sensitive: false }),
  ]);
  expect(uploadedForms[0].get('title')).toBe('task.pdf');
  expect(uploadedForms[0].get('resource_type')).toBe('pdf');
  expect(uploadedForms[0].get('position')).toBe('1');
  expect(uploadedForms[0].get('is_required')).toBe('true');
  expect(uploadedForms[0].get('file')).toBeInstanceOf(File);
  expect(uploadedForms[0].get('file').name).toBe('task.pdf');
}, 15000);

test('teacher can edit a draft assignment before it is published', async () => {
  const updatedSteps = [];
  installTeacherRoutes({
    editableAssignment: teacherDraftAssignmentPayload(),
    onAssignmentStepUpdate: (payload) => updatedSteps.push(payload),
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getByRole('button', { name: /^Задачи$/i }));
  fireEvent.change(screen.getByLabelText(/Избери задача/i), { target: { value: '19' } });
  expect(await screen.findByText(/Детали за задача/i)).toBeInTheDocument();
  expect(await screen.findAllByText(/Zbir na dva broevi/i)).not.toHaveLength(0);
  expect(window.location.pathname).toBe('/teacher/assignments');

  await userEvent.click(screen.getByRole('button', { name: /Измени задача/i }));
  expect(await screen.findByRole('heading', { name: /Измени задача/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/teacher/assignments/19/edit');

  const generalInfoSection = screen.getByText(/Општи информации/i).closest('.task-detail-block');
  expect(generalInfoSection).not.toBeNull();
  await userEvent.clear(within(generalInfoSection).getByLabelText(/^Наслов$/i));
  await userEvent.type(within(generalInfoSection).getByLabelText(/^Наслов$/i), 'Zbir do 20');
  await userEvent.clear(within(generalInfoSection).getByLabelText(/Опис/i));
  await userEvent.type(within(generalInfoSection).getByLabelText(/Опис/i), 'sobiranje do 20');

  const firstStepCard = screen.getByText(/^Чекор 1$/i).closest('section');
  expect(firstStepCard).not.toBeNull();
  await userEvent.clear(within(firstStepCard).getByLabelText(/Наслов на чекор/i));
  await userEvent.type(within(firstStepCard).getByLabelText(/Наслов на чекор/i), 'Zbir do 20');
  await userEvent.clear(within(firstStepCard).getByLabelText(/^Содржина$/i));
  await userEvent.type(within(firstStepCard).getByLabelText(/^Содржина$/i), 'sobiranje do 20');
  await userEvent.click(screen.getByRole('button', { name: /Зачувај промени/i }));

  expect(await screen.findByText(/Задачата е успешно изменета./i)).toBeInTheDocument();
  expect(await screen.findAllByText(/Zbir do 20/i)).not.toHaveLength(0);
  expect(screen.getByText(/sobiranje do 20/i)).toBeInTheDocument();
  expect(updatedSteps).toHaveLength(1);
  expect(updatedSteps[0].title).toBe('Zbir do 20');
  expect(updatedSteps[0].content).toBe('sobiranje do 20');
}, 15000);

test('teacher can restore the students page from a direct teacher path', async () => {
  installTeacherRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');
  window.history.pushState({}, '', '/teacher/students');

  render(<App />);

  expect(await screen.findByRole('heading', { name: /^Ученици$/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/teacher/students');
});

test('teacher announcement for a classroom requires choosing a class', async () => {
  installTeacherRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getAllByRole('button', { name: /^Објави$/i })[0]);
  await userEvent.type(screen.getByLabelText(/Наслов/i), 'Важно известување');
  await userEvent.type(screen.getByLabelText(/Содржина/i), 'Ова е за еден клас.');
  await userEvent.selectOptions(screen.getByLabelText(/Публика/i), 'classroom');
  await userEvent.click(screen.getByRole('button', { name: /Креирај објава/i }));

  expect(
    await screen.findByText(/Одбери клас за објава на ниво на клас./i)
  ).toBeInTheDocument();

  await userEvent.selectOptions(screen.getByLabelText(/Одбери клас/i), '1');
  await userEvent.click(screen.getByRole('button', { name: /Креирај објава/i }));

  expect(await screen.findByText(/Објавата е успешно креирана./i)).toBeInTheDocument();
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

  const homeworkSection = screen.getByRole('heading', { name: /Сите задачи/i }).closest('section');
  expect(homeworkSection).not.toBeNull();
  await userEvent.click(within(homeworkSection).getAllByRole('button', { name: /^Отвори$/i })[0]);
  expect(await screen.findByText(/Детали за задача/i)).toBeInTheDocument();
  expect(window.location.pathname).toMatch(/^\/assignments\/[^/]+$/);

  expect(screen.queryByText(/Белешки од наставник/i)).not.toBeInTheDocument();
  expect(screen.getByText(/Јована Георгиева/i)).toBeInTheDocument();
  expect(screen.getByText(/PDF упатство/i)).toBeInTheDocument();
  expect(screen.getByText(/Издвои 3 клучни поими од лекцијата/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Прегледано/i)).not.toHaveLength(0);
  expect(screen.getByText(/Задачата е прегледана/i)).toBeInTheDocument();
  expect(screen.getByText(/Поени: 92.0 \/ 100/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Освоени поени: 92.0 \/ 100/i)).toBeInTheDocument();
  expect(screen.getByText(/Коментар од наставник/i)).toBeInTheDocument();
  expect(screen.getByText(/Одлично објаснето и јасно решение\./i)).toBeInTheDocument();
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

test('reopening a submitted assignment loads the saved student answer from assignment details', async () => {
  installStudentRoutes({
    assignment: {
      ...studentCheckedAssignmentPayload(),
      submission: {
        id: 51,
        status: 'submitted',
        started_at: '2026-03-15T01:15:17.238Z',
        submitted_at: '2026-03-15T01:15:51.681Z',
        total_score: null,
        late: false,
      },
    },
    assignmentDetails: {
      ...studentCheckedAssignmentPayload(),
      submission: {
        id: 51,
        status: 'submitted',
        started_at: '2026-03-15T01:15:17.238Z',
        submitted_at: '2026-03-15T01:15:51.681Z',
        total_score: null,
        late: false,
        step_answers: [
          {
            id: 1,
            assignment_step_id: 21,
            answer_text: 'x = 5',
            status: 'correct',
          },
        ],
      },
    },
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getByRole('button', { name: /^Продолжи$/i }));

  expect(await screen.findByText(/Твој одговор/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole('textbox')).toHaveValue('x = 5');
  });
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

  expect(await screen.findAllByText(/Чекор 1 од 2/i)).not.toHaveLength(0);
  expect(screen.getByText(/Тек на чекори/i)).toBeInTheDocument();
  expect(screen.getByText(/1\. Реши равенка/i)).toBeInTheDocument();
  expect(screen.getByText(/2\. Објасни ја постапката/i)).toBeInTheDocument();
  expect(await screen.findByText(/Проверка: Автоматска проверка/i)).toBeInTheDocument();
  expect(screen.getByText(/2x \+ 3 = 13/i)).toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox'), 'x = 5');
  await userEvent.click(screen.getByRole('button', { name: /^Провери$/i }));

  expect(
    await screen.findByText(/Точно. Чекорот е автоматски проверен./i)
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Следен чекор/i }));
  expect(await screen.findAllByText(/Чекор 2 од 2/i)).not.toHaveLength(0);
  expect(await screen.findByText(/Проверка: Потребен преглед/i)).toBeInTheDocument();

  await userEvent.type(
    screen.getByRole('textbox'),
    'Прво одземав 3, потоа поделив со 2.'
  );
  await userEvent.click(screen.getByRole('button', { name: /^Провери$/i }));

  expect(
    await screen.findByText(
      /Одговорот е зачуван. Чекорот треба да го прегледа наставник./i
    )
  ).toBeInTheDocument();
  expect(await screen.findByText(/Статус на чекор: Одговорено/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Поднеси/i }));

  expect(await screen.findByRole('heading', { name: /Успешно предадено/i })).toBeInTheDocument();
  expect(await screen.findByText(/Задачата е успешно завршена./i)).toBeInTheDocument();
  expect(await screen.findByText(/Резиме на поднесување/i)).toBeInTheDocument();
  expect(await screen.findByText(/Поднесени одговори/i)).toBeInTheDocument();
  expect(screen.getByText(/x = 5/i)).toBeInTheDocument();
  expect(screen.getByText(/Прво одземав 3, потоа поделив со 2\./i)).toBeInTheDocument();

  confirmSpy.mockRestore();
});

test('student can open AI Tutor sidebar and use up to 3 AI assistances per assignment', async () => {
  const createdAiMessages = [];
  installStudentRoutes({
    assignment: studentCheckedAssignmentPayload(),
    onAiMessageCreate: (payload) => createdAiMessages.push(payload),
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getByRole('button', { name: /^Продолжи$/i }));
  await screen.findByText(/Твој одговор/i);

  await userEvent.click(screen.getByRole('button', { name: /AI Tutor \(0\/3\)/i }));

  expect(await screen.findByText(/Помош за тековниот чекор/i)).toBeInTheDocument();
  const aiSidebar = screen.getByLabelText('AI Tutor', { selector: 'aside' });
  expect(
    within(aiSidebar).getByText(
      (_, node) =>
        node?.classList?.contains('ai-tutor-counter') &&
        node.textContent?.includes('AI помош: 0/3')
    )
  ).toBeInTheDocument();

  const aiInput = screen.getByLabelText(/Прашање за AI tutor/i);
  await waitFor(() => {
    expect(aiInput).not.toBeDisabled();
  });

  await userEvent.type(aiInput, 'Како да почнам?');
  await userEvent.click(screen.getByRole('button', { name: /Испрати прашање/i }));
  expect(await screen.findByText(/Фокусирај се на чекорот 21/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(
      within(aiSidebar).getByText(
        (_, node) =>
        node?.classList?.contains('ai-tutor-counter') &&
        node.textContent?.includes('AI помош: 1/3')
      )
    ).toBeInTheDocument();
    expect(aiInput).not.toBeDisabled();
  });

  await userEvent.type(aiInput, 'Што е првиот чекор?');
  await userEvent.click(screen.getByRole('button', { name: /Испрати прашање/i }));
  await waitFor(() => {
    expect(
      within(aiSidebar).getByText(
        (_, node) =>
        node?.classList?.contains('ai-tutor-counter') &&
        node.textContent?.includes('AI помош: 2/3')
      )
    ).toBeInTheDocument();
    expect(aiInput).not.toBeDisabled();
  });

  await userEvent.type(aiInput, 'Како да проверам дали е точно?');
  await userEvent.click(screen.getByRole('button', { name: /Испрати прашање/i }));
  await waitFor(() => {
    expect(
      within(aiSidebar).getByText(
        (_, node) =>
          node?.classList?.contains('ai-tutor-counter') &&
          node.textContent?.includes('AI помош: 3/3')
      )
    ).toBeInTheDocument();
  });
  expect(
    await screen.findByText(/Го достигна лимитот од 3 AI помоши за оваа задача./i)
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Испрати прашање/i })).toBeDisabled();

  expect(createdAiMessages).toHaveLength(3);
  expect(createdAiMessages.every((payload) => payload.metadata.assignment_step_id === 21)).toBe(
    true
  );
});

test('student sees AI tutor thinking bubble while waiting for the assistant reply', async () => {
  let resolveAiResponse;
  installStudentRoutes({
    assignment: studentCheckedAssignmentPayload(),
    onAiMessageResponse: (responsePayload) =>
      new Promise((resolve) => {
        resolveAiResponse = () => resolve(responsePayload);
      }),
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Следно за тебе/i);

  await userEvent.click(screen.getByRole('button', { name: /^Продолжи$/i }));
  await screen.findByText(/Твој одговор/i);
  await userEvent.click(screen.getByRole('button', { name: /AI Tutor \(0\/3\)/i }));
  const aiSidebar = await screen.findByLabelText('AI Tutor', { selector: 'aside' });

  const aiInput = await screen.findByLabelText(/Прашање за AI tutor/i);
  await waitFor(() => {
    expect(aiInput).not.toBeDisabled();
  });

  await userEvent.type(aiInput, 'Како да почнам?');
  await userEvent.click(screen.getByRole('button', { name: /Испрати прашање/i }));

  expect(within(aiSidebar).getAllByText('Како да почнам?').length).toBeGreaterThan(0);
  expect(await within(aiSidebar).findByText(/AI Tutor размислува/i)).toBeInTheDocument();

  resolveAiResponse();

  expect(await screen.findByText(/Фокусирај се на чекорот 21/i)).toBeInTheDocument();
});

test('student dashboard shows the quiz and games quick access card', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);

  expect(await screen.findByRole('heading', { name: /Краток вечерен предизвик за учење/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Отвори квиз/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Види игри/i })).toBeInTheDocument();
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
  expect(window.location.pathname).toBe('/homework');

  await userEvent.click(screen.getByRole('button', { name: /^Задачи$/i }));
  expect(
    await screen.findAllByText(/Македонски јазик - 7-A Домашна задача 1/i)
  ).not.toHaveLength(0);
  expect(screen.getByText(/Резултат: 92.0/i)).toBeInTheDocument();
  expect(window.location.pathname).toBe('/assignments');

  await userEvent.click(screen.getByRole('button', { name: /^Известувања$/i }));
  expect(await screen.findByText(/Нова домашна задача/i)).toBeInTheDocument();
  expect(window.location.pathname).toBe('/notifications');
  await userEvent.click(await screen.findByRole('button', { name: /Прочитано/i }));
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /Прочитано/i })).not.toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: /^Профил$/i }));
  expect(await screen.findByRole('heading', { name: /Присуство/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Поставки/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Значки и награди/i })).toBeInTheDocument();
  expect(screen.getByText(/Прва победа/i)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /AI сесии/i })).not.toBeInTheDocument();
  expect(window.location.pathname).toBe('/profile');
});

test('student can restore notifications page from a direct path', async () => {
  installStudentRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'student-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'student');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');
  window.history.pushState({}, '', '/notifications');

  render(<App />);

  expect(await screen.findByText(/Нова домашна задача/i)).toBeInTheDocument();
  expect(window.location.pathname).toBe('/notifications');
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
      onBackToDetails={jest.fn()}
      onBackToDashboard={jest.fn()}
      onCompleteTask={jest.fn()}
      onSkipTask={jest.fn()}
      onNextTask={jest.fn()}
      onGoToNextStep={jest.fn()}
      getNextTaskId={() => null}
      draft={{ answer: '1008-1012', feedback: null }}
      onDraftAnswerChange={jest.fn()}
      onDraftFeedbackChange={onDraftFeedbackChange}
      onTaskCompleted={onTaskCompleted}
    />
  );

  await userEvent.click(screen.getByRole('button', { name: /^Провери$/i }));

  expect(onDraftFeedbackChange).toHaveBeenCalledWith({
    type: 'success',
    message: 'Одговорот е зачуван. Оваа задача нема автоматска проверка.',
  });
  expect(onTaskCompleted).not.toHaveBeenCalled();
});

test('non-manual backend step does not show teacher-review feedback for neutral save results', async () => {
  const onDraftFeedbackChange = jest.fn();
  const onSaveStepAnswer = jest.fn().mockResolvedValue({
    stepAnswer: {
      assignmentStepId: 'regex-step-1',
      answerText: 'x = 15',
      status: 'answered',
      statusLabel: 'Одговорено',
    },
  });

  render(
    <StudentWorkspacePage
      theme="dark"
      onToggleTheme={jest.fn()}
      tasks={[
        {
          id: 'regex-task-1',
          title: 'Математика',
          status: TASK_STATUS.IN_PROGRESS,
          hint: 'x = 10',
          steps: [
            {
              id: 'regex-step-1',
              title: 'Равенка',
              content: '43 + 55 = x',
              prompt: 'Најди го x во равенката.',
              evaluationMode: 'regex',
              evaluationModeLabel: 'Автоматска проверка по образец',
            },
          ],
          currentStep: {
            id: 'regex-step-1',
            title: 'Равенка',
            content: '43 + 55 = x',
            prompt: 'Најди го x во равенката.',
            evaluationMode: 'regex',
            evaluationModeLabel: 'Автоматска проверка по образец',
          },
          submission: {
            id: 'sub-1',
            stepAnswers: [
              {
                assignmentStepId: 'regex-step-1',
                answerText: 'x = 15',
                status: 'answered',
                statusLabel: 'Одговорено',
              },
            ],
          },
        },
      ]}
      activeTask={{
        id: 'regex-task-1',
        title: 'Математика',
        status: TASK_STATUS.IN_PROGRESS,
        placeholder: 'Внеси одговор',
        hint: 'x = 10',
        steps: [
          {
            id: 'regex-step-1',
            title: 'Равенка',
            content: '43 + 55 = x',
            prompt: 'Најди го x во равенката.',
            evaluationMode: 'regex',
            evaluationModeLabel: 'Автоматска проверка по образец',
          },
        ],
        currentStep: {
          id: 'regex-step-1',
          title: 'Равенка',
          content: '43 + 55 = x',
          prompt: 'Најди го x во равенката.',
          evaluationMode: 'regex',
          evaluationModeLabel: 'Автоматска проверка по образец',
        },
        submission: {
          id: 'sub-1',
          stepAnswers: [
            {
              assignmentStepId: 'regex-step-1',
              answerText: 'x = 15',
              status: 'answered',
              statusLabel: 'Одговорено',
            },
          ],
        },
      }}
      onBackToDetails={jest.fn()}
      onBackToDashboard={jest.fn()}
      onCompleteTask={jest.fn()}
      onSkipTask={jest.fn()}
      onNextTask={jest.fn()}
      onGoToNextStep={jest.fn()}
      getNextTaskId={() => null}
      draft={{ stepId: 'regex-step-1', answer: 'x = 15', feedback: null }}
      onDraftAnswerChange={jest.fn()}
      onDraftFeedbackChange={onDraftFeedbackChange}
      onTaskCompleted={jest.fn()}
      onSaveStepAnswer={onSaveStepAnswer}
    />
  );

  expect(screen.getByText(/Статус на чекор: Зачувано/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Провери$/i }));

  await waitFor(() => {
    expect(onDraftFeedbackChange).toHaveBeenCalledWith({
      type: 'info',
      message: 'Одговорот е зачуван. Автоматската проверка не врати резултат.',
    });
  });
  expect(onDraftFeedbackChange).not.toHaveBeenCalledWith({
    type: 'success',
    message: 'Одговорот е зачуван. Чекорот треба да го прегледа наставник.',
  });
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

test('teacher can filter students by class and open a submission review page', async () => {
  installTeacherRoutes();
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getByRole('button', { name: /^Ученици$/i }));
  expect(await screen.findByRole('heading', { name: /^Ученици$/i })).toBeInTheDocument();

  const classSelect = screen.getByLabelText(/^Клас$/i);
  expect(classSelect).toHaveValue('1');
  expect(screen.getByText(/Najdi go zbirot/i)).toBeInTheDocument();
  expect(screen.queryByText(/Историја - Домашна задача 1/i)).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Марија Стојанова/i }));
  expect(await screen.findByText(/Профил на ученик/i)).toBeInTheDocument();
  expect(await screen.findByText(/student045@edu.mk/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Отвори предавање/i }));
  expect(await screen.findByRole('heading', { name: /Преглед на поднесување/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Прашање \/ равенка/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Одговор на ученик/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Точен одговор/i })).toBeInTheDocument();
  expect(screen.getByText(/43 \+ 55 = x/i)).toBeInTheDocument();
  expect(screen.getAllByText(/x = 98/i)).not.toHaveLength(0);
  expect(decodeURIComponent(window.location.pathname)).toBe(
    '/teacher/submissions/оу-браќа-миладиновци/7-a/марија-стојанова/28'
  );

  await userEvent.clear(screen.getByLabelText(/^Поени$/i));
  await userEvent.type(screen.getByLabelText(/^Поени$/i), '10');
  await userEvent.type(screen.getByLabelText(/^Коментар$/i), 'Одлично решено.');
  await userEvent.click(screen.getByRole('button', { name: /Зачувај оценка/i }));

  expect(await screen.findByText(/Оценката е успешно зачувана./i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Измени оценка/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Зачувај оценка/i })).not.toBeInTheDocument();
});

test('teacher submission review renders student answers from alternate payload shapes', async () => {
  installTeacherRoutes({
    teacherStudent45: {
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
        email: 'student045@edu.mk',
      },
      classrooms: [{ id: 1, name: '7-A' }],
      subjects: [{ id: 6, name: 'Македонски јазик', current_grade: '5', missing_assignments: 0 }],
      recent_submissions: [
        {
          id: 301,
          submission_id: 301,
          assignment_id: 28,
          assignment_title: 'Najdi go zbirot',
          classroom_id: 1,
          classroom_name: '7-A',
          status: 'submitted',
          submitted_at: '2026-03-15T08:15:00.000Z',
          total_score: null,
          feedback: '',
          stepAnswers: [
            {
              id: 1,
              assignmentStepId: 67,
              answer: 'x = 98',
              status: 'correct',
              correctAnswer: 'x = 98',
            },
          ],
        },
      ],
    },
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getByRole('button', { name: /^Ученици$/i }));
  await screen.findByRole('heading', { name: /^Ученици$/i });
  await userEvent.click(screen.getByRole('button', { name: /Марија Стојанова/i }));
  await screen.findByText(/Профил на ученик/i);
  await userEvent.click(screen.getByRole('button', { name: /Отвори предавање/i }));

  expect(await screen.findByRole('heading', { name: /Преглед на поднесување/i })).toBeInTheDocument();
  expect(screen.getByText(/43 \+ 55 = x/i)).toBeInTheDocument();
  expect(screen.getAllByText(/x = 98/i)).not.toHaveLength(0);
  expect(screen.queryByText(/^x = 5$/i)).not.toBeInTheDocument();
});

test('teacher submission review renders answers from nested submission payloads', async () => {
  installTeacherRoutes({
    teacherStudent45: {
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
        email: 'student045@edu.mk',
      },
      classrooms: [{ id: 1, name: '7-A' }],
      subjects: [{ id: 6, name: 'Македонски јазик', current_grade: '5', missing_assignments: 0 }],
      submissions: [
        {
          id: 301,
          assignment_id: 28,
          classroom_id: 1,
          classroom_name: '7-A',
          status: 'submitted',
          submitted_at: '2026-03-15T08:15:00.000Z',
          total_score: null,
          assignment: {
            id: 28,
            title: 'Najdi go zbirot',
          },
          submission: {
            id: 301,
            step_answers: [
              {
                id: 1,
                assignment_step: { id: 67 },
                answer_text: 'x = 98',
                status: 'correct',
              },
            ],
          },
        },
      ],
    },
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getByRole('button', { name: /^Ученици$/i }));
  await screen.findByRole('heading', { name: /^Ученици$/i });
  await userEvent.click(screen.getByRole('button', { name: /Марија Стојанова/i }));
  await screen.findByText(/Профил на ученик/i);
  await userEvent.click(screen.getByRole('button', { name: /Отвори предавање/i }));

  expect(await screen.findByRole('heading', { name: /Преглед на поднесување/i })).toBeInTheDocument();
  expect(screen.getByText(/43 \+ 55 = x/i)).toBeInTheDocument();
  expect(screen.getAllByText(/x = 98/i)).not.toHaveLength(0);
});

test('teacher submission review loads step answers from submission details when student summary lacks them', async () => {
  installTeacherRoutes({
    teacherStudent45: {
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
        email: 'student045@edu.mk',
      },
      classrooms: [{ id: 1, name: '7-A' }],
      subjects: [{ id: 6, name: 'Македонски јазик', current_grade: '5', missing_assignments: 0 }],
      submissions: [
        {
          id: 301,
          assignment_id: 28,
          classroom_id: 1,
          classroom_name: '7-A',
          status: 'submitted',
          submitted_at: '2026-03-15T08:15:00.000Z',
          total_score: null,
          assignment: {
            id: 28,
            title: 'Najdi go zbirot',
          },
        },
      ],
    },
    teacherReviewSubmission: {
      id: 301,
      status: 'submitted',
      submitted_at: '2026-03-15T08:15:00.000Z',
      reviewed_at: null,
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
      },
      assignment: {
        id: 28,
        title: 'Najdi go zbirot',
        assignment_type: 'step_by_step',
        due_at: '2026-03-20T00:00:00.000Z',
        subject: { id: 6, name: 'Македонски јазик' },
        classroom: { id: 1, name: '7-A' },
        teacher: { id: 10, full_name: 'Јована Георгиева' },
      },
      steps: [
        {
          id: 67,
          position: 1,
          title: 'Реши равенка',
          content: '43 + 55 = x',
          prompt: 'Најди го x во равенката.',
          example_answer: 'x = 98',
          step_type: 'text',
          required: true,
          evaluation_mode: 'regex',
          metadata: {},
          content_json: [],
          answer_keys: [{ id: 91, value: '^x\\s*=\\s*98$', position: 1, metadata: {} }],
        },
      ],
      step_answers: [
        {
          id: 1,
          assignment_step_id: 67,
          answer_text: 'x = 98',
          status: 'correct',
        },
      ],
      grade: {
        id: 0,
        score: null,
        feedback: '',
        graded_at: null,
      },
    },
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getByRole('button', { name: /^Ученици$/i }));
  await screen.findByRole('heading', { name: /^Ученици$/i });
  await userEvent.click(screen.getByRole('button', { name: /Марија Стојанова/i }));
  await screen.findByText(/Профил на ученик/i);
  await userEvent.click(screen.getByRole('button', { name: /Отвори предавање/i }));

  expect(await screen.findByRole('heading', { name: /Преглед на поднесување/i })).toBeInTheDocument();
  expect(screen.getByText(/43 \+ 55 = x/i)).toBeInTheDocument();
  expect(screen.getAllByText(/x = 98/i)).not.toHaveLength(0);
});

test('teacher submission review shows saved grade in read-only mode until edit is requested', async () => {
  installTeacherRoutes({
    teacherStudent45: {
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
        email: 'student045@edu.mk',
      },
      classrooms: [{ id: 1, name: '7-A' }],
      subjects: [{ id: 6, name: 'Македонски јазик', current_grade: '5', missing_assignments: 0 }],
      recent_submissions: [
        {
          id: 301,
          submission_id: 301,
          assignment_id: 28,
          assignment_title: 'Najdi go zbirot',
          classroom_id: 1,
          classroom_name: '7-A',
          status: 'reviewed',
          submitted_at: '2026-03-15T08:15:00.000Z',
          total_score: '10',
          feedback: 'Одлично решено.',
        },
      ],
    },
    teacherReviewSubmission: {
      id: 301,
      status: 'reviewed',
      submitted_at: '2026-03-15T08:15:00.000Z',
      reviewed_at: '2026-03-15T08:20:00.000Z',
      student: {
        id: 45,
        full_name: 'Марија Стојанова',
      },
      assignment: {
        id: 28,
        title: 'Najdi go zbirot',
        assignment_type: 'step_by_step',
        due_at: '2026-03-20T00:00:00.000Z',
        subject: { id: 6, name: 'Македонски јазик' },
        classroom: { id: 1, name: '7-A' },
        teacher: { id: 10, full_name: 'Јована Георгиева' },
      },
      steps: [
        {
          id: 67,
          position: 1,
          title: 'Реши равенка',
          content: '43 + 55 = x',
          prompt: 'Најди го x во равенката.',
          example_answer: 'x = 5',
          step_type: 'text',
          required: true,
          evaluation_mode: 'regex',
          metadata: {},
          content_json: [],
          answer_keys: [{ id: 91, value: '^x\\s*=\\s*98$', position: 1, metadata: {} }],
        },
      ],
      step_answers: [
        {
          id: 1,
          assignment_step_id: 67,
          answer_text: 'x = 98',
          status: 'correct',
        },
      ],
      grade: {
        id: 17,
        score: '10.0',
        feedback: 'Одлично решено.',
        graded_at: '2026-03-15T08:20:00.000Z',
      },
    },
  });
  window.localStorage.setItem(STORAGE_KEYS.token, 'teacher-token');
  window.localStorage.setItem(STORAGE_KEYS.role, 'teacher');
  window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  render(<App />);
  await screen.findByText(/Наставничка контролна табла/i);

  await userEvent.click(screen.getByRole('button', { name: /^Ученици$/i }));
  await screen.findByRole('heading', { name: /^Ученици$/i });
  await userEvent.click(screen.getByRole('button', { name: /Марија Стојанова/i }));
  await screen.findByText(/Профил на ученик/i);
  await userEvent.click(screen.getByRole('button', { name: /Отвори предавање/i }));

  expect(await screen.findByRole('button', { name: /Измени оценка/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Зачувај оценка/i })).not.toBeInTheDocument();
  expect(screen.getByText(/Оценката е зачувана/i)).toBeInTheDocument();
  expect(screen.getByText(/Макс. поени: 10/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Измени оценка/i }));

  expect(await screen.findByRole('button', { name: /Зачувај оценка/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/^Поени$/i)).toHaveValue(10);
  expect(screen.getByLabelText(/^Коментар$/i)).toHaveValue('Одлично решено.');
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
  expect(window.location.pathname).toBe('/teacher/announcements');
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
  expect(window.location.pathname).toBe('/teacher/attendance');
  expect(screen.getByText(/Нема записи за присуство/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Извештаи$/i }));
  expect(
    await screen.findByRole('heading', { name: /Извештаи по клас/i })
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe('/teacher/reports');
  expect(screen.getByText(/Просечна оценка/i)).toBeInTheDocument();
  expect(screen.getByText(/Марија Стојанова/i)).toBeInTheDocument();
});
