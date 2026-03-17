import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import ChatMessagesPanel from '../../components/ChatMessagesPanel';
import StudentDashboardPage from '../StudentDashboardPage';
import StudentWorkspacePage from '../StudentWorkspacePage';
import StudentCalendarPage from '../StudentCalendarPage';
import StudentProfilePage from '../StudentProfilePage';
import TaskDetailsPage from '../TaskDetailsPage';
import TaskCompletionPage from '../TaskCompletionPage';
import StudentNotificationsPage from '../StudentNotificationsPage';
import StudentAnnouncementDetailsPage from '../StudentAnnouncementDetailsPage';
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
const MAX_AI_ASSISTANCES_PER_ASSIGNMENT = 3;
const STUDENT_PAGE_PATHS = {
  dashboard: '/',
  assignments: '/assignments',
  calendar: '/calendar',
  messages: '/messages',
  notifications: '/notifications',
  profile: '/profile',
};

function getStudentPagePath(nextPage, options = {}) {
  const taskId = String(options.taskId || '');
  const announcementId = String(options.announcementId || '');

  if (nextPage === 'task-details' && taskId) {
    return `${STUDENT_PAGE_PATHS.assignments}/${taskId}`;
  }

  if (nextPage === 'announcement-details' && announcementId) {
    return `/announcements/${announcementId}`;
  }

  if (nextPage === 'workspace' && taskId) {
    return `${STUDENT_PAGE_PATHS.assignments}/${taskId}/workspace`;
  }

  if (nextPage === 'completion' && taskId) {
    return `${STUDENT_PAGE_PATHS.assignments}/${taskId}/completion`;
  }

  return STUDENT_PAGE_PATHS[nextPage] || STUDENT_PAGE_PATHS.dashboard;
}

function getStudentRouteState(pathname) {
  if (pathname === '/' || pathname === '/dashboard') {
    return { activePage: 'dashboard', taskId: '', completionTaskId: '', announcementId: '' };
  }

  if (pathname === '/homework') {
    return { activePage: 'assignments', taskId: '', completionTaskId: '', announcementId: '' };
  }

  const pageEntry = Object.entries(STUDENT_PAGE_PATHS).find(
    ([page, path]) => page !== 'dashboard' && pathname === path
  );
  if (pageEntry) {
    return { activePage: pageEntry[0], taskId: '', completionTaskId: '', announcementId: '' };
  }

  const announcementMatch = pathname.match(/^\/announcements\/([^/]+)$/);
  if (announcementMatch) {
    return {
      activePage: 'announcement-details',
      taskId: '',
      completionTaskId: '',
      announcementId: announcementMatch[1],
    };
  }

  const workspaceMatch = pathname.match(/^\/assignments\/([^/]+)\/workspace$/);
  if (workspaceMatch) {
    return {
      activePage: 'workspace',
      taskId: workspaceMatch[1],
      completionTaskId: '',
      announcementId: '',
    };
  }

  const completionMatch = pathname.match(/^\/assignments\/([^/]+)\/completion$/);
  if (completionMatch) {
    return {
      activePage: 'completion',
      taskId: completionMatch[1],
      completionTaskId: completionMatch[1],
      announcementId: '',
    };
  }

  const detailsMatch = pathname.match(/^\/assignments\/([^/]+)$/);
  if (detailsMatch) {
    return {
      activePage: 'task-details',
      taskId: detailsMatch[1],
      completionTaskId: '',
      announcementId: '',
    };
  }

  return { activePage: 'dashboard', taskId: '', completionTaskId: '', announcementId: '' };
}

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

  const normalized = String(type).trim().toLowerCase();

  if (normalized === 'домашна задача') {
    return 'домашна';
  }
  if (normalized === 'step_by_step' || normalized === 'step by step') {
    return 'чекори';
  }
  if (normalized === 'проект') {
    return 'проект';
  }
  if (normalized === 'квиз') {
    return 'квиз';
  }
  if (normalized === 'тест') {
    return 'тест';
  }
  if (normalized === 'вежба') {
    return 'вежба';
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

function evaluationModeLabel(mode) {
  if (mode === 'manual') {
    return 'Потребен преглед';
  }
  if (mode === 'numeric') {
    return 'Автоматска бројчена проверка';
  }
  if (mode === 'regex') {
    return 'Автоматска проверка по образец';
  }
  if (mode === 'normalized_text') {
    return 'Автоматска проверка';
  }
  return '';
}

function mapStepAnswer(stepAnswer, index) {
  return {
    id: String(stepAnswer?.id ?? `step-answer-${index}`),
    assignmentStepId: String(
      stepAnswer?.assignment_step_id ?? stepAnswer?.assignmentStepId ?? `step-${index}`
    ),
    answerText: stepAnswer?.answer_text || stepAnswer?.answerText || '',
    status: stepAnswer?.status || 'answered',
    statusLabel:
      stepAnswer?.status === 'correct'
        ? 'Точно'
        : stepAnswer?.status === 'incorrect'
          ? 'Неточно'
          : 'Одговорено',
  };
}

function toApiId(value) {
  if (value === '' || value === null || value === undefined) {
    return value;
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
}

function mapAiMessage(message, index) {
  if (!message) {
    return null;
  }

  return {
    id: String(message.id ?? `ai-message-${index}`),
    role: message.role || 'assistant',
    messageType: message.message_type || message.messageType || 'hint',
    content: message.content || '',
    sequenceNumber: message.sequence_number ?? message.sequenceNumber ?? index + 1,
    assignmentStepId:
      message.metadata?.assignment_step_id ?? message.assignment_step_id ?? null,
    metadata: message.metadata || {},
  };
}

function sortAiMessages(messages) {
  return [...messages].sort((left, right) => {
    const leftSequence = left.sequenceNumber ?? 0;
    const rightSequence = right.sequenceNumber ?? 0;
    return leftSequence - rightSequence;
  });
}

function mapAiSession(session) {
  if (!session) {
    return null;
  }

  const messagesSource = Array.isArray(session.messages)
    ? session.messages
    : Array.isArray(session.ai_messages)
      ? session.ai_messages
      : [];

  return {
    id: String(session.id),
    status: session.status || 'active',
    title: session.title || 'AI help',
    sessionType: session.session_type || session.sessionType || '',
    assignmentId: String(session.assignment_id ?? session.assignmentId ?? ''),
    submissionId: String(session.submission_id ?? session.submissionId ?? ''),
    subjectId: String(session.subject_id ?? session.subjectId ?? ''),
    messages: sortAiMessages(messagesSource.map(mapAiMessage).filter(Boolean)),
  };
}

function mapAiSessions(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.ai_sessions)
      ? payload.ai_sessions
      : [];

  return list.map(mapAiSession).filter(Boolean);
}

function mergeAiMessages(existingMessages, nextMessages) {
  const mergedById = new Map();

  [...(existingMessages || []), ...(nextMessages || [])].forEach((message, index) => {
    if (!message) {
      return;
    }
    const key = String(message.id || `ai-message-${index}`);
    mergedById.set(key, message);
  });

  return sortAiMessages(Array.from(mergedById.values()));
}

function countAiAssistances(session) {
  return (session?.messages || []).filter(
    (message) => message.role === 'user' && message.messageType === 'question'
  ).length;
}

function mapSubmissionSummary(submission) {
  if (!submission) {
    return null;
  }

  const stepAnswersSource =
    submission.step_answers || submission.stepAnswers || submission.submission_step_answers || [];
  const feedback =
    submission.feedback ??
    submission.grade?.feedback ??
    submission.latest_grade?.feedback ??
    submission.latestGrade?.feedback ??
    null;

  return {
    id: String(submission.id),
    status: submission.status,
    statusLabel:
      submission.status === 'reviewed'
        ? 'Прегледано'
        : submission.status === 'submitted'
          ? 'Предадено'
          : submission.status === 'in_progress'
            ? 'Во тек'
            : submission.status,
    startedAt: submission.started_at ? formatDueText(submission.started_at) : '',
    submittedAt: submission.submitted_at ? formatDueText(submission.submitted_at) : '',
    totalScore:
      submission.total_score !== undefined && submission.total_score !== null
        ? String(submission.total_score)
        : '',
    feedback,
    late: Boolean(submission.late),
    stepAnswers: Array.isArray(stepAnswersSource)
      ? stepAnswersSource.map(mapStepAnswer)
      : [],
  };
}

function getCurrentStepFromSubmission(steps, submission) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  if (submission?.status && ['submitted', 'reviewed', 'returned', 'completed'].includes(submission.status)) {
    return steps[0];
  }

  const answeredStepIds = new Set(
    (submission?.stepAnswers || [])
      .filter((stepAnswer) => ['correct', 'answered'].includes(stepAnswer.status))
      .map((stepAnswer) => String(stepAnswer.assignmentStepId))
  );

  return (
    steps.find((step) => step.required && !answeredStepIds.has(String(step.id))) ||
    steps.find((step) => !answeredStepIds.has(String(step.id))) ||
    steps[steps.length - 1]
  );
}

function getStepIndex(steps, stepId) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return -1;
  }

  return steps.findIndex((step) => String(step.id) === String(stepId));
}

function mapAssignmentToTask(assignment, fallbackTask, index) {
  const hasLiveAssignment = Boolean(
    assignment && (assignment.id || assignment.title || assignment.description || assignment.steps)
  );
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
        evaluationMode: step.evaluation_mode || 'manual',
        evaluationModeLabel: evaluationModeLabel(step.evaluation_mode || 'manual'),
        contentBlocks: Array.isArray(step.content_json) ? step.content_json : [],
      }))
    : [];
  const readingPassage = steps
    .filter((step) => step.stepType === 'reading' && step.content)
    .map((step) => step.content);
  const submissionStatus = assignment?.submission?.status || assignment?.submission_status || assignment?.status;
  const submission = assignment?.submission ? mapSubmissionSummary(assignment.submission) : null;

  return {
    id: String(assignment?.id ?? fallbackTask?.id ?? `api-task-${index + 1}`),
    subjectId: String(assignment?.subject?.id ?? assignment?.subject_id ?? ''),
    subject:
      assignment?.subject_name ||
      assignment?.subject?.name ||
      (hasLiveAssignment ? 'Предмет' : fallbackTask?.subject) ||
      'Предмет',
    title: assignment?.title || fallbackTask?.title || `Задача ${index + 1}`,
    type: mapAssignmentTypeLabel(
      assignment?.assignment_type ||
        (steps.length > 0 ? 'step_by_step' : fallbackTask?.type) ||
        'homework'
    ),
    instructions:
      assignment?.instructions || assignment?.description || (!hasLiveAssignment ? fallbackTask?.instructions : '') || '',
    readingPassage:
      readingPassage.length > 0
        ? readingPassage
        : hasLiveAssignment
          ? []
          : fallbackTask?.readingPassage || [],
    placeholder:
      assignment?.submission?.status === 'reviewed'
        ? 'Одговорот е веќе предаден'
        : 'Внеси одговор',
    hint:
      assignment?.steps?.[0]?.example_answer ||
      (hasLiveAssignment ? '' : fallbackTask?.hint) ||
      '',
    expectedAnswers:
      Array.isArray(assignment?.expected_answers) && assignment.expected_answers.length > 0
        ? assignment.expected_answers
        : [],
    difficulty:
      assignment?.difficulty_label ||
      (hasLiveAssignment ? 'Задача' : fallbackTask?.difficulty) ||
      'Средно',
    dueText: formatDueText(dueAt),
    rawDueAt: dueAt || '',
    dueCategory: dueCategoryFromDate(dueAt),
    description: assignment?.description || '',
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
    currentStep: getCurrentStepFromSubmission(steps, submission),
    submission,
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
    fileUrl: item?.file_url || item?.uploaded_file?.url || '',
    uploadedFile: item?.uploaded_file || null,
    scope,
    audienceType: item?.audience_type || 'school',
    classroomId: String(item?.classroom_id ?? item?.classroom?.id ?? ''),
    classroomName,
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

function mapAnnouncementDetails(payload) {
  const announcement = mapAnnouncement(payload, 0);

  return {
    ...announcement,
    schoolId: String(payload?.school_id || ''),
    status: payload?.status || 'published',
    startsAt: payload?.starts_at || null,
    endsAt: payload?.ends_at || null,
    authorName: payload?.author?.full_name || '',
    subjectName: payload?.subject?.name || payload?.subject_name || '',
    fileUrl: payload?.file_url || payload?.uploaded_file?.url || announcement.fileUrl || '',
    uploadedFile: payload?.uploaded_file || announcement.uploadedFile || null,
    comments: Array.isArray(payload?.comments)
      ? payload.comments.map((comment, index) => ({
          id: String(comment?.id ?? `comment-${index}`),
          body: comment?.body || '',
          authorName: comment?.author_name || '',
          createdAt: comment?.created_at
            ? new Date(comment.created_at).toLocaleString('mk-MK')
            : '',
        }))
      : [],
  };
}

function normalizeClassIdentifier(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function isAnnouncementVisibleToStudent(announcement, profile) {
  const audienceType = String(announcement?.audienceType || 'school')
    .trim()
    .toLowerCase();

  if (audienceType === 'school') {
    return true;
  }

  if (audienceType !== 'classroom') {
    return false;
  }

  const studentClassroomId = String(profile?.classroomId || '').trim();
  const announcementClassroomId = String(announcement?.classroomId || '').trim();

  if (studentClassroomId && announcementClassroomId) {
    return studentClassroomId === announcementClassroomId;
  }

  const studentClassName = normalizeClassIdentifier(profile?.className);
  const announcementClassName = normalizeClassIdentifier(announcement?.classroomName);

  if (studentClassName && announcementClassName) {
    return studentClassName === announcementClassName;
  }

  return false;
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

function mergeSubmissionData(existingSubmission, incomingSubmission) {
  if (!existingSubmission) {
    return incomingSubmission || null;
  }
  if (!incomingSubmission) {
    return existingSubmission;
  }

  return {
    ...existingSubmission,
    ...incomingSubmission,
    status: incomingSubmission.status || existingSubmission.status,
    statusLabel: incomingSubmission.statusLabel || existingSubmission.statusLabel,
    startedAt: incomingSubmission.startedAt || existingSubmission.startedAt,
    submittedAt: incomingSubmission.submittedAt || existingSubmission.submittedAt,
    totalScore: incomingSubmission.totalScore || existingSubmission.totalScore,
    feedback: incomingSubmission.feedback ?? existingSubmission.feedback ?? '',
    stepAnswers:
      incomingSubmission.stepAnswers?.length > 0
        ? incomingSubmission.stepAnswers
        : existingSubmission.stepAnswers || [],
  };
}

function mergeDashboardHomework(currentTasks, payload) {
  const homework = Array.isArray(payload?.homework) ? payload.homework : [];
  const deadlines = Array.isArray(payload?.deadlines) ? payload.deadlines : [];
  const nextTaskItems = payload?.next_task ? [payload.next_task] : [];
  const mergedAssignments = [...homework, ...deadlines, ...nextTaskItems];
  if (mergedAssignments.length === 0) {
    return currentTasks;
  }

  const taskById = new Map(currentTasks.map((task) => [String(task.id), task]));
  const mergedById = new Map();

  currentTasks.forEach((task) => {
    mergedById.set(String(task.id), task);
  });

  mergedAssignments.forEach((item, index) => {
    const id = String(item.assignment_id || item.id || `dashboard-task-${index}`);
    const fallbackTask = taskById.get(id);
    const mappedTask = mapAssignmentToTask(
      {
        id: item.assignment_id || item.id,
        title: item.title,
        due_at: item.due_at,
        status: item.status,
        assignment_type: item.assignment_type || item.type || fallbackTask?.type,
        subject: item.subject ? item.subject : fallbackTask?.subject ? { name: fallbackTask.subject } : null,
        submission: item.submission_id
          ? {
              id: item.submission_id,
              status: item.status,
            }
          : null,
      },
      fallbackTask,
      index
    );

    const existingTask = mergedById.get(id);
    mergedById.set(id, {
      ...existingTask,
      ...mappedTask,
      description: mappedTask.description || existingTask?.description || '',
      maxPoints: mappedTask.maxPoints || existingTask?.maxPoints || '',
      publishedAt: mappedTask.publishedAt || existingTask?.publishedAt || '',
      teacherName: mappedTask.teacherName || existingTask?.teacherName || '',
      classroomName: mappedTask.classroomName || existingTask?.classroomName || '',
      resources:
        mappedTask.resources.length > 0 ? mappedTask.resources : existingTask?.resources || [],
      contentBlocks:
        mappedTask.contentBlocks.length > 0
          ? mappedTask.contentBlocks
          : existingTask?.contentBlocks || [],
      steps: mappedTask.steps.length > 0 ? mappedTask.steps : existingTask?.steps || [],
      currentStep: mappedTask.currentStep || existingTask?.currentStep || null,
      submission: mergeSubmissionData(existingTask?.submission, mappedTask.submission),
    });
  });

  return Array.from(mergedById.values()).sort((a, b) => {
    const left = new Date(a.rawDueAt || a.dueText).getTime();
    const right = new Date(b.rawDueAt || b.dueText).getTime();
    if (Number.isNaN(left) || Number.isNaN(right)) {
      return String(a.title).localeCompare(String(b.title), 'mk');
    }
    return left - right;
  });
}

function buildTodayItemsFromDashboard(payload) {
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

  if (dashboardAnnouncements[0]) {
    upcomingItems.unshift(`Објава: ${dashboardAnnouncements[0].title}`);
  }

  return upcomingItems;
}

function mapProfileData({ mePayload, dashboardPayload, performanceData }) {
  const user = mePayload?.user || dashboardPayload?.student || {};
  const school = Array.isArray(mePayload?.schools) ? mePayload.schools[0] : null;
  const snapshotData = performanceData || {};

  return {
    fullName: user.full_name || user.name || DEFAULT_PROFILE.fullName,
    initials: getInitials(user.full_name || user.name || DEFAULT_PROFILE.fullName),
    classroomId: String(
      dashboardPayload?.student?.classroom_id || dashboardPayload?.student?.class_id || ''
    ),
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
  };
}

function normalizeNavTarget(target) {
  if (
    target === 'calendar' ||
    target === 'messages' ||
    target === 'profile' ||
    target === 'notifications' ||
    target === 'assignments'
  ) {
    return target;
  }
  return 'dashboard';
}

function StudentArea({ theme, onToggleTheme, onLogout, onNotify }) {
  const initialRoute =
    typeof window === 'undefined'
      ? { activePage: 'dashboard', taskId: '', completionTaskId: '', announcementId: '' }
      : getStudentRouteState(window.location.pathname);
  const transitionTimeoutRef = useRef(null);
  const [activePage, setActivePage] = useState(initialRoute.activePage);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [activeTaskId, setActiveTaskId] = useState(initialRoute.taskId || MOCK_TASKS[0].id);
  const [activeAnnouncementId, setActiveAnnouncementId] = useState(
    initialRoute.announcementId || ''
  );
  const [completionContext, setCompletionContext] = useState(
    initialRoute.activePage === 'completion' && initialRoute.completionTaskId
      ? { taskId: initialRoute.completionTaskId, nextTaskId: null }
      : null
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [performance, setPerformance] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState(DEFAULT_SUBJECT_PERFORMANCE);
  const [recentActivities, setRecentActivities] = useState(DEFAULT_RECENT_ACTIVITIES);
  const [todayItems, setTodayItems] = useState(TODAY_ITEMS);
  const [attendance, setAttendance] = useState(null);
  const [announcementDetailsById, setAnnouncementDetailsById] = useState({});
  const [taskDrafts, setTaskDrafts] = useState(() =>
    Object.fromEntries(
      MOCK_TASKS.map((task) => [task.id, { answer: '', feedback: null, stepId: null }])
    )
  );
  const [aiTutorByTask, setAiTutorByTask] = useState({});

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
  const visibleAnnouncements = useMemo(
    () => announcements.filter((announcement) => isAnnouncementVisibleToStudent(announcement, profile)),
    [announcements, profile]
  );
  const activeAnnouncement = useMemo(() => {
    if (!activeAnnouncementId) {
      return null;
    }

    return (
      announcementDetailsById[activeAnnouncementId] ||
      visibleAnnouncements.find((announcement) => String(announcement.id) === String(activeAnnouncementId)) ||
      null
    );
  }, [activeAnnouncementId, announcementDetailsById, visibleAnnouncements]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const [dashboardResult, assignmentsResult, notificationsResult] =
        await Promise.allSettled([
          api.studentDashboard(),
          api.studentAssignments(),
          api.notifications(),
        ]);
      const [meResult, announcementsResult, performanceResult] =
        await Promise.allSettled([
          api.me(),
          api.announcements({ status: 'published' }),
          api.studentPerformance(),
        ]);

      if (!isMounted) {
        return;
      }

      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value);
      }

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
        })
      );

      const todayItemsPayload = buildTodayItemsFromDashboard(
        dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
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
          setTasks((previousTasks) => {
            const previousById = new Map(
              previousTasks.map((task) => [String(task.id), task])
            );
            const mergedTasks = mappedTasks.map((task) => {
              const existingTask = previousById.get(String(task.id));
              if (!existingTask) {
                return task;
              }

              return {
                ...existingTask,
                ...task,
                submission: mergeSubmissionData(existingTask.submission, task.submission),
                resources: task.resources.length > 0 ? task.resources : existingTask.resources || [],
                contentBlocks:
                  task.contentBlocks.length > 0
                    ? task.contentBlocks
                    : existingTask.contentBlocks || [],
                steps: task.steps.length > 0 ? task.steps : existingTask.steps || [],
                currentStep: task.currentStep || existingTask.currentStep || null,
              };
            });

            return mergeDashboardHomework(
              mergedTasks,
              dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
            );
          });
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
      setNotifications(notificationsPayload.map(mapNotification));
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
        taskId: String(item.assignment_id || item.id || ''),
        title: item.title || 'Задача',
        subject: item.subject?.name || '',
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
        taskId: String(task.id),
        title: `${task.title} - ${task.subject}`,
        subject: task.subject,
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

  const syncStudentLocation = (nextPage, options = {}) => {
    if (typeof window === 'undefined') {
      return;
    }

    const pathname = getStudentPagePath(nextPage, {
      taskId: options.taskId || activeTaskId,
      announcementId: options.announcementId || activeAnnouncementId,
    });

    if (window.location.pathname === pathname) {
      return;
    }

    const method = options.replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', pathname);
  };

  const transitionToPage = (nextPage, options = {}) => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    setIsLoadingPage(true);
    syncStudentLocation(nextPage, {
      taskId: options.taskId || activeTaskId,
      announcementId: options.announcementId || activeAnnouncementId,
      replace: options.replace,
    });
    transitionTimeoutRef.current = window.setTimeout(() => {
      if (options.taskId) {
        setActiveTaskId(String(options.taskId));
      }
      if (options.announcementId !== undefined) {
        setActiveAnnouncementId(String(options.announcementId || ''));
      } else if (nextPage !== 'announcement-details') {
        setActiveAnnouncementId('');
      }
      setActivePage(nextPage);
      if (nextPage === 'completion') {
        setCompletionContext({
          taskId: String(options.taskId || activeTaskId),
          nextTaskId: options.nextTaskId || null,
        });
      } else {
        setCompletionContext(null);
      }
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

  const refreshTaskDetails = async (taskId) => {
    const response = await api.studentAssignmentDetails(taskId);
    setTasks((previousTasks) =>
      previousTasks.map((task, index) => {
        if (task.id !== String(taskId)) {
          return task;
        }

        const mappedTask = mapAssignmentToTask(response, task || MOCK_TASKS[index], index);
        return {
          ...task,
          ...mappedTask,
          submission: mergeSubmissionData(task.submission, mappedTask.submission),
          resources:
            mappedTask.resources.length > 0 ? mappedTask.resources : task.resources || [],
          contentBlocks:
            mappedTask.contentBlocks.length > 0
              ? mappedTask.contentBlocks
              : task.contentBlocks || [],
          steps: mappedTask.steps.length > 0 ? mappedTask.steps : task.steps || [],
          currentStep: mappedTask.currentStep || task.currentStep || null,
        };
      })
    );
    return response;
  };

  const openTaskDetails = (taskId) => {
    const loadDetails = async () => {
      try {
        await refreshTaskDetails(taskId);
      } catch {
        // continue with current local data
      } finally {
        transitionToPage('task-details', { taskId });
      }
    };
    loadDetails().catch(() => {
      transitionToPage('task-details', { taskId });
    });
  };

  const refreshAnnouncementDetails = async (announcementId) => {
    const response = await api.announcementDetails(announcementId);
    const mappedAnnouncement = mapAnnouncementDetails(response);
    setAnnouncementDetailsById((previous) => ({
      ...previous,
      [String(announcementId)]: mappedAnnouncement,
    }));
    return mappedAnnouncement;
  };

  const openWorkspace = (taskId) => {
    const loadWorkspace = async () => {
      try {
        await refreshTaskDetails(taskId);
      } catch {
        // keep current local task data if detail refresh fails
      } finally {
        markTaskAsInProgressIfNeeded(taskId);
        transitionToPage('workspace', { taskId });
      }
    };

    loadWorkspace().catch(() => {
      markTaskAsInProgressIfNeeded(taskId);
      transitionToPage('workspace', { taskId });
    });
  };

  const openAnnouncementDetails = (announcementId) => {
    const normalizedId = String(announcementId || '');
    if (!normalizedId) {
      return;
    }

    const loadDetails = async () => {
      try {
        await refreshAnnouncementDetails(normalizedId);
      } catch {
        // keep list data if detail refresh fails
      } finally {
        transitionToPage('announcement-details', { announcementId: normalizedId });
      }
    };

    loadDetails().catch(() => {
      transitionToPage('announcement-details', { announcementId: normalizedId });
    });
  };

  useEffect(() => {
    const shouldHydrateSubmittedTask =
      activePage === 'workspace' &&
      activeTask?.id &&
      (activeTask?.submission?.status === 'submitted' || activeTask?.status === TASK_STATUS.DONE) &&
      (!Array.isArray(activeTask?.submission?.stepAnswers) ||
        activeTask.submission.stepAnswers.length === 0);

    if (!shouldHydrateSubmittedTask) {
      return;
    }

    refreshTaskDetails(activeTask.id).catch(() => {
      // leave the current task visible if the detail refresh fails
    });
  }, [
    activePage,
    activeTask?.id,
    activeTask?.status,
    activeTask?.submission?.status,
    activeTask?.submission?.stepAnswers?.length,
  ]);

  useEffect(() => {
    if (
      activePage !== 'announcement-details' ||
      !activeAnnouncementId ||
      announcementDetailsById[activeAnnouncementId]
    ) {
      return;
    }

    refreshAnnouncementDetails(activeAnnouncementId).catch(() => {
      // keep the page visible even if the detail request fails
    });
  }, [activeAnnouncementId, activePage, announcementDetailsById]);

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
    onNotify?.('Известувањето е означено како прочитано.', 'info');

    api.markNotificationRead(notificationId).catch(() => {
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === String(notificationId)
            ? { ...notification, read: false }
            : notification
        )
      );
      onNotify?.('Не успеа означувањето на известувањето.', 'error');
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

  const submitTask = (taskId) => {
    const submittedAt = new Date().toLocaleString('mk-MK', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        if (task.submission?.submittedAt) {
          return task;
        }

        return {
          ...task,
          status: TASK_STATUS.DONE,
          submission: {
            id: task.submission?.id || `local-submission-${taskId}`,
            status: 'submitted',
            statusLabel: 'Предадено',
            startedAt: task.submission?.startedAt || submittedAt,
            submittedAt,
            totalScore: task.submission?.totalScore || '',
            late: task.submission?.late || false,
          },
        };
      })
    );
    onNotify?.('Задачата е успешно предадена.', 'success');
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
        stepId:
          tasks.find((task) => task.id === taskId)?.currentStep?.id ||
          previous[taskId]?.stepId ||
          null,
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

  const updateAiTutorState = (taskId, updater) => {
    setAiTutorByTask((previous) => {
      const currentState = previous[taskId] || {
        open: false,
        loading: false,
        error: '',
        session: null,
      };
      const nextState =
        typeof updater === 'function' ? updater(currentState) : { ...currentState, ...updater };
      return {
        ...previous,
        [taskId]: nextState,
      };
    });
  };

  const applySubmissionToTask = (taskId, submissionPayload, options = {}) => {
    const mappedSubmission = mapSubmissionSummary(submissionPayload);
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextSubmission = mergeSubmissionData(task.submission, mappedSubmission);
        const nextCurrentStep =
          options.preserveCurrentStep && task.currentStep
            ? task.steps.find((step) => String(step.id) === String(task.currentStep.id)) ||
              getCurrentStepFromSubmission(task.steps, nextSubmission)
            : getCurrentStepFromSubmission(task.steps, nextSubmission);
        return {
          ...task,
          submission: nextSubmission,
          currentStep: nextCurrentStep,
          status: mapStatusToStudent(submissionPayload?.status || task.status),
        };
      })
    );
    return mappedSubmission;
  };

  const ensureSubmission = async (task) => {
    if (task?.submission?.id) {
      return task.submission.id;
    }

    const createdSubmission = await api.createAssignmentSubmission(task.id);
    const mappedSubmission = applySubmissionToTask(task.id, createdSubmission);
    return mappedSubmission?.id || String(createdSubmission.id);
  };

  const applyAiSessionToTask = (taskId, sessionPayload) => {
    const mappedSession = mapAiSession(sessionPayload);
    updateAiTutorState(taskId, (current) => ({
      ...current,
      session: mappedSession
        ? {
            ...(current.session || {}),
            ...mappedSession,
            messages: mergeAiMessages(current.session?.messages, mappedSession.messages),
          }
        : current.session,
      loading: false,
      error: '',
    }));
    return mappedSession;
  };

  const ensureAiSession = async (task) => {
    const taskId = String(task.id);
    const cachedSession = aiTutorByTask[taskId]?.session;
    if (cachedSession?.id) {
      return cachedSession;
    }

    const submissionId = await ensureSubmission(task);
    const allSessions = await api.aiSessions().catch(() => ({ ai_sessions: [] }));
    const matchingSession = mapAiSessions(allSessions).find((session) => {
      const sameAssignment = String(session.assignmentId) === String(task.id);
      const sameSubmission =
        !session.submissionId || String(session.submissionId) === String(submissionId);
      const isAssignmentHelp =
        !session.sessionType || session.sessionType === 'assignment_help';
      return sameAssignment && sameSubmission && isAssignmentHelp;
    });

    if (matchingSession?.id) {
      const detailedSession = await api
        .aiSessionDetails(matchingSession.id)
        .catch(() => matchingSession);
      return applyAiSessionToTask(taskId, detailedSession);
    }

    const createdSession = await api.createAiSession({
      assignment_id: toApiId(task.id),
      submission_id: toApiId(submissionId),
      subject_id: toApiId(task.subjectId || ''),
      session_type: 'assignment_help',
      title: `AI help - ${task.title}`,
    });
    const detailedSession = await api
      .aiSessionDetails(createdSession.id)
      .catch(() => createdSession);
    return applyAiSessionToTask(taskId, detailedSession);
  };

  const saveStepAnswer = async (task, answerText) => {
    const currentStep = task.currentStep || task.steps?.[0];
    if (!currentStep?.id) {
      return null;
    }

    const submissionId = await ensureSubmission(task);
    const response = await api.updateSubmission(submissionId, {
      step_answers: [
        {
          assignment_step_id: Number.isNaN(Number(currentStep.id))
            ? currentStep.id
            : Number(currentStep.id),
          answer_text: answerText,
        },
      ],
    });

    const mappedSubmission = applySubmissionToTask(task.id, response, {
      preserveCurrentStep: true,
    });
    const stepAnswer = mappedSubmission?.stepAnswers?.find(
      (item) => String(item.assignmentStepId) === String(currentStep.id)
    );

    return {
      submission: mappedSubmission,
      stepAnswer,
    };
  };

  const submitAssignment = async (task) => {
    const submissionId = await ensureSubmission(task);
    const response = await api.submitSubmission(submissionId);
    const mappedSubmission = applySubmissionToTask(task.id, response);

    try {
      const detailedAssignment = await api.studentAssignmentDetails(task.id);
      setTasks((previousTasks) =>
        previousTasks.map((item, index) => {
          if (item.id !== String(task.id)) {
            return item;
          }

          const mappedTask = mapAssignmentToTask(
            detailedAssignment,
            item || MOCK_TASKS[index],
            index
          );
          return {
            ...item,
            ...mappedTask,
            submission: mergeSubmissionData(item.submission, mappedTask.submission),
            resources:
              mappedTask.resources.length > 0 ? mappedTask.resources : item.resources || [],
            contentBlocks:
              mappedTask.contentBlocks.length > 0
                ? mappedTask.contentBlocks
                : item.contentBlocks || [],
            steps: mappedTask.steps.length > 0 ? mappedTask.steps : item.steps || [],
            currentStep: mappedTask.currentStep || item.currentStep || null,
          };
        })
      );
      return mapSubmissionSummary(detailedAssignment?.submission) || mappedSubmission;
    } catch {
      return mappedSubmission;
    }
  };

  const goToNextStep = (taskId) => {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== taskId || !Array.isArray(task.steps) || task.steps.length === 0) {
          return task;
        }

        const currentIndex = getStepIndex(task.steps, task.currentStep?.id);
        if (currentIndex < 0 || currentIndex >= task.steps.length - 1) {
          return task;
        }

        return {
          ...task,
          currentStep: task.steps[currentIndex + 1],
        };
      })
    );
  };

  const openAiTutor = async (task) => {
    const taskId = String(task.id);
    updateAiTutorState(taskId, (current) => ({
      ...current,
      open: true,
      loading: true,
      error: '',
    }));

    try {
      const session = await ensureAiSession(task);
      updateAiTutorState(taskId, (current) => ({
        ...current,
        open: true,
        loading: false,
        error: '',
        session: session || current.session,
      }));
    } catch (error) {
      updateAiTutorState(taskId, (current) => ({
        ...current,
        loading: false,
        error: error.message || 'Не успеа вчитувањето на AI tutor.',
      }));
    }
  };

  const closeAiTutor = (taskId) => {
    updateAiTutorState(String(taskId), (current) => ({
      ...current,
      open: false,
      error: '',
    }));
  };

  const sendAiTutorMessage = async (task, content) => {
    const taskId = String(task.id);
    updateAiTutorState(taskId, (current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    try {
      const session = await ensureAiSession(task);
      if (countAiAssistances(session) >= MAX_AI_ASSISTANCES_PER_ASSIGNMENT) {
        const limitError = new Error(
          `Достигнат е лимитот од ${MAX_AI_ASSISTANCES_PER_ASSIGNMENT} AI помоши за оваа задача.`
        );
        throw limitError;
      }

      const currentStep = task.currentStep || task.steps?.[0];
      const response = await api.createAiMessage(session.id, {
        role: 'user',
        message_type: 'question',
        content,
        metadata: {
          assignment_step_id: currentStep?.id ? toApiId(currentStep.id) : undefined,
        },
      });

      const nextSession = {
        ...session,
        messages: mergeAiMessages(session.messages, [
          mapAiMessage(response?.user_message, 0),
          mapAiMessage(response?.assistant_message, 1),
        ].filter(Boolean)),
      };

      updateAiTutorState(taskId, (current) => ({
        ...current,
        loading: false,
        error: '',
        session: nextSession,
      }));

      return nextSession;
    } catch (error) {
      updateAiTutorState(taskId, (current) => ({
        ...current,
        loading: false,
        error: error.message || 'Не успеа прашањето до AI tutor.',
      }));
      throw error;
    }
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      const route = getStudentRouteState(window.location.pathname);
      setIsLoadingPage(false);
      setActivePage(route.activePage);
      setActiveTaskId(route.taskId || MOCK_TASKS[0].id);
      setActiveAnnouncementId(route.announcementId || '');
      setCompletionContext(
        route.activePage === 'completion' && route.completionTaskId
          ? { taskId: route.completionTaskId, nextTaskId: null }
          : null
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const normalizedPath = getStudentPagePath(activePage, {
      taskId:
        activePage === 'completion'
          ? completionContext?.taskId || activeTaskId
          : activeTaskId,
      announcementId: activeAnnouncementId,
    });

    if (window.location.pathname === '/dashboard' && normalizedPath !== '/dashboard') {
      window.history.replaceState({}, '', normalizedPath);
    }
  }, [activeAnnouncementId, activePage, activeTaskId, completionContext]);

  if (activePage === 'workspace' && activeTask) {
    return withLoadingOverlay(
      <StudentWorkspacePage
        theme={theme}
        onToggleTheme={onToggleTheme}
        tasks={tasks}
        activeTask={activeTask}
        onBackToDetails={() => transitionToPage('task-details')}
        onBackToDashboard={() => transitionToPage('dashboard')}
        onCompleteTask={completeTask}
        onSkipTask={skipTask}
        onNextTask={openWorkspace}
        onGoToNextStep={() => goToNextStep(activeTask.id)}
        getNextTaskId={getNextTaskId}
        draft={taskDrafts[activeTask.id]}
        onDraftAnswerChange={(answer) => updateTaskAnswer(activeTask.id, answer)}
        onDraftFeedbackChange={(feedback) =>
          updateTaskFeedback(activeTask.id, feedback)
        }
        onSaveStepAnswer={saveStepAnswer}
        onSubmitAssignment={submitAssignment}
        aiTutor={aiTutorByTask[activeTask.id] || null}
        onOpenAiTutor={openAiTutor}
        onCloseAiTutor={closeAiTutor}
        onSendAiTutorMessage={sendAiTutorMessage}
        onTaskCompleted={(taskId, nextTaskId) => {
          onNotify?.('Задачата е успешно завршена.', 'success');
          transitionToPage('completion', { taskId, nextTaskId });
        }}
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
        profile={profile}
        task={activeTask}
        onStartTask={() => openWorkspace(activeTask.id)}
        onBack={() => transitionToPage('dashboard')}
        startLabel={
          activeTask.submission?.submittedAt
            ? 'Прегледај'
            : activeTask.submission?.id
              ? 'Продолжи'
              : 'Започни'
        }
      />
    );
  }

  if (activePage === 'announcement-details') {
    return withLoadingOverlay(
      <StudentAnnouncementDetailsPage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        profile={profile}
        announcement={activeAnnouncement}
        onBack={() => transitionToPage('notifications')}
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
        profile={profile}
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
        profile={profile}
        tasks={tasks}
        onOpenTask={openTaskDetails}
      />
    );
  }

  if (activePage === 'messages') {
    return withLoadingOverlay(
      <div className={`dashboard-root theme-${theme} student-root`}>
        <Navbar
          theme={theme}
          activePage="messages"
          onToggleTheme={onToggleTheme}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          brandTitle={profile?.school || 'Ученички простор'}
          brandSubtitle={[profile?.fullName, profile?.className].filter(Boolean).join(' · ')}
          avatarLabel={profile?.initials || 'УЧ'}
        />
        <main className="dashboard-main student-main">
          <ChatMessagesPanel onNotify={onNotify} />
        </main>
        <Footer />
      </div>
    );
  }

  if (activePage === 'notifications') {
    return withLoadingOverlay(
      <StudentNotificationsPage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        profile={profile}
        announcements={visibleAnnouncements}
        onOpenAnnouncement={openAnnouncementDetails}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
      />
    );
  }

  if (activePage === 'assignments') {
    return withLoadingOverlay(
      <StudentDashboardPage
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        activePage="assignments"
        profile={profile}
        nextTask={nextTask}
        quickStats={quickStats}
        tasks={tasks}
        announcements={visibleAnnouncements}
        onOpenAnnouncement={openAnnouncementDetails}
        todayItems={todayItems}
        projects={PROJECTS}
        deadlines={deadlines}
        notifications={notifications}
        completedCount={completedCount}
        weeklyProgress={weeklyProgress}
        average={performance?.averageGrade ?? 4.6}
        onOpenTask={openTaskDetails}
        onContinueTask={openWorkspace}
        onSubmitTask={submitTask}
        listTitle="Сите задачи"
        showTypeFilters
      />
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
      profile={profile}
      nextTask={nextTask}
      quickStats={quickStats}
      tasks={tasks}
      announcements={visibleAnnouncements}
      onOpenAnnouncement={openAnnouncementDetails}
      todayItems={todayItems}
      projects={PROJECTS}
      deadlines={deadlines}
      notifications={notifications}
      completedCount={completedCount}
      weeklyProgress={weeklyProgress}
      average={performance?.averageGrade ?? 4.6}
      onOpenTask={openTaskDetails}
      onContinueTask={openWorkspace}
      onSubmitTask={submitTask}
      listTitle="Сите задачи"
    />
  );
}

export default StudentArea;
