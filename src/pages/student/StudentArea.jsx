import { useEffect, useMemo, useRef, useState } from 'react';
import StudentDashboardPage from '../StudentDashboardPage';
import StudentWorkspacePage from '../StudentWorkspacePage';
import StudentCalendarPage from '../StudentCalendarPage';
import StudentProfilePage from '../StudentProfilePage';
import TaskDetailsPage from '../TaskDetailsPage';
import TaskCompletionPage from '../TaskCompletionPage';
import StudentNotificationsPage from '../StudentNotificationsPage';
import { MOCK_TASKS, TASK_STATUS } from '../../data/mockTasks';
import { api } from '../../services/apiClient';

const PROJECTS = [
  {
    title: 'Проект по информатика',
    note: 'Додади валидација на формата и кратка документација.',
    progress: 72,
  },
  {
    title: 'Истражување по биологија',
    note: 'Собери уште 2 извори и додади заклучок.',
    progress: 45,
  },
];

const TODAY_ITEMS = [
  '08:00 - Математика',
  'Домашна по биологија до 20:00',
  'Потсетник: подготви се за квиз по историја',
  'Провери коментар од наставник по англиски',
];

const ANNOUNCEMENTS = [
  'Нов коментар од наставник по математика',
  'Објавена оценка по англиски',
  'Промена во распоред за среда',
  'Нова домашна задача по историја',
];

const NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Нова домашна задача',
    detail: 'Додадена е домашна по математика.',
    time: 'Пред 10 мин.',
  },
  {
    id: 'n2',
    title: 'Коментар од наставник',
    detail: 'Провери ја забелешката за англиски.',
    time: 'Пред 1 час',
  },
  {
    id: 'n3',
    title: 'Објавена оценка',
    detail: 'Историја: 5',
    time: 'Вчера',
  },
  {
    id: 'n4',
    title: 'Потсетник за рок',
    detail: 'Рокот за проект по информатика е утре.',
    time: 'Вчера',
  },
];

const DEFAULT_PROFILE = {
  fullName: 'Андреј Костов',
  initials: 'АК',
  className: 'IX-2',
  school: 'ОУ Браќа Миладиновци',
  email: 'andrej.kostov@school.mk',
  studentId: 'ID-9241',
  mentor: 'проф. Марија Стојанова',
};

const DEFAULT_SUBJECT_PERFORMANCE = [
  { name: 'Математика', score: 92 },
  { name: 'Македонски јазик', score: 84 },
  { name: 'Англиски јазик', score: 95 },
  { name: 'Историја', score: 76 },
  { name: 'Биологија', score: 88 },
  { name: 'Информатика', score: 97 },
];

const DEFAULT_WEEKLY_TREND = [
  { day: 'Пон', progress: 55 },
  { day: 'Вто', progress: 62 },
  { day: 'Сре', progress: 74 },
  { day: 'Чет', progress: 68 },
  { day: 'Пет', progress: 83 },
  { day: 'Саб', progress: 48 },
  { day: 'Нед', progress: 64 },
];

const DEFAULT_RECENT_ACTIVITIES = [
  'Предадена домашна по математика',
  'Завршен квиз по англиски',
  'Нов коментар од наставник',
  'Добиена оценка по историја',
  'Одлична работа оваа недела',
];

function nextTaskFromList(tasks) {
  return (
    tasks.find((task) => task.status === TASK_STATUS.IN_PROGRESS) ||
    tasks.find((task) => task.status === TASK_STATUS.NOT_STARTED) ||
    tasks.find((task) => task.status === TASK_STATUS.SKIPPED) ||
    null
  );
}

function mapStatusToStudent(status) {
  if (!status) {
    return TASK_STATUS.NOT_STARTED;
  }
  if (['in_progress', 'working'].includes(status)) {
    return TASK_STATUS.IN_PROGRESS;
  }
  if (['submitted', 'reviewed', 'returned', 'completed'].includes(status)) {
    return TASK_STATUS.DONE;
  }
  if (['skipped'].includes(status)) {
    return TASK_STATUS.SKIPPED;
  }
  return TASK_STATUS.NOT_STARTED;
}

function dueCategoryFromDate(dueAt) {
  if (!dueAt) {
    return 'soon';
  }
  const now = new Date();
  const dueDate = new Date(dueAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  if (dueDay.getTime() < today.getTime()) {
    return 'overdue';
  }
  if (dueDay.getTime() === today.getTime()) {
    return 'today';
  }
  if (dueDay.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  }
  return 'soon';
}

function formatDueText(dueAt) {
  if (!dueAt) {
    return 'Наскоро';
  }
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) {
    return 'Наскоро';
  }
  return date.toLocaleString('mk-MK', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function mapAssignmentTypeLabel(type) {
  if (!type) {
    return 'домашна';
  }

  if (type === 'homework') {
    return 'домашна';
  }
  if (type === 'project') {
    return 'проект';
  }
  if (type === 'quiz') {
    return 'квиз';
  }
  if (type === 'test') {
    return 'тест';
  }
  if (type === 'exercise') {
    return 'вежба';
  }

  return String(type);
}

function mapAssignmentToTask(assignment, fallbackTask, index) {
  const dueAt = assignment?.due_at || assignment?.dueAt;
  const resourcesSource =
    assignment?.assignment_resources ||
    assignment?.resources ||
    assignment?.resource_blocks ||
    assignment?.attachments ||
    [];
  const steps = Array.isArray(assignment?.steps)
    ? [...assignment.steps]
        .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
        .map((step) => ({
        id: String(step.id ?? `step-${index}`),
        position: step.position ?? index + 1,
        title: step.title || `Чекор ${index + 1}`,
        content: step.content || step.prompt || '',
        prompt: step.prompt || step.content || '',
        stepType: step.step_type || 'text',
        stepTypeLabel:
          step.step_type === 'reading'
            ? 'Читање'
            : step.step_type === 'text'
              ? 'Текст'
              : step.step_type || 'Чекор',
        required: step.required !== false,
        estimatedMinutes: step.metadata?.estimated_minutes ?? null,
        resourceUrl: step.resource_url || '',
        exampleAnswer: step.example_answer || '',
        contentBlocks: Array.isArray(step.content_json) ? step.content_json : [],
      }))
    : [];
  const readingPassage = steps
    .filter((step) => step.stepType === 'reading' && step.content)
    .map((step) => step.content);
  const submissionStatus = assignment?.submission?.status || assignment?.submission_status || assignment?.status;

  return {
    id: String(assignment?.id ?? fallbackTask?.id ?? `api-task-${index + 1}`),
    subject:
      assignment?.subject_name ||
      assignment?.subject?.name ||
      fallbackTask?.subject ||
      'Предмет',
    title: assignment?.title || fallbackTask?.title || `Задача ${index + 1}`,
    type: mapAssignmentTypeLabel(
      assignment?.assignment_type ||
        (steps.length > 0 ? 'step_by_step' : fallbackTask?.type) ||
        'homework'
    ),
    instructions:
      assignment?.instructions || assignment?.description || fallbackTask?.instructions || '',
    readingPassage: readingPassage.length > 0 ? readingPassage : fallbackTask?.readingPassage || [],
    placeholder: fallbackTask?.placeholder || 'Внеси одговор',
    hint: fallbackTask?.hint || 'Провери ги инструкциите и обиди се повторно.',
    expectedAnswers: fallbackTask?.expectedAnswers || ['demo'],
    difficulty: fallbackTask?.difficulty || 'Средно',
    dueText: formatDueText(dueAt),
    dueCategory: dueCategoryFromDate(dueAt),
    description: assignment?.description || '',
    teacherNotes: assignment?.teacher_notes || '',
    maxPoints:
      assignment?.max_points !== undefined && assignment?.max_points !== null
        ? String(assignment.max_points)
        : '',
    publishedAt: assignment?.published_at ? formatDueText(assignment.published_at) : '',
    teacherName: assignment?.teacher?.full_name || '',
    classroomName: assignment?.classroom?.name || '',
    resources: Array.isArray(resourcesSource)
      ? [...resourcesSource]
          .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
          .map((resource, resourceIndex) => ({
          id: String(resource.id ?? `resource-${resourceIndex}`),
          title: resource.title || resource.file_name || `Материјал ${resourceIndex + 1}`,
          resourceType: resource.resource_type || resource.type || 'file',
          fileUrl: resource.file_url || resource.url || '',
          externalUrl: resource.external_url || '',
          embedUrl: resource.embed_url || '',
          description: resource.description || '',
          position: resource.position ?? resourceIndex + 1,
          isRequired: Boolean(resource.is_required),
          metadata: resource.metadata || {},
        }))
      : [],
    contentBlocks: Array.isArray(assignment?.content_json) ? assignment.content_json : [],
    steps,
    currentStep: steps[0] || null,
    submission: assignment?.submission
      ? {
          id: String(assignment.submission.id),
          status: assignment.submission.status,
          statusLabel:
            assignment.submission.status === 'reviewed'
              ? 'Прегледано'
              : assignment.submission.status === 'submitted'
                ? 'Предадено'
                : assignment.submission.status === 'in_progress'
                  ? 'Во тек'
                  : assignment.submission.status,
          startedAt: assignment.submission.started_at
            ? formatDueText(assignment.submission.started_at)
            : '',
          submittedAt: assignment.submission.submitted_at
            ? formatDueText(assignment.submission.submitted_at)
            : '',
          totalScore:
            assignment.submission.total_score !== undefined &&
            assignment.submission.total_score !== null
              ? String(assignment.submission.total_score)
              : '',
          late: Boolean(assignment.submission.late),
        }
      : null,
    status: mapStatusToStudent(submissionStatus || fallbackTask?.status),
  };
}

function mapNotification(notification) {
  return {
    id: String(notification.id),
    title: notification.title || 'Известување',
    detail: notification.message || notification.body || '',
    read: Boolean(notification.read || notification.read_at),
    time: notification.created_at
      ? new Date(notification.created_at).toLocaleString('mk-MK')
      : 'скоро',
  };
}

function getInitials(fullName) {
  if (!fullName) {
    return '?';
  }
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function mapAnnouncement(item, index) {
  const classroomName = item?.classroom?.name || item?.classroom_name;
  const subjectName = item?.subject?.name || item?.subject_name;
  const scope =
    classroomName && subjectName
      ? `${classroomName} · ${subjectName}`
      : classroomName || subjectName || item?.audience_type || '';

  return {
    id: String(item?.id ?? `announcement-${index}`),
    title: item?.title || item?.name || 'Известување',
    detail: item?.body || item?.message || '',
    scope,
    priority: item?.priority || 'normal',
    priorityLabel:
      item?.priority === 'urgent'
        ? 'Итно'
        : item?.priority === 'important'
          ? 'Важно'
          : 'Нормално',
    audienceLabel: item?.audience_type ? `Публика: ${item.audience_type}` : '',
    publishedLabel: item?.published_at
      ? new Date(item.published_at).toLocaleString('mk-MK')
      : '',
    publishedAt: item?.published_at || item?.created_at || null,
  };
}

function mapAnnouncements(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.announcements)
      ? payload.announcements
      : [];

  return list.map(mapAnnouncement);
}

function toPercentLabel(value, fallback = 'Нема податок') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return `${Math.round(numeric <= 1 ? numeric * 100 : numeric)}%`;
}

function mapPerformanceData(payload) {
  const snapshot =
    payload?.snapshot ||
    payload?.performance_snapshot ||
    payload?.student_performance_snapshot ||
    payload ||
    null;
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const snapshotData = snapshot.snapshot_data || snapshot.snapshotData || {};
  const subjectsSource =
    snapshot.subjects ||
    snapshot.subject_performance ||
    snapshotData.subjects ||
    snapshotData.subject_performance ||
    [];
  const weeklyTrendSource =
    snapshot.weekly_trend || snapshot.weeklyTrend || snapshotData.weekly_trend || [];
  const activitiesSource =
    snapshot.recent_activity || snapshot.recent_activities || snapshotData.recent_activity || [];

  return {
    averageGrade: Number(
      snapshot.average_grade ??
        snapshot.averageGrade ??
        snapshotData.average_grade ??
        snapshotData.averageGrade ??
        null
    ),
    completedAssignments:
      snapshot.completed_assignments_count ??
      snapshot.completedAssignmentsCount ??
      snapshotData.completed_assignments_count ??
      null,
    inProgressAssignments:
      snapshot.in_progress_assignments_count ??
      snapshot.inProgressAssignmentsCount ??
      snapshotData.in_progress_assignments_count ??
      null,
    overdueAssignments:
      snapshot.overdue_assignments_count ??
      snapshot.overdueAssignmentsCount ??
      snapshotData.overdue_assignments_count ??
      null,
    missedAssignments:
      snapshot.missed_assignments_count ??
      snapshot.missedAssignmentsCount ??
      snapshotData.missed_assignments_count ??
      null,
    attendanceRate: toPercentLabel(
      snapshot.attendance_rate ??
        snapshot.attendanceRate ??
        snapshotData.attendance_rate
    ),
    engagementScore: toPercentLabel(
      snapshot.engagement_score ??
        snapshot.engagementScore ??
        snapshotData.engagement_score
    ),
    streak:
      snapshot.streak_label ||
      snapshotData.streak_label ||
      (snapshotData.current_streak ? `${snapshotData.current_streak} дена` : null),
    subjects: Array.isArray(subjectsSource)
      ? subjectsSource.map((subject, index) => ({
          name: subject.name || subject.subject_name || `Предмет ${index + 1}`,
          score:
            Math.round(
              Number(
                subject.score ??
                  subject.average_grade ??
                  subject.averageGrade ??
                  subject.percent ??
                  0
              )
            ) || 0,
        }))
      : [],
    weeklyTrend: Array.isArray(weeklyTrendSource)
      ? weeklyTrendSource.map((day, index) => ({
          day: day.day || day.label || ['Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб', 'Нед'][index] || `Д${index + 1}`,
          progress:
            Math.max(
              0,
              Math.min(
                100,
                Math.round(Number(day.progress ?? day.value ?? day.percent ?? 0))
              )
            ),
        }))
      : [],
    recentActivities: Array.isArray(activitiesSource)
      ? activitiesSource.map((activity) =>
          typeof activity === 'string'
            ? activity
            : activity.label || activity.title || activity.action || 'Активност'
        )
      : [],
  };
}

function mapAiSessions(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.ai_sessions)
      ? payload.ai_sessions
      : [];

  return list.map((session, index) => ({
    id: String(session.id ?? `ai-session-${index}`),
    title: session.title || 'AI сесија',
    status: session.status || 'active',
    statusLabel:
      session.status === 'paused'
        ? 'Паузирана'
        : session.status === 'completed'
          ? 'Завршена'
          : session.status === 'archived'
            ? 'Архивирана'
            : 'Активна',
    sessionType: session.session_type || 'freeform',
    subjectName: session.subject?.name || session.subject_name || '',
    assignmentId: session.assignment_id || session.assignment?.id || null,
    lastActivityAt: session.last_activity_at || session.updated_at || session.started_at || null,
    messages: Array.isArray(session.messages) ? session.messages.map(mapAiMessage) : [],
  }));
}

function mapAiMessage(message, index) {
  return {
    id: String(message?.id ?? `ai-message-${index}`),
    role: message?.role || 'assistant',
    roleLabel:
      message?.role === 'user'
        ? 'Ти'
        : message?.role === 'system'
          ? 'Систем'
          : 'AI',
    messageType: message?.message_type || 'step',
    content: message?.content || '',
    sequenceNumber: message?.sequence_number ?? index + 1,
    createdAt: message?.created_at || null,
  };
}

function mapAttendanceRecords(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.attendance_records)
      ? payload.attendance_records
      : [];

  const records = list.map((record, index) => ({
    id: String(record?.id ?? `attendance-${index}`),
    date: record?.attendance_date || '',
    status: record?.status || 'present',
    statusLabel:
      record?.status === 'absent'
        ? 'Отсутен'
        : record?.status === 'late'
          ? 'Доцни'
          : record?.status === 'excused'
            ? 'Оправдано'
            : 'Присутен',
    classroomName: record?.classroom?.name || record?.classroom_name || '',
    subjectName: record?.subject?.name || record?.subject_name || '',
    note: record?.note || '',
  }));

  const counts = records.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return {
    records,
    summary: [
      { label: 'Присутен', value: counts.present || 0 },
      { label: 'Отсутен', value: counts.absent || 0 },
      { label: 'Доцнења', value: counts.late || 0 },
      { label: 'Оправдани', value: counts.excused || 0 },
    ],
  };
}

function mapRecentActivity(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => {
    if (typeof item === 'string') {
      return item;
    }

    const action = item?.action || item?.title || item?.label || 'Активност';
    const occurredAt = item?.occurred_at ? formatDueText(item.occurred_at) : '';
    return `${action}${occurredAt ? ` · ${occurredAt}` : ''}` || `Активност ${index + 1}`;
  });
}

function mergeDashboardHomework(currentTasks, payload) {
  const homework = Array.isArray(payload?.homework) ? payload.homework : [];
  if (homework.length === 0) {
    return currentTasks;
  }

  const byId = new Map(currentTasks.map((task) => [String(task.id), task]));
  const merged = homework.map((item, index) =>
    mapAssignmentToTask(
      {
        id: item.assignment_id || item.id,
        title: item.title,
        due_at: item.due_at,
        status: item.status,
        submission: item.submission_id
          ? {
              id: item.submission_id,
              status: item.status,
            }
          : null,
      },
      byId.get(String(item.assignment_id || item.id)) || MOCK_TASKS[index],
      index
    )
  );

  currentTasks.forEach((task) => {
    if (!byId.has(String(task.id))) {
      return;
    }
    if (!merged.some((item) => String(item.id) === String(task.id))) {
      merged.push(task);
    }
  });

  return merged;
}

function buildTodayItemsFromDashboard(payload, aiSessions) {
  const dashboardAnnouncements = mapAnnouncements(payload?.announcements || []);
  const deadlines = Array.isArray(payload?.deadlines)
    ? payload.deadlines.map((item) => `Рок: ${item.title || 'Задача'}${item.due_at ? ` · ${formatDueText(item.due_at)}` : ''}`)
    : [];
  const activityItems = mapRecentActivity(payload?.recent_activity).slice(0, 3);
  const upcomingItems = Array.isArray(payload?.upcoming_items)
    ? payload.upcoming_items.map((item) => {
        const dueAt = item.due_at || item.starts_at || item.date;
        const prefix =
          item.type === 'assignment'
            ? 'Задача'
            : item.type === 'event'
              ? 'Настан'
              : 'Потсетник';
        return `${prefix}: ${item.title || item.label || 'Без наслов'}${
          dueAt ? ` · ${formatDueText(dueAt)}` : ''
        }`;
      })
    : [...deadlines, ...activityItems];

  const activeSession = aiSessions.find((session) => session.status === 'active');
  if (activeSession) {
    upcomingItems.unshift(
      `Продолжи AI сесија: ${activeSession.title}${
        activeSession.subjectName ? ` · ${activeSession.subjectName}` : ''
      }`
    );
  }

  if (dashboardAnnouncements[0]) {
    upcomingItems.unshift(`Објава: ${dashboardAnnouncements[0].title}`);
  }

  return upcomingItems;
}

function mapProfileData({ mePayload, dashboardPayload, performanceData, aiSessions }) {
  const user = mePayload?.user || dashboardPayload?.student || {};
  const school = Array.isArray(mePayload?.schools) ? mePayload.schools[0] : null;
  const snapshotData = performanceData || {};
  const activeSession = aiSessions.find((session) => session.status === 'active');

  return {
    fullName: user.full_name || user.name || DEFAULT_PROFILE.fullName,
    initials: getInitials(user.full_name || user.name || DEFAULT_PROFILE.fullName),
    className:
      dashboardPayload?.student?.classroom_name ||
      dashboardPayload?.student?.class_name ||
      DEFAULT_PROFILE.className,
    school: school?.name || DEFAULT_PROFILE.school,
    email: user.email || DEFAULT_PROFILE.email,
    studentId:
      dashboardPayload?.student?.student_code ||
      dashboardPayload?.student?.student_id ||
      DEFAULT_PROFILE.studentId,
    mentor:
      dashboardPayload?.student?.mentor_name ||
      dashboardPayload?.student?.homeroom_teacher_name ||
      DEFAULT_PROFILE.mentor,
    aiSessionLabel: activeSession
      ? `Активна AI сесија: ${activeSession.title}`
      : snapshotData.attendanceRate
        ? `Присуство: ${snapshotData.attendanceRate}`
        : '',
  };
}

function normalizeNavTarget(target) {
  if (
    target === 'calendar' ||
    target === 'profile' ||
    target === 'notifications' ||
    target === 'homework' ||
    target === 'assignments'
  ) {
    return target;
  }
  return 'dashboard';
}

function StudentArea({ theme, onToggleTheme, onLogout }) {
  const transitionTimeoutRef = useRef(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [activeTaskId, setActiveTaskId] = useState(MOCK_TASKS[0].id);
  const [completionContext, setCompletionContext] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [performance, setPerformance] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState(DEFAULT_SUBJECT_PERFORMANCE);
  const [recentActivities, setRecentActivities] = useState(DEFAULT_RECENT_ACTIVITIES);
  const [todayItems, setTodayItems] = useState(TODAY_ITEMS);
  const [attendance, setAttendance] = useState(null);
  const [studentAiSessions, setStudentAiSessions] = useState([]);
  const [activeAiSession, setActiveAiSession] = useState(null);
  const [activeAiMessages, setActiveAiMessages] = useState([]);
  const [taskDrafts, setTaskDrafts] = useState(() =>
    Object.fromEntries(
      MOCK_TASKS.map((task) => [task.id, { answer: '', feedback: null }])
    )
  );

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) || tasks[0],
    [activeTaskId, tasks]
  );
  const nextTask = useMemo(() => {
    const dashboardNextTask = dashboardData?.next_task;
    if (dashboardNextTask) {
      const matchingTask = tasks.find(
        (task) => String(task.id) === String(dashboardNextTask.assignment_id || dashboardNextTask.id)
      );
      if (matchingTask) {
        return matchingTask;
      }

      return mapAssignmentToTask(
        {
          id: dashboardNextTask.assignment_id || dashboardNextTask.id,
          title: dashboardNextTask.title,
          due_at: dashboardNextTask.due_at,
          status: dashboardNextTask.status,
          submission: dashboardNextTask.submission_id
            ? {
                id: dashboardNextTask.submission_id,
                status: dashboardNextTask.status,
              }
            : null,
        },
        tasks[0] || MOCK_TASKS[0],
        0
      );
    }

    return nextTaskFromList(tasks);
  }, [dashboardData, tasks]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const [dashboardResult, assignmentsResult, notificationsResult] =
        await Promise.allSettled([
          api.studentDashboard(),
          api.studentAssignments(),
          api.notifications(),
        ]);
      const [meResult, announcementsResult, performanceResult, aiSessionsResult] =
        await Promise.allSettled([
          api.me(),
          api.announcements({ status: 'published' }),
          api.studentPerformance(),
          api.aiSessions(),
        ]);

      if (!isMounted) {
        return;
      }

      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value);
      }

      const mappedAiSessions =
        aiSessionsResult.status === 'fulfilled' ? mapAiSessions(aiSessionsResult.value) : [];
      const dashboardAiResume =
        dashboardResult.status === 'fulfilled' && dashboardResult.value?.ai_resume
          ? mapAiSessions([dashboardResult.value.ai_resume])
          : [];
      const mergedAiSessions =
        mappedAiSessions.length > 0 ? mappedAiSessions : dashboardAiResume;
      setStudentAiSessions(mergedAiSessions);

      const mappedAnnouncements =
        dashboardResult.status === 'fulfilled' && dashboardResult.value?.announcements
          ? mapAnnouncements(dashboardResult.value.announcements)
          : announcementsResult.status === 'fulfilled'
            ? mapAnnouncements(announcementsResult.value)
            : [];
      if (mappedAnnouncements.length > 0) {
        setAnnouncements(mappedAnnouncements);
      }

      const performancePayload =
        performanceResult.status === 'fulfilled'
          ? mapPerformanceData(performanceResult.value)
          : null;
      if (performancePayload) {
        setPerformance(performancePayload);
        if (performancePayload.subjects.length > 0) {
          setSubjectPerformance(performancePayload.subjects);
        }
        if (performancePayload.recentActivities.length > 0) {
          setRecentActivities(performancePayload.recentActivities);
        } else if (dashboardResult.status === 'fulfilled') {
          const dashboardActivities = mapRecentActivity(dashboardResult.value?.recent_activity);
          if (dashboardActivities.length > 0) {
            setRecentActivities(dashboardActivities);
          }
        }
      } else if (dashboardResult.status === 'fulfilled') {
        const dashboardActivities = mapRecentActivity(dashboardResult.value?.recent_activity);
        if (dashboardActivities.length > 0) {
          setRecentActivities(dashboardActivities);
        }
      }

      const mePayload = meResult.status === 'fulfilled' ? meResult.value : null;
      setProfile(
        mapProfileData({
          mePayload,
          dashboardPayload: dashboardResult.status === 'fulfilled' ? dashboardResult.value : null,
          performanceData: performancePayload,
          aiSessions: mergedAiSessions,
        })
      );

      const todayItemsPayload = buildTodayItemsFromDashboard(
        dashboardResult.status === 'fulfilled' ? dashboardResult.value : null,
        mergedAiSessions
      );
      if (todayItemsPayload.length > 0) {
        setTodayItems(todayItemsPayload);
      }

      if (mePayload?.user?.id) {
        const attendanceResponse = await api.studentAttendance(mePayload.user.id).catch(() => null);
        if (attendanceResponse) {
          setAttendance(mapAttendanceRecords(attendanceResponse));
        }
      }

      const assignmentsPayload =
        assignmentsResult.status === 'fulfilled'
          ? Array.isArray(assignmentsResult.value)
            ? assignmentsResult.value
            : assignmentsResult.value?.assignments || []
          : [];

      if (assignmentsPayload.length > 0) {
        const mappedTasks = assignmentsPayload.map((assignment, index) =>
          mapAssignmentToTask(assignment, MOCK_TASKS[index], index)
        );
        if (mappedTasks.length > 0) {
          setTasks(
            mergeDashboardHomework(
              mappedTasks,
              dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
            )
          );
        }
      } else if (dashboardResult.status === 'fulfilled') {
        const dashboardTasks = mergeDashboardHomework([], dashboardResult.value);
        if (dashboardTasks.length > 0) {
          setTasks(dashboardTasks);
        }
      }

      const notificationsPayload =
        notificationsResult.status === 'fulfilled'
          ? Array.isArray(notificationsResult.value)
            ? notificationsResult.value
            : notificationsResult.value?.notifications || []
          : [];
      if (notificationsPayload.length > 0) {
        const mapped = notificationsPayload.map(mapNotification);
        setNotifications(mapped);
      }
    };

    loadData().catch(() => {
      // fallback data remains from mocks
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const completedCount = tasks.filter(
    (task) => task.status === TASK_STATUS.DONE
  ).length;
  const overdueCount = tasks.filter((task) => task.dueCategory === 'overdue').length;
  const unreadCount =
    dashboardData?.notifications_unread ??
    dashboardData?.unread_notifications_count ??
    dashboardData?.stats?.unread_notifications ??
    dashboardData?.unread_count ??
    notifications.filter((notification) => !notification.read).length;
  const todayCount = tasks.filter((task) => task.dueCategory === 'today').length;
  const weeklyCount = dashboardData?.homework?.length ?? tasks.length;
  const weeklyProgress = Math.round((completedCount / Math.max(tasks.length, 1)) * 100);

  const quickStats = [
    {
      label: 'Денешни задачи',
      value: dashboardData?.deadlines?.length ?? dashboardData?.today_tasks_count ?? todayCount,
    },
    {
      label: 'Задоцнети',
      value:
        performance?.overdueAssignments ??
        dashboardData?.overdue_tasks_count ??
        overdueCount,
    },
    { label: 'Непрочитани известувања', value: unreadCount },
    {
      label: 'Оваа недела',
      value:
        performance?.completedAssignments ??
        dashboardData?.homework?.length ??
        dashboardData?.weekly_tasks_count ??
        weeklyCount,
    },
  ];

  const deadlines = Array.isArray(dashboardData?.deadlines) && dashboardData.deadlines.length > 0
    ? dashboardData.deadlines.map((item) => ({
        title: item.title || 'Задача',
        when: item.due_at ? formatDueText(item.due_at) : 'Наскоро',
        urgency:
          dueCategoryFromDate(item.due_at) === 'today'
            ? 'Денес'
            : dueCategoryFromDate(item.due_at) === 'tomorrow'
              ? 'Утре'
              : dueCategoryFromDate(item.due_at) === 'overdue'
                ? 'Задоцнето'
                : 'Наскоро',
      }))
    : tasks.map((task) => ({
        title: `${task.title} - ${task.subject}`,
        when: task.dueText,
        urgency:
          task.dueCategory === 'today'
            ? 'Денес'
            : task.dueCategory === 'tomorrow'
              ? 'Утре'
              : task.dueCategory === 'overdue'
                ? 'Задоцнето'
                : 'Наскоро',
      }));

  const transitionToPage = (nextPage) => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    setIsLoadingPage(true);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setActivePage(nextPage);
      setIsLoadingPage(false);
    }, 280);
  };

  const markTaskAsInProgressIfNeeded = (taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId &&
        (task.status === TASK_STATUS.NOT_STARTED ||
          task.status === TASK_STATUS.SKIPPED)
          ? { ...task, status: TASK_STATUS.IN_PROGRESS }
          : task
      )
    );
  };

  const openTaskDetails = (taskId) => {
    const loadDetails = async () => {
      try {
        const response = await api.studentAssignmentDetails(taskId);
        setTasks((previousTasks) =>
          previousTasks.map((task, index) =>
            task.id === String(taskId)
              ? mapAssignmentToTask(response, task || MOCK_TASKS[index], index)
              : task
          )
        );
      } catch {
        // continue with current local data
      } finally {
        setActiveTaskId(taskId);
        transitionToPage('task-details');
      }
    };
    loadDetails().catch(() => {
      setActiveTaskId(taskId);
      transitionToPage('task-details');
    });
  };

  const openWorkspace = (taskId) => {
    const linkedSession = studentAiSessions.find(
      (session) =>
        String(session.assignmentId) === String(taskId) || session.status === 'active'
    );

    if (linkedSession) {
      setActiveAiSession(linkedSession);
      if (linkedSession.messages.length > 0) {
        setActiveAiMessages(linkedSession.messages);
      } else {
        api
          .aiSessionDetails(linkedSession.id)
          .then((response) => {
            const messages = Array.isArray(response?.messages)
              ? response.messages.map(mapAiMessage)
              : [];
            setActiveAiMessages(messages);
          })
          .catch(() => {
            setActiveAiMessages([]);
          });
      }
    } else {
      setActiveAiSession(null);
      setActiveAiMessages([]);
    }

    setActiveTaskId(taskId);
    markTaskAsInProgressIfNeeded(taskId);
    transitionToPage('workspace');
  };

  const handleNavigate = (target) => {
    transitionToPage(normalizeNavTarget(target));
  };

  const handleMarkNotificationRead = (notificationId) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === String(notificationId)
          ? { ...notification, read: true }
          : notification
      )
    );

    api.markNotificationRead(notificationId).catch(() => {
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === String(notificationId)
            ? { ...notification, read: false }
            : notification
        )
      );
    });
  };

  const getNextTaskId = (fromTaskId) => {
    const currentIndex = tasks.findIndex((task) => task.id === fromTaskId);
    if (currentIndex === -1) {
      return null;
    }
    const nextTaskItem = tasks
      .slice(currentIndex + 1)
      .find(
        (task) =>
          task.status === TASK_STATUS.NOT_STARTED ||
          task.status === TASK_STATUS.IN_PROGRESS ||
          task.status === TASK_STATUS.SKIPPED
      );
    return nextTaskItem ? nextTaskItem.id : null;
  };

  const completeTask = (taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, status: TASK_STATUS.DONE } : task
      )
    );
  };

  const skipTask = (taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, status: TASK_STATUS.SKIPPED } : task
      )
    );
  };

  const updateTaskAnswer = (taskId, answer) => {
    setTaskDrafts((previous) => ({
      ...previous,
      [taskId]: {
        ...previous[taskId],
        answer,
      },
    }));
  };

  const updateTaskFeedback = (taskId, feedback) => {
    setTaskDrafts((previous) => ({
      ...previous,
      [taskId]: {
        ...previous[taskId],
        feedback,
      },
    }));
  };

  const withLoadingOverlay = (content) => (
    <>
      {content}
      {isLoadingPage ? (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-spinner" />
          <p>Се вчитува...</p>
        </div>
      ) : null}
    </>
  );

  if (activePage === 'workspace' && activeTask) {
    return withLoadingOverlay(
      <StudentWorkspacePage
        theme={theme}
        onToggleTheme={onToggleTheme}
        tasks={tasks}
        activeTask={activeTask}
        onBackToDashboard={() => transitionToPage('dashboard')}
        onCompleteTask={completeTask}
        onSkipTask={skipTask}
        onNextTask={openWorkspace}
        getNextTaskId={getNextTaskId}
        draft={taskDrafts[activeTask.id]}
        onDraftAnswerChange={(answer) => updateTaskAnswer(activeTask.id, answer)}
        onDraftFeedbackChange={(feedback) =>
          updateTaskFeedback(activeTask.id, feedback)
        }
        onTaskCompleted={(taskId, nextTaskId) => {
          setCompletionContext({ taskId, nextTaskId });
          transitionToPage('completion');
        }}
        aiSession={activeAiSession}
        aiMessages={activeAiMessages}
      />
    );
  }

  if (activePage === 'task-details' && activeTask) {
    return withLoadingOverlay(
      <TaskDetailsPage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        task={activeTask}
        onStartTask={() => openWorkspace(activeTask.id)}
        onBack={() => transitionToPage('dashboard')}
      />
    );
  }

  if (activePage === 'completion' && completionContext) {
    return withLoadingOverlay(
      <TaskCompletionPage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        task={tasks.find((item) => item.id === completionContext.taskId) || activeTask}
        hasNextTask={Boolean(completionContext.nextTaskId)}
        onNextTask={() => {
          if (completionContext.nextTaskId) {
            openWorkspace(completionContext.nextTaskId);
            return;
          }
          transitionToPage('dashboard');
        }}
        onBackHome={() => transitionToPage('dashboard')}
      />
    );
  }

  if (activePage === 'calendar') {
    return withLoadingOverlay(
      <StudentCalendarPage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        tasks={tasks}
        onOpenTask={openTaskDetails}
      />
    );
  }

  if (activePage === 'notifications') {
    return withLoadingOverlay(
      <StudentNotificationsPage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
      />
    );
  }

  if (activePage === 'homework') {
    return withLoadingOverlay(
      <div className={`dashboard-root theme-${theme}`}>
        <StudentDashboardPage
          theme={theme}
          onToggleTheme={onToggleTheme}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          activePage="homework"
          nextTask={nextTask}
          quickStats={quickStats}
          tasks={tasks.filter((task) =>
            ['домашна', 'вежба', 'чекор по чекор', 'step_by_step'].includes(task.type)
          )}
          todayItems={todayItems}
          projects={PROJECTS}
          deadlines={deadlines}
          announcements={announcements}
          completedCount={completedCount}
          weeklyProgress={weeklyProgress}
          average={performance?.averageGrade ?? 4.6}
          onOpenTask={openTaskDetails}
        />
      </div>
    );
  }

  if (activePage === 'assignments') {
    return withLoadingOverlay(
      <div className={`dashboard-root theme-${theme}`}>
        <StudentDashboardPage
          theme={theme}
          onToggleTheme={onToggleTheme}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          activePage="assignments"
          nextTask={nextTask}
          quickStats={quickStats}
          tasks={tasks}
          todayItems={todayItems}
          projects={PROJECTS}
          deadlines={deadlines}
          announcements={announcements}
          completedCount={completedCount}
          weeklyProgress={weeklyProgress}
          average={performance?.averageGrade ?? 4.6}
          onOpenTask={openTaskDetails}
        />
      </div>
    );
  }

  if (activePage === 'profile') {
    return withLoadingOverlay(
      <StudentProfilePage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        completedCount={completedCount}
        activeCount={
          performance?.inProgressAssignments ??
          tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS).length
        }
        overdueCount={performance?.overdueAssignments ?? overdueCount}
        totalTaskCount={tasks.length}
        profile={profile}
        performance={{
          averageGrade: performance?.averageGrade ?? 4.6,
          attendanceRate: performance?.attendanceRate ?? '96%',
          missedAssignments: performance?.missedAssignments ?? overdueCount,
          streak: performance?.streak ?? '6 дена',
          weeklyTrend: performance?.weeklyTrend || DEFAULT_WEEKLY_TREND,
        }}
        recentActivities={recentActivities}
        subjectPerformance={subjectPerformance}
        attendance={attendance}
        aiSessions={studentAiSessions}
      />
    );
  }

  return withLoadingOverlay(
    <StudentDashboardPage
      theme={theme}
      onToggleTheme={onToggleTheme}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      activePage="dashboard"
      nextTask={nextTask}
      quickStats={quickStats}
      tasks={tasks}
      todayItems={todayItems}
      projects={PROJECTS}
      deadlines={deadlines}
      announcements={announcements}
      completedCount={completedCount}
      weeklyProgress={weeklyProgress}
      average={performance?.averageGrade ?? 4.6}
      onOpenTask={openTaskDetails}
    />
  );
}

export default StudentArea;
