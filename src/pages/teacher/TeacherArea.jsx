import { useEffect, useRef, useState } from 'react';
import Footer from '../../components/Footer';
import TeacherNavbar from '../../components/teacher/TeacherNavbar';
import AssignmentEditorPage from '../../components/teacher/AssignmentEditorPage';
import SubmissionReviewPage from '../../components/teacher/SubmissionReviewPage';
import TeacherDashboardPage from '../../components/teacher/TeacherDashboardPage';
import TeacherClassesPage from '../../components/teacher/TeacherClassesPage';
import TeacherStudentsPage from '../../components/teacher/TeacherStudentsPage';
import TeacherAssignmentsPage from '../../components/teacher/TeacherAssignmentsPage';
import TeacherGradesPage from '../../components/teacher/TeacherGradesPage';
import TeacherAnalyticsPage from '../../components/teacher/TeacherAnalyticsPage';
import TeacherTeachingProfilePage from '../../components/teacher/TeacherTeachingProfilePage';
import TeacherSettingsPage from '../../components/teacher/TeacherSettingsPage';
import ChatMessagesPanel from '../../components/ChatMessagesPanel';
import DiscussionsHub from '../../components/discussions/DiscussionsHub';
import WeeklyScheduleCalendar from '../../components/WeeklyScheduleCalendar';
import { api } from '../../services/apiClient';

const EMPTY_OVERVIEW = [
  { label: 'Мои класови', value: 0 },
  { label: 'Вкупно ученици', value: 0 },
  { label: 'Активни задачи', value: 0 },
  { label: 'Непрегледани предавања', value: 0 },
  { label: 'Наредни настани', value: 0 },
];

const TEACHER_BASE_PATH = '/teacher';
const TEACHER_PAGE_PATHS = {
  dashboard: TEACHER_BASE_PATH,
  classes: `${TEACHER_BASE_PATH}/classes`,
  students: `${TEACHER_BASE_PATH}/students`,
  assignments: `${TEACHER_BASE_PATH}/assignments`,
  grades: `${TEACHER_BASE_PATH}/grades`,
  discussions: `${TEACHER_BASE_PATH}/discussions`,
  announcements: `${TEACHER_BASE_PATH}/announcements`,
  attendance: `${TEACHER_BASE_PATH}/attendance`,
  reports: `${TEACHER_BASE_PATH}/reports`,
  calendar: `${TEACHER_BASE_PATH}/calendar`,
  messages: `${TEACHER_BASE_PATH}/messages`,
  notifications: `${TEACHER_BASE_PATH}/notifications`,
  profile: `${TEACHER_BASE_PATH}/profile`,
  settings: `${TEACHER_BASE_PATH}/settings`,
};
const ASSIGNMENT_NEW_PATH = `${TEACHER_PAGE_PATHS.assignments}/new`;
const SHOW_HOMEROOM_UI = false;

function getAssignmentEditPath(id) {
  return `${TEACHER_PAGE_PATHS.assignments}/${id}/edit`;
}

function slugifyPathSegment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function getSubmissionReviewPath({ schoolName, className, studentName, assignmentId }) {
  return `${TEACHER_BASE_PATH}/submissions/${slugifyPathSegment(schoolName)}/${slugifyPathSegment(
    className
  )}/${slugifyPathSegment(studentName)}/${assignmentId}`;
}

function getTeacherPagePath(nextPage, options = {}) {
  if (nextPage === 'assignment-editor') {
    return options.mode === 'edit' && options.assignmentId
      ? getAssignmentEditPath(options.assignmentId)
      : ASSIGNMENT_NEW_PATH;
  }

  if (nextPage === 'submission-review') {
    return getSubmissionReviewPath({
      schoolName: options.schoolName || 'school',
      className: options.className || 'class',
      studentName: options.studentName || 'student',
      assignmentId: options.assignmentId,
    });
  }

  return TEACHER_PAGE_PATHS[nextPage] || TEACHER_PAGE_PATHS.dashboard;
}

function getTeacherAssignmentStatusLabel(status) {
  if (status === 'draft') {
    return 'Нацрт';
  }
  if (status === 'published') {
    return 'Објавено';
  }
  if (status === 'scheduled') {
    return 'Закажано';
  }
  if (status === 'closed') {
    return 'Затворено';
  }
  if (status === 'archived') {
    return 'Архивирано';
  }
  return status || 'Нема статус';
}

function getTeacherAssignmentTypeLabel(type) {
  const normalized = String(type || '')
    .trim()
    .toLowerCase();

  if (normalized === 'homework') {
    return 'Домашни';
  }
  if (normalized === 'project') {
    return 'Проекти';
  }
  if (normalized === 'quiz') {
    return 'Квизови';
  }
  if (normalized === 'test') {
    return 'Тестови';
  }
  if (normalized === 'exercise') {
    return 'Вежби';
  }
  if (normalized === 'short_answer') {
    return 'Краток одговор';
  }
  if (normalized === 'reading') {
    return 'Читање';
  }
  if (normalized === 'step_by_step') {
    return 'Чекор по чекор';
  }
  if (normalized === 'step by step') {
    return 'Чекор по чекор';
  }

  if (!normalized) {
    return 'Задачи';
  }

  const cleaned = normalized.replace(/_/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getTeacherAssignmentTypeMonogram(type) {
  const normalized = String(type || '')
    .trim()
    .toLowerCase();

  if (normalized === 'homework') {
    return 'Д';
  }
  if (normalized === 'project') {
    return 'П';
  }
  if (normalized === 'quiz') {
    return 'К';
  }
  if (normalized === 'test') {
    return 'Т';
  }
  if (normalized === 'exercise') {
    return 'В';
  }
  if (normalized === 'short_answer') {
    return 'О';
  }
  if (normalized === 'reading') {
    return 'Ч';
  }
  if (normalized === 'step_by_step') {
    return 'Ч';
  }

  return normalized.charAt(0).toUpperCase() || 'З';
}

function getTeacherRouteState(pathname) {
  if (pathname === '/' || pathname === TEACHER_BASE_PATH || pathname === `${TEACHER_BASE_PATH}/dashboard`) {
    return {
      activePage: 'dashboard',
      mode: 'create',
      assignmentId: '',
      reviewRoute: null,
    };
  }

  const pageEntry = Object.entries(TEACHER_PAGE_PATHS).find(
    ([page, path]) => page !== 'dashboard' && pathname === path
  );
  if (pageEntry) {
    return {
      activePage: pageEntry[0],
      mode: 'create',
      assignmentId: '',
      reviewRoute: null,
    };
  }

  if (pathname === ASSIGNMENT_NEW_PATH || pathname === '/assignment/new') {
    return {
      activePage: 'assignment-editor',
      mode: 'create',
      assignmentId: '',
      reviewRoute: null,
    };
  }

  const editMatch =
    pathname.match(/^\/teacher\/assignments\/([^/]+)\/edit$/) ||
    pathname.match(/^\/assignment\/([^/]+)\/edit$/);
  if (editMatch) {
    return {
      activePage: 'assignment-editor',
      mode: 'edit',
      assignmentId: editMatch[1],
      reviewRoute: null,
    };
  }

  const reviewMatch =
    pathname.match(/^\/teacher\/submissions\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/) ||
    pathname.match(/^\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (reviewMatch) {
    return {
      activePage: 'submission-review',
      mode: 'create',
      assignmentId: '',
      reviewRoute: {
        schoolSlug: reviewMatch[1],
        classSlug: reviewMatch[2],
        studentSlug: reviewMatch[3],
        assignmentId: reviewMatch[4],
      },
    };
  }

  return {
    activePage: 'dashboard',
    mode: 'create',
    assignmentId: '',
    reviewRoute: null,
  };
}

function toMkDateTime(value) {
  if (!value) {
    return 'Нема податок';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString('mk-MK');
}

function getContentBlockText(block) {
  if (!block || typeof block !== 'object') {
    return '';
  }

  return String(block.text || block.content || block.value || '').trim();
}

function mapTeacherStepAnswer(stepAnswer, index) {
  const derivedStatus =
    stepAnswer?.status ||
    (stepAnswer?.correct === true ? 'correct' : stepAnswer?.correct === false ? 'incorrect' : '');

  return {
    id: String(stepAnswer?.id ?? `step-answer-${index}`),
    assignmentStepId: String(
      stepAnswer?.assignment_step_id ??
        stepAnswer?.assignmentStepId ??
        stepAnswer?.assignment_step?.id ??
        stepAnswer?.assignmentStep?.id ??
        stepAnswer?.step_id ??
        stepAnswer?.stepId ??
        `step-${index}`
    ),
    answerText:
      stepAnswer?.answer_text ||
      stepAnswer?.answerText ||
      stepAnswer?.answer ||
      stepAnswer?.response_text ||
      stepAnswer?.responseText ||
      stepAnswer?.response ||
      stepAnswer?.student_answer ||
      stepAnswer?.studentAnswer ||
      '',
    status: derivedStatus || 'answered',
    correctAnswerText:
      stepAnswer?.correct_answer ||
      stepAnswer?.correctAnswer ||
      stepAnswer?.expected_answer ||
      stepAnswer?.expectedAnswer ||
      '',
  };
}

function getTeacherSubmissionStepAnswers(item) {
  const nestedSubmission = item?.submission || item?.assignment_submission || item?.student_submission;
  const stepAnswersSource =
    item?.step_answers ||
    item?.stepAnswers ||
    item?.submission_step_answers ||
    item?.submissionStepAnswers ||
    item?.answers ||
    item?.submission_answers ||
    nestedSubmission?.step_answers ||
    nestedSubmission?.stepAnswers ||
    nestedSubmission?.submission_step_answers ||
    nestedSubmission?.submissionStepAnswers ||
    [];

  if (Array.isArray(stepAnswersSource) && stepAnswersSource.length > 0) {
    return stepAnswersSource.map(mapTeacherStepAnswer);
  }

  const fallbackAnswerText =
    item?.answer_text ||
    item?.answerText ||
    item?.student_answer ||
    item?.studentAnswer ||
    item?.response_text ||
    item?.responseText ||
    nestedSubmission?.answer_text ||
    nestedSubmission?.answerText ||
    nestedSubmission?.student_answer ||
    nestedSubmission?.studentAnswer ||
    nestedSubmission?.response_text ||
    nestedSubmission?.responseText ||
    '';

  if (!fallbackAnswerText) {
    return [];
  }

  return [
    mapTeacherStepAnswer(
      {
        assignment_step_id:
          item?.assignment_step_id ||
          item?.assignmentStepId ||
          nestedSubmission?.assignment_step_id ||
          nestedSubmission?.assignmentStepId,
        answer_text: fallbackAnswerText,
        status:
          item?.status ||
          nestedSubmission?.status ||
          'answered',
        correct_answer:
          item?.correct_answer ||
          item?.correctAnswer ||
          nestedSubmission?.correct_answer ||
          nestedSubmission?.correctAnswer ||
          '',
      },
      0
    ),
  ];
}

function mapTeacherSubmissionSummary(item, index = 0) {
  const nestedSubmission = item?.submission || item?.assignment_submission || item?.student_submission;

  return {
    id: String(item?.id ?? item?.submission_id ?? nestedSubmission?.id ?? index),
    submissionId: String(item?.submission_id ?? item?.id ?? nestedSubmission?.id ?? index),
    assignmentId: String(
      item?.assignment_id ?? item?.assignment?.id ?? nestedSubmission?.assignment_id ?? ''
    ),
    assignmentTitle:
      item?.assignment_title ||
      item?.assignment?.title ||
      nestedSubmission?.assignment?.title ||
      'Задача',
    classroomId: String(item?.classroom_id ?? item?.classroom?.id ?? ''),
    classroomName: item?.classroom_name || item?.classroom?.name || '',
    status: item?.status || nestedSubmission?.status || 'submitted',
    statusLabel:
      (item?.status || nestedSubmission?.status) === 'reviewed'
        ? 'Прегледано'
        : (item?.status || nestedSubmission?.status) === 'submitted'
          ? 'Предадено'
          : (item?.status || nestedSubmission?.status) === 'in_progress'
            ? 'Во тек'
            : (item?.status || nestedSubmission?.status) === 'late'
              ? 'Задоцнето'
              : item?.status || nestedSubmission?.status || 'Нема податок',
    submittedAt: toMkDateTime(
      item?.submitted_at ||
        nestedSubmission?.submitted_at ||
        item?.updated_at ||
        item?.created_at
    ),
    totalScore:
      item?.total_score !== undefined && item?.total_score !== null
        ? String(item.total_score)
        : nestedSubmission?.total_score !== undefined && nestedSubmission?.total_score !== null
          ? String(nestedSubmission.total_score)
          : '',
    feedback: item?.feedback || nestedSubmission?.feedback || '',
    stepAnswers: getTeacherSubmissionStepAnswers(item),
  };
}

function mergeTeacherSubmissionSummary(existingSubmission, fallbackSubmission) {
  if (!existingSubmission) {
    return fallbackSubmission || null;
  }

  if (!fallbackSubmission) {
    return existingSubmission;
  }

  return {
    ...fallbackSubmission,
    ...existingSubmission,
    stepAnswers:
      existingSubmission.stepAnswers?.length > 0
        ? existingSubmission.stepAnswers
        : fallbackSubmission.stepAnswers || [],
    totalScore: existingSubmission.totalScore || fallbackSubmission.totalScore || '',
    feedback: existingSubmission.feedback || fallbackSubmission.feedback || '',
  };
}

function hasSavedSubmissionReview(submission) {
  if (!submission || typeof submission !== 'object') {
    return false;
  }

  if (submission.status === 'reviewed') {
    return true;
  }

  return Boolean(String(submission.feedback || '').trim());
}

function mapTeacherSubmissionReviewDetail(
  payload,
  fallbackStudent,
  fallbackSubmission,
  fallbackAssignmentId
) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const assignmentPayload = {
    ...(payload.assignment || {}),
    id: payload.assignment?.id ?? fallbackAssignmentId ?? '',
    steps: Array.isArray(payload.steps) ? payload.steps : payload.assignment?.steps || [],
    content_json: Array.isArray(payload.content_json)
      ? payload.content_json
      : payload.assignment?.content_json || [],
  };
  const mappedAssignment = mapTeacherAssignments([assignmentPayload])[0] || null;
  const mappedSubmission = mapTeacherSubmissionSummary({
    id: payload.id,
    submission_id: payload.id,
    assignment_id: payload.assignment?.id ?? fallbackSubmission?.assignmentId ?? fallbackAssignmentId,
    assignment_title: payload.assignment?.title || fallbackSubmission?.assignmentTitle,
    classroom_id: payload.assignment?.classroom?.id ?? fallbackSubmission?.classroomId,
    classroom_name: payload.assignment?.classroom?.name || fallbackSubmission?.classroomName,
    status: payload.status,
    submitted_at: payload.submitted_at,
    total_score: payload.grade?.score ?? payload.total_score,
    feedback: payload.grade?.feedback ?? payload.feedback,
    step_answers: payload.step_answers,
    submission: payload,
  });

  const rawStudent = payload.student || {};
  const mappedStudent = rawStudent.id || rawStudent.full_name || rawStudent.name
    ? {
        ...(fallbackStudent || {}),
        id: String(rawStudent.id ?? fallbackStudent?.id ?? ''),
        fullName:
          rawStudent.full_name ||
          rawStudent.name ||
          fallbackStudent?.fullName ||
          'Ученик',
      }
    : fallbackStudent || null;

  return {
    student: mappedStudent,
    assignment: mappedAssignment,
    submission: mergeTeacherSubmissionSummary(fallbackSubmission, mappedSubmission),
  };
}

function mapTeacherAssignmentStep(step, index) {
  const contentBlocks = Array.isArray(step?.content_json) ? step.content_json : [];
  const answerKeys = Array.isArray(step?.answer_keys) ? step.answer_keys : [];

  return {
    ...step,
    id: String(step?.id ?? `step-${index}`),
    position: step?.position ?? index + 1,
    title: step?.title || `Чекор ${index + 1}`,
    content: step?.content || step?.prompt || '',
    prompt: step?.prompt || step?.content || '',
    resource_url: step?.resource_url || '',
    example_answer: step?.example_answer || '',
    step_type: step?.step_type || 'text',
    required: step?.required !== false,
    evaluation_mode: step?.evaluation_mode || 'manual',
    content_json: contentBlocks,
    contentBlocks,
    answer_keys: answerKeys,
    answerKeys,
    contentText: contentBlocks.map(getContentBlockText).filter(Boolean).join('\n'),
  };
}

function mapClassrooms(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => ({
    id: String(item.id ?? item.name ?? `classroom-${index}`),
    name:
      item.name ||
      `${item.grade_level || item.grade || ''}-${item.section || ''}`.trim() ||
      'Клас',
    gradeLevel: item.grade_level || item.grade || 'Нема податок',
    academicYear: item.academic_year || 'Нема податок',
    schoolName: item.school?.name || '',
    students: item.student_count ?? item.students_count ?? 0,
    assignmentCount: item.assignment_count ?? item.active_assignments_count ?? 0,
    homeroomTeacherName:
      item.homeroom_teacher_name || item.homeroom_teacher?.full_name || '',
    isHomeroom: Boolean(item.is_homeroom || item.homeroom_assignment?.active),
  }));
}

function mapSubjects(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  const mapTopic = (topic, index) => ({
    id: String(topic?.id ?? `topic-${index}`),
    name: topic?.name || topic?.title || 'Тема',
  });

  return payload.map((subject, index) => ({
    id: String(subject.id ?? `subject-${index}`),
    name: subject.name || 'Предмет',
    code: subject.code || '',
    topics: Array.isArray(subject.topics)
      ? subject.topics.map(mapTopic)
      : Array.isArray(subject.subject_topics)
        ? subject.subject_topics.map(mapTopic)
        : [],
  }));
}

function mapReviewQueue(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => ({
    id: String(
      item.id ||
        `${item.assignment_id || item.assignment?.id || 'assignment'}-${item.student_id || item.student?.id || index}`
    ),
    submissionId: String(item.submission_id || item.id || `submission-${index}`),
    studentId: String(item.student_id || item.student?.id || `student-${index}`),
    studentName: item.student_name || item.student?.full_name || item.student?.name || 'Ученик',
    classroomId: String(item.classroom_id || item.classroom?.id || item.class_id || ''),
    className: item.classroom_name || item.classroom?.name || item.class_name || 'Клас',
    assignmentId: String(item.assignment_id || item.assignment?.id || ''),
    assignmentTitle: item.assignment_title || item.assignment?.title || item.title || 'Задача',
    submittedAt: toMkDateTime(item.submitted_at || item.created_at || item.updated_at),
    status: item.status || 'За преглед',
  }));
}

function mapCalendarEvents(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((event, index) => ({
    id: String(event.id || `${event.title || 'event'}-${index}`),
    title: event.title || event.name || 'Настан',
    when: toMkDateTime(event.starts_at || event.start_time || event.date),
  }));
}

function mapNotificationsFromReviewQueue(reviewQueue) {
  if (!Array.isArray(reviewQueue)) {
    return [];
  }

  return reviewQueue.map((item) => ({
    id: `review-${item.id}`,
    title: `За преглед: ${item.assignmentTitle}`,
    detail: `${item.studentName} · ${item.className}`,
    time: item.submittedAt,
  }));
}

function mapHomerooms(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.homerooms)
      ? payload.homerooms
      : [];

  return list.map((item, index) => ({
    id: String(item.id ?? item.classroom_id ?? `homeroom-${index}`),
    classroomId: String(item.classroom_id ?? item.classroom?.id ?? `classroom-${index}`),
    classroomName: item.classroom?.name || item.classroom_name || 'Клас',
    teacherName: item.teacher?.full_name || item.teacher_name || '',
    active: item.active !== false,
  }));
}

function mapAnnouncements(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.announcements)
      ? payload.announcements
      : [];

  return list.map((item, index) => {
    const priority = item.priority || 'normal';
    return {
      id: String(item.id ?? `announcement-${index}`),
      title: item.title || 'Известување',
      body: item.body || '',
      fileUrl: item.file_url || item.uploaded_file?.url || '',
      uploadedFile: item.uploaded_file || null,
      status: item.status || 'draft',
      priority,
      priorityLabel:
        priority === 'urgent' ? 'Итно' : priority === 'important' ? 'Важно' : 'Нормално',
      audienceType: item.audience_type || 'school',
      publishedAt: item.published_at || null,
      classroomName: item.classroom?.name || item.classroom_name || '',
      subjectName: item.subject?.name || item.subject_name || '',
      authorName: item.author?.full_name || item.author_name || '',
    };
  });
}

function mapAnnouncementsToNotifications(payload) {
  return mapAnnouncements(payload).map((item) => ({
    id: `announcement-${item.id}`,
    title: item.title,
    detail:
      item.body ||
      [item.classroomName, item.subjectName, item.priorityLabel].filter(Boolean).join(' · ') ||
      'Објавено известување',
    time: toMkDateTime(item.publishedAt),
  }));
}

function mapAttendanceRecords(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.attendance_records)
      ? payload.attendance_records
      : [];

  return list.map((item, index) => ({
    id: String(item.id ?? `attendance-${index}`),
    studentId: String(item.student?.id ?? item.student_id ?? `student-${index}`),
    studentName: item.student?.full_name || item.student_name || 'Ученик',
    status: item.status || 'present',
    note: item.note || '',
    date: item.attendance_date || '',
    subjectName: item.subject?.name || item.subject_name || '',
  }));
}

function mapPerformanceOverview(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    classroomName: payload.classroom_name || 'Клас',
    periodType: payload.period_type || 'monthly',
    averageGrade: payload.average_grade || '0',
    averageAttendanceRate: payload.average_attendance_rate || '0',
    averageEngagementScore: payload.average_engagement_score || '0',
    studentCount: payload.student_count || 0,
    students: Array.isArray(payload.students)
      ? payload.students.map((student, index) => ({
          id: String(student.student_id ?? index),
          name: student.student_name || 'Ученик',
          averageGrade: student.average_grade || '0',
          attendanceRate: student.attendance_rate || '0',
          engagementScore: student.engagement_score || '0',
          completedAssignmentsCount: student.completed_assignments_count || 0,
          overdueAssignmentsCount: student.overdue_assignments_count || 0,
        }))
      : [],
  };
}

function mapClassroomDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    id: String(payload.id ?? ''),
    name: payload.name || 'Клас',
    gradeLevel: payload.grade_level || payload.grade || 'Нема податок',
    academicYear: payload.academic_year || 'Нема податок',
    students: Array.isArray(payload.students)
      ? payload.students.map((student, index) => ({
          id: String(student.id ?? index),
          fullName:
            student.full_name ||
            student.name ||
            [student.first_name, student.last_name].filter(Boolean).join(' ') ||
            'Ученик',
          email: student.email || '',
          submissionRate: student.submission_rate ?? null,
          averageGrade: student.average_grade ?? null,
        }))
      : [],
    subjects: Array.isArray(payload.subjects)
      ? payload.subjects.map((subject, index) => ({
          id: String(subject.id ?? index),
          name: subject.name || 'Предмет',
          code: subject.code || '',
        }))
      : [],
    activeAssignments: Array.isArray(payload.active_assignments || payload.assignments)
      ? (payload.active_assignments || payload.assignments).map((assignment, index) => ({
          id: String(assignment.id ?? index),
          title: assignment.title || 'Задача',
          status: assignment.status || 'published',
          dueAt: toMkDateTime(assignment.due_at),
        }))
      : [],
  };
}

function mapTeacherStudentDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const student = payload.student || {};

  const recentSubmissions = Array.isArray(payload.recent_submissions || payload.submissions)
    ? (payload.recent_submissions || payload.submissions).map(mapTeacherSubmissionSummary)
    : [];

  return {
    id: String(student.id ?? ''),
    fullName:
      student.full_name ||
      student.name ||
      [student.first_name, student.last_name].filter(Boolean).join(' ') ||
      'Ученик',
    email: student.email || 'Нема податок',
    classrooms: Array.isArray(payload.classrooms)
      ? payload.classrooms.map((item, index) => ({
          id: String(item.id ?? index),
          name: item.name || 'Клас',
        }))
      : [],
    subjects: Array.isArray(payload.subjects)
      ? payload.subjects.map((item, index) => ({
          id: String(item.id ?? index),
          name: item.name || 'Предмет',
          currentGrade: item.current_grade ?? 'Нема податок',
          missingAssignments: item.missing_assignments ?? 0,
        }))
      : [],
    recentSubmissions,
  };
}

function buildGradebookRows(students, studentDetailsMap, assignmentIds = []) {
  const normalizedAssignmentIds = assignmentIds.map((id) => String(id));

  return (Array.isArray(students) ? students : []).map((student, index) => {
    const studentId = String(student?.id ?? index);
    const studentDetails = studentDetailsMap.get(studentId);
    const submissionLookup = {};

    (studentDetails?.recentSubmissions || []).forEach((submission) => {
      const assignmentId = String(submission?.assignmentId || '');
      if (!assignmentId) {
        return;
      }

      const currentSubmission = submissionLookup[assignmentId];
      const nextHasScore =
        submission?.totalScore !== undefined &&
        submission?.totalScore !== null &&
        submission?.totalScore !== '';
      const currentHasScore =
        currentSubmission?.totalScore !== undefined &&
        currentSubmission?.totalScore !== null &&
        currentSubmission?.totalScore !== '';

      if (!currentSubmission) {
        submissionLookup[assignmentId] = submission;
        return;
      }

      if (currentSubmission.status !== 'reviewed' && submission.status === 'reviewed') {
        submissionLookup[assignmentId] = submission;
        return;
      }

      if (!currentHasScore && nextHasScore) {
        submissionLookup[assignmentId] = submission;
      }
    });

    normalizedAssignmentIds.forEach((assignmentId) => {
      if (!(assignmentId in submissionLookup)) {
        submissionLookup[assignmentId] = null;
      }
    });

    return {
      id: studentId,
      fullName: student?.fullName || studentDetails?.fullName || 'Ученик',
      email: student?.email || studentDetails?.email || '',
      averageGrade: student?.averageGrade ?? null,
      submissionRate: student?.submissionRate ?? null,
      submissionsByAssignment: submissionLookup,
    };
  });
}

function mapTeacherAssignments(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.assignments)
      ? payload.assignments
      : [];

  return list.map((assignment, index) => ({
    id: String(assignment.id ?? index),
    title: assignment.title || 'Задача',
    subjectTopicId: String(
      assignment.subject_topic_id ?? assignment.subject_topic?.id ?? ''
    ),
    topic:
      assignment.subject_topic?.name ||
      assignment.subject_topic?.title ||
      assignment.topic?.name ||
      assignment.topic?.title ||
      assignment.topic_name ||
      assignment.topic_title ||
      assignment.topic ||
      '',
    description: assignment.description || '',
    teacherNotes: assignment.teacher_notes || '',
    status: assignment.status || 'draft',
    type: assignment.assignment_type || 'Задача',
    dueDate:
      typeof assignment.due_at === 'string' && assignment.due_at.includes('T')
        ? assignment.due_at.slice(0, 10)
        : assignment.due_at || '',
    dueAt: toMkDateTime(assignment.due_at),
    publishedAt: assignment.published_at ? toMkDateTime(assignment.published_at) : '',
    classroomId: String(assignment.classroom?.id ?? assignment.classroom_id ?? ''),
    classroomName: assignment.classroom?.name || assignment.classroom_name || 'Клас',
    subjectId: String(assignment.subject?.id ?? assignment.subject_id ?? ''),
    subjectName: assignment.subject?.name || assignment.subject_name || 'Предмет',
    submissionCount: assignment.submission_count ?? 0,
    maxPoints:
      assignment.max_points !== undefined && assignment.max_points !== null
        ? String(assignment.max_points)
        : '',
    resourcesCount: Array.isArray(assignment.resources) ? assignment.resources.length : 0,
    resources: Array.isArray(assignment.resources) ? assignment.resources : [],
    stepsCount: Array.isArray(assignment.steps) ? assignment.steps.length : 0,
    steps: Array.isArray(assignment.steps) ? assignment.steps.map(mapTeacherAssignmentStep) : [],
    contentBlocksCount: Array.isArray(assignment.content_json) ? assignment.content_json.length : 0,
    contentJson: Array.isArray(assignment.content_json) ? assignment.content_json : [],
    contentBlocks: Array.isArray(assignment.content_json) ? assignment.content_json : [],
    contentJsonText: Array.isArray(assignment.content_json)
      ? assignment.content_json
          .map((block) => block?.text || block?.content || '')
          .filter(Boolean)
          .join('\n')
      : '',
  }));
}

function inferAssignmentResourceType(file) {
  const contentType = file?.type || '';

  if (contentType === 'application/pdf') {
    return 'pdf';
  }
  if (contentType.startsWith('image/')) {
    return 'image';
  }
  if (contentType.startsWith('video/')) {
    return 'video';
  }

  return 'file';
}

function buildAssignmentContentBlocks(rawText) {
  return String(rawText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({
      type: index === 0 ? 'paragraph' : 'instruction',
      text,
    }));
}

function buildAssignmentPayload(form, contentBlocks) {
  return {
    title: form.title || 'Нова задача',
    description: form.description,
    due_at: form.dueDate || null,
    assignment_type: form.type,
    classroom_id: Number(form.classroomId),
    subject_id: Number(form.subjectId),
    subject_topic_id: form.subjectTopicId ? Number(form.subjectTopicId) : null,
    teacher_notes: form.teacherNotes || null,
    content_json: contentBlocks,
    max_points: form.points ? Number(form.points) : null,
  };
}

function buildStepAnswerKeys(step) {
  if (step.evaluationMode === 'manual') {
    return [];
  }

  const values = String(step.answerKeysText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return values.map((value, index) => ({
    value,
    position: index + 1,
    tolerance:
      step.evaluationMode === 'numeric' && step.tolerance !== ''
        ? Number(step.tolerance)
        : null,
    case_sensitive:
      step.evaluationMode === 'normalized_text' || step.evaluationMode === 'regex'
        ? Boolean(step.caseSensitive)
        : false,
    metadata: {},
  }));
}

function buildAssignmentStepPayload(step, index) {
  return {
    position: index + 1,
    title: step.title.trim(),
    content: step.content.trim(),
    prompt: step.prompt.trim() || step.content.trim(),
    resource_url: step.resourceUrl?.trim() || '',
    example_answer: step.exampleAnswer?.trim() || '',
    step_type: step.stepType || 'text',
    required: step.required !== false,
    evaluation_mode: step.evaluationMode || 'manual',
    metadata: {},
    content_json: buildAssignmentContentBlocks(step.contentJsonText),
    answer_keys: buildStepAnswerKeys(step),
  };
}

function mapAssignmentRoster(classroomPayload, assignmentId) {
  const students = Array.isArray(classroomPayload?.students) ? classroomPayload.students : [];
  if (students.length === 0 || !assignmentId) {
    return [];
  }

  return students.map((student, index) => {
    const studentId = String(student.id ?? index);

    return {
      id: studentId,
      fullName:
        student.fullName ||
        [student.first_name, student.last_name].filter(Boolean).join(' ') ||
        'Ученик',
      email: student.email || '',
      status: 'unknown',
      statusLabel: 'Нема податок',
      submittedAt: '',
      totalScore: '',
    };
  });
}

function buildActivitiesFromClasses(classes) {
  if (!Array.isArray(classes) || classes.length === 0) {
    return [];
  }

  return classes.map(
    (item) =>
      `${item.name} (${item.academicYear}): ${item.students} ученици, ${item.assignmentCount} активни задачи`
  );
}

function buildOverview(dashboard, classes, reviewQueue, upcomingEvents) {
  if (dashboard) {
    return [
      { label: 'Мои класови', value: dashboard.classroom_count ?? classes.length },
      { label: 'Вкупно ученици', value: dashboard.student_count ?? 0 },
      { label: 'Активни задачи', value: dashboard.active_assignments ?? 0 },
      {
        label: 'Непрегледани предавања',
        value: Array.isArray(dashboard.review_queue) ? dashboard.review_queue.length : reviewQueue.length,
      },
      {
        label: 'Наредни настани',
        value: Array.isArray(dashboard.upcoming_calendar_events)
          ? dashboard.upcoming_calendar_events.length
          : upcomingEvents.length,
      },
    ];
  }

  return [
    { label: 'Мои класови', value: classes.length },
    {
      label: 'Вкупно ученици',
      value: classes.reduce((sum, item) => sum + item.students, 0),
    },
    {
      label: 'Активни задачи',
      value: classes.reduce((sum, item) => sum + item.assignmentCount, 0),
    },
    { label: 'Непрегледани предавања', value: reviewQueue.length },
    { label: 'Наредни настани', value: upcomingEvents.length },
  ];
}

function TeacherArea({
  theme,
  onToggleTheme,
  onThemeModeChange,
  onLogout,
  onNotify,
  school,
  schoolId,
  accessibility,
  preferencesLoading,
  preferencesSaving,
  onSaveAccessibility,
  themeColor,
  onThemeColorChange,
}) {
  const initialRoute = getTeacherRouteState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const announcementFileInputRef = useRef(null);
  const [activePage, setActivePage] = useState(initialRoute.activePage);
  const [assignmentEditorMode, setAssignmentEditorMode] = useState(initialRoute.mode);
  const [editingAssignmentId, setEditingAssignmentId] = useState(initialRoute.assignmentId);
  const [submissionReviewRoute, setSubmissionReviewRoute] = useState(initialRoute.reviewRoute);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [overviewCards, setOverviewCards] = useState(EMPTY_OVERVIEW);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [weeklyScheduleSlots, setWeeklyScheduleSlots] = useState([]);
  const [homerooms, setHomerooms] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    priority: 'normal',
    audience_type: 'school',
    classroomId: '',
    file: null,
  });
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [classroomDetailsLoading, setClassroomDetailsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedReviewStudentId, setSelectedReviewStudentId] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [assignmentListFilter, setAssignmentListFilter] = useState('all');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('all');
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [assignmentDetailsLoading, setAssignmentDetailsLoading] = useState(false);
  const [assignmentRoster, setAssignmentRoster] = useState([]);
  const [assignmentRosterLoading, setAssignmentRosterLoading] = useState(false);
  const [assignmentStatusDraft, setAssignmentStatusDraft] = useState('draft');
  const [assignmentStatusSaving, setAssignmentStatusSaving] = useState(false);
  const [assignmentStatusError, setAssignmentStatusError] = useState('');
  const [gradebookRows, setGradebookRows] = useState([]);
  const [gradebookLoading, setGradebookLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [performanceOverview, setPerformanceOverview] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [createError, setCreateError] = useState('');
  const [submissionReview, setSubmissionReview] = useState(null);
  const [submissionReviewLoading, setSubmissionReviewLoading] = useState(false);
  const [submissionReviewSaving, setSubmissionReviewSaving] = useState(false);
  const [submissionReviewError, setSubmissionReviewError] = useState('');
  const [submissionGradeDraft, setSubmissionGradeDraft] = useState('');
  const [submissionFeedbackDraft, setSubmissionFeedbackDraft] = useState('');
  const [isSubmissionReviewEditing, setIsSubmissionReviewEditing] = useState(false);

  const syncTeacherLocation = (nextPage, options = {}) => {
    if (typeof window === 'undefined') {
      return;
    }

    const pathname = getTeacherPagePath(nextPage, {
      ...options,
      schoolName: options.schoolName || school || 'school',
    });

    if (window.location.pathname === pathname) {
      return;
    }

    const method = options.replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', pathname);
  };

  const navigateTeacherPage = (nextPage, options = {}) => {
    setActivePage(nextPage);
    if (nextPage === 'assignment-editor') {
      setSubmissionReviewRoute(null);
      syncTeacherLocation(nextPage, options);
      return;
    }
    if (nextPage === 'submission-review') {
      setSubmissionReviewRoute({
        schoolSlug: slugifyPathSegment(options.schoolName || school || 'school'),
        classSlug: slugifyPathSegment(options.className || 'class'),
        studentSlug: slugifyPathSegment(options.studentName || 'student'),
        assignmentId: String(options.assignmentId || ''),
      });
      setSelectedReviewStudentId(String(options.studentId || ''));
      setSelectedAssignmentId(String(options.assignmentId || ''));
      setSelectedStudentId(String(options.studentId || ''));
      if (options.classroomId) {
        setSelectedClassroomId(String(options.classroomId));
      }
      syncTeacherLocation(nextPage, options);
      return;
    }
    setSubmissionReviewRoute(null);
    syncTeacherLocation(nextPage, { replace: options.replace });
  };

  const resetAssignmentEditor = () => {
    setAssignmentEditorMode('create');
    setEditingAssignmentId('');
    setEditingAssignment(null);
    setCreateError('');
  };

  const openCreatePage = () => {
    setCreateError('');
    setAssignmentEditorMode('create');
    setEditingAssignmentId('');
    setEditingAssignment(null);
    navigateTeacherPage('assignment-editor', { mode: 'create' });
  };

  const openEditPage = () => {
    if (!assignmentDetails || assignmentDetails.status === 'published') {
      return;
    }
    setCreateError('');
    setAssignmentEditorMode('edit');
    setEditingAssignmentId(assignmentDetails.id);
    setEditingAssignment(assignmentDetails);
    navigateTeacherPage('assignment-editor', {
      mode: 'edit',
      assignmentId: assignmentDetails.id,
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = () => {
      const route = getTeacherRouteState(window.location.pathname);
      setActivePage(route.activePage);
      setAssignmentEditorMode(route.mode);
      setEditingAssignmentId(route.assignmentId);
      setSubmissionReviewRoute(route.reviewRoute);
      setSelectedReviewStudentId('');
      setSubmissionReview(null);
      setSubmissionReviewError('');
      if (route.mode === 'create') {
        setEditingAssignment(null);
      }
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

    const normalizedPath = getTeacherPagePath(activePage, {
      mode: assignmentEditorMode,
      assignmentId:
        activePage === 'submission-review'
          ? submissionReviewRoute?.assignmentId
          : editingAssignmentId,
      schoolName: school || 'school',
      className: submissionReviewRoute?.classSlug || 'class',
      studentName: submissionReviewRoute?.studentSlug || 'student',
    });

    const legacyTeacherPath =
      window.location.pathname === '/' ||
      window.location.pathname === '/assignment/new' ||
      /^\/assignment\/[^/]+\/edit$/.test(window.location.pathname) ||
      (activePage === 'submission-review' &&
        /^\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(window.location.pathname));

    if (legacyTeacherPath && window.location.pathname !== normalizedPath) {
      window.history.replaceState({}, '', normalizedPath);
    }
  }, [activePage, assignmentEditorMode, editingAssignmentId, school, submissionReviewRoute]);

  useEffect(() => {
    let isMounted = true;

    const loadTeacherData = async () => {
      setLoadError('');
      const shouldLoadDashboard = activePage === 'dashboard' || activePage === 'notifications';
      const shouldLoadSchedule = activePage === 'calendar';
      const shouldLoadClasses =
        activePage === 'dashboard' ||
        activePage === 'classes' ||
        activePage === 'students' ||
        activePage === 'grades' ||
        activePage === 'attendance' ||
        activePage === 'reports' ||
        activePage === 'announcements' ||
        activePage === 'assignment-editor' ||
        activePage === 'submission-review';
      const shouldLoadHomerooms = SHOW_HOMEROOM_UI && (activePage === 'dashboard' || activePage === 'profile');
      const shouldLoadAnnouncements =
        activePage === 'announcements' || activePage === 'notifications';
      const shouldLoadSubjects =
        activePage === 'assignment-editor' || activePage === 'profile' || activePage === 'students';
      const shouldLoadAssignments = activePage === 'assignments' || activePage === 'grades';

      if (shouldLoadAssignments) {
        setAssignmentsLoading(true);
      }

      const requestEntries = [
        ['me', api.me()],
        ...(shouldLoadDashboard ? [['dashboard', api.teacherDashboard()]] : []),
        ...(shouldLoadSchedule ? [['schedule', api.teacherSchedule()]] : []),
        ...(shouldLoadClasses ? [['classrooms', api.teacherClassrooms()]] : []),
        ...(shouldLoadHomerooms ? [['homerooms', api.teacherHomerooms()]] : []),
        ...(shouldLoadAnnouncements
          ? [['announcements', api.announcements({ status: 'published' })]]
          : []),
        ...(shouldLoadSubjects ? [['subjects', api.teacherSubjects()]] : []),
        ...(shouldLoadAssignments ? [['assignments', api.assignments()]] : []),
      ];

      const requestResults = await Promise.allSettled(requestEntries.map(([, request]) => request));

      if (!isMounted) {
        return;
      }

      const resultByKey = Object.fromEntries(
        requestEntries.map(([key], index) => [key, requestResults[index]])
      );
      const meResult = resultByKey.me;
      const dashboardResult = resultByKey.dashboard;
      const scheduleResult = resultByKey.schedule;
      const classroomsResult = resultByKey.classrooms;
      const homeroomsResult = resultByKey.homerooms;
      const announcementsResult = resultByKey.announcements;
      const teacherSubjectsResult = resultByKey.subjects;
      const assignmentsResult = resultByKey.assignments;

      const mePayload = meResult?.status === 'fulfilled' ? meResult.value : null;
      const dashboardPayload = dashboardResult?.status === 'fulfilled' ? dashboardResult.value : null;
      const classroomsPayload =
        classroomsResult?.status === 'fulfilled'
          ? Array.isArray(classroomsResult.value)
            ? classroomsResult.value
            : classroomsResult.value?.classrooms || []
          : [];

      const teacherClasses = mapClassrooms(classroomsPayload);
      const homeroomItems =
        shouldLoadHomerooms && homeroomsResult?.status === 'fulfilled'
          ? mapHomerooms(homeroomsResult.value)
          : [];
      const homeroomByClassroomId = new Map(
        homeroomItems.map((item) => [item.classroomId, item])
      );
      const mappedClasses = teacherClasses.map((item) => {
        const homeroom = homeroomByClassroomId.get(item.id);
        return homeroom
          ? {
              ...item,
              homeroomTeacherName: homeroom.teacherName,
              isHomeroom: homeroom.active,
            }
          : item;
      });
      const mappedSubjects =
        teacherSubjectsResult?.status === 'fulfilled'
          ? mapSubjects(teacherSubjectsResult.value)
          : [];
      const mappedReviewQueue = mapReviewQueue(dashboardPayload?.review_queue);
      const mappedCalendarItems = mapCalendarEvents(dashboardPayload?.upcoming_calendar_events);
      const mappedWeeklyScheduleSlots =
        scheduleResult?.status === 'fulfilled' && Array.isArray(scheduleResult.value?.slots)
          ? scheduleResult.value.slots
          : [];
      const mappedAnnouncements =
        Array.isArray(dashboardPayload?.announcement_feed)
          ? mapAnnouncements(dashboardPayload.announcement_feed)
          : announcementsResult?.status === 'fulfilled'
            ? mapAnnouncements(announcementsResult.value)
            : [];
      const mappedAnnouncementNotifications =
        Array.isArray(dashboardPayload?.announcement_feed)
          ? mapAnnouncementsToNotifications(dashboardPayload.announcement_feed)
          : announcementsResult?.status === 'fulfilled'
            ? mapAnnouncementsToNotifications(announcementsResult.value)
            : [];
      const mappedHomerooms =
        SHOW_HOMEROOM_UI &&
        Array.isArray(dashboardPayload?.homerooms) &&
        dashboardPayload.homerooms.length > 0
          ? mapHomerooms(dashboardPayload.homerooms)
          : homeroomItems;
      const mappedAssignments =
        assignmentsResult?.status === 'fulfilled'
          ? mapTeacherAssignments(assignmentsResult.value)
          : [];

      if (shouldLoadClasses || activePage === 'dashboard') {
        setClasses(mappedClasses);
        setActivities(buildActivitiesFromClasses(mappedClasses));
        setSelectedClassroomId((current) => current || mappedClasses[0]?.id || '');
      }

      if (shouldLoadSubjects) {
        setSubjects(mappedSubjects);
      }

      if (shouldLoadHomerooms) {
        setHomerooms(mappedHomerooms);
      }

      if (shouldLoadAnnouncements || activePage === 'dashboard') {
        setAnnouncements(mappedAnnouncements);
      }

      if (shouldLoadAssignments) {
        setTeacherAssignments(mappedAssignments);
        setSelectedAssignmentId((current) => current || mappedAssignments[0]?.id || '');
      }

      if (shouldLoadDashboard) {
        setReviewQueue(mappedReviewQueue);
        setCalendarItems(mappedCalendarItems);
        setNotifications([
          ...mapNotificationsFromReviewQueue(mappedReviewQueue),
          ...mappedAnnouncementNotifications,
        ]);
        setOverviewCards(
          buildOverview(dashboardPayload, mappedClasses, mappedReviewQueue, mappedCalendarItems)
        );
      }

      if (shouldLoadSchedule) {
        setWeeklyScheduleSlots(mappedWeeklyScheduleSlots);
      }

      setTeacherEmail(mePayload?.user?.email || '');
      setTeacherName(dashboardPayload?.teacher?.full_name || mePayload?.user?.full_name || '');

      if (
        requestResults.length > 0 &&
        requestResults.every((result) => result.status === 'rejected')
      ) {
        setLoadError('Не успеа вчитувањето на наставничките податоци.');
      }

      if (shouldLoadAssignments) {
        setAssignmentsLoading(false);
      }
    };

    loadTeacherData().catch(() => {
      if (isMounted) {
        setLoadError('Не успеа вчитувањето на наставничките податоци.');
        if (activePage === 'assignments') {
          setAssignmentsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activePage, schoolId]);

  useEffect(() => {
    if (!['classes', 'students', 'grades', 'reports'].includes(activePage)) {
      return;
    }

    if (!selectedClassroomId) {
      setClassroomDetails(null);
      return;
    }

    let isMounted = true;
    setClassroomDetailsLoading(true);
    api
      .teacherClassroomDetails(selectedClassroomId)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setClassroomDetails(mapClassroomDetails(response));
      })
      .catch(() => {
        if (isMounted) {
          setClassroomDetails(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setClassroomDetailsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, selectedClassroomId]);

  useEffect(() => {
    if (activePage !== 'attendance') {
      return;
    }

    if (!selectedClassroomId) {
      setAttendanceRecords([]);
      return;
    }

    let isMounted = true;
    setAttendanceLoading(true);

    api
      .classroomAttendance(selectedClassroomId)
      .then((response) => {
        if (isMounted) {
          setAttendanceRecords(mapAttendanceRecords(response));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAttendanceRecords([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setAttendanceLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, selectedClassroomId]);

  useEffect(() => {
    if (activePage !== 'reports') {
      return;
    }

    if (!selectedClassroomId) {
      setPerformanceOverview(null);
      return;
    }

    let isMounted = true;
    setReportsLoading(true);

    api
      .classroomPerformanceOverview(selectedClassroomId)
      .then((response) => {
        if (isMounted) {
          setPerformanceOverview(mapPerformanceOverview(response));
        }
      })
      .catch(() => {
        if (isMounted) {
          setPerformanceOverview(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setReportsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, selectedClassroomId]);

  useEffect(() => {
    if (!['assignments', 'assignment-editor', 'grades'].includes(activePage)) {
      return;
    }

    if (!selectedAssignmentId) {
      setAssignmentDetails(null);
      setAssignmentRoster([]);
      return;
    }

    let isMounted = true;
    setAssignmentDetailsLoading(true);

    api
      .assignmentDetails(selectedAssignmentId)
      .then((response) => {
        if (isMounted) {
          const mappedAssignment = mapTeacherAssignments([response])[0] || null;
          setAssignmentDetails(mappedAssignment);
          setAssignmentStatusDraft(mappedAssignment?.status || 'draft');
          setAssignmentStatusError('');
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallbackAssignment =
            teacherAssignments.find((item) => item.id === String(selectedAssignmentId)) || null;
          setAssignmentDetails(fallbackAssignment);
          setAssignmentStatusDraft(fallbackAssignment?.status || 'draft');
        }
      })
      .finally(() => {
        if (isMounted) {
          setAssignmentDetailsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, selectedAssignmentId, teacherAssignments]);

  useEffect(() => {
    if (activePage !== 'grades') {
      return;
    }

    if (!assignmentDetails?.classroomId || !assignmentDetails?.id) {
      setAssignmentRoster([]);
      return;
    }

    let isMounted = true;
    setAssignmentRosterLoading(true);

    api
      .teacherClassroomDetails(assignmentDetails.classroomId)
      .then((classroomResponse) => {
        const mappedClassroom = mapClassroomDetails(classroomResponse);

        if (isMounted) {
          setAssignmentRoster(mapAssignmentRoster(mappedClassroom, assignmentDetails.id));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAssignmentRoster([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setAssignmentRosterLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, assignmentDetails]);

  useEffect(() => {
    if (!['assignments', 'grades'].includes(activePage)) {
      return;
    }

    const classroomAssignments = teacherAssignments.filter((assignment) =>
      selectedClassroomId ? String(assignment.classroomId) === String(selectedClassroomId) : true
    );

    if (classroomAssignments.length === 0) {
      if (activePage === 'grades') {
        setSelectedAssignmentId('');
      }
      return;
    }

    const selectionIsVisible = classroomAssignments.some(
      (assignment) => String(assignment.id) === String(selectedAssignmentId)
    );

    if (!selectionIsVisible) {
      setSelectedAssignmentId(classroomAssignments[0].id);
    }
  }, [activePage, selectedClassroomId, teacherAssignments, selectedAssignmentId]);

  useEffect(() => {
    if (activePage !== 'grades') {
      return;
    }

    const classroomStudents = Array.isArray(classroomDetails?.students) ? classroomDetails.students : [];
    if (!selectedClassroomId || classroomStudents.length === 0) {
      setGradebookRows([]);
      setGradebookLoading(false);
      return;
    }

    const classroomAssignments = teacherAssignments.filter(
      (assignment) => String(assignment.classroomId) === String(selectedClassroomId)
    );
    const assignmentIds = classroomAssignments.map((assignment) => String(assignment.id));
    let isMounted = true;

    setGradebookLoading(true);

    Promise.allSettled(classroomStudents.map((student) => api.teacherStudentDetails(student.id)))
      .then((results) => {
        if (!isMounted) {
          return;
        }

        const studentDetailsMap = new Map();

        results.forEach((result, index) => {
          if (result.status !== 'fulfilled') {
            return;
          }

          const mappedStudent = mapTeacherStudentDetails(result.value);
          const studentId = String(classroomStudents[index]?.id ?? '');
          if (mappedStudent && studentId) {
            studentDetailsMap.set(studentId, mappedStudent);
          }
        });

        setGradebookRows(buildGradebookRows(classroomStudents, studentDetailsMap, assignmentIds));
      })
      .catch(() => {
        if (isMounted) {
          setGradebookRows(buildGradebookRows(classroomStudents, new Map(), assignmentIds));
        }
      })
      .finally(() => {
        if (isMounted) {
          setGradebookLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, selectedClassroomId, classroomDetails, teacherAssignments]);

  useEffect(() => {
    if (activePage !== 'assignment-editor' || assignmentEditorMode !== 'edit' || !editingAssignmentId) {
      return;
    }

    if (editingAssignment?.id === String(editingAssignmentId)) {
      return;
    }

    let isMounted = true;

    api
      .assignmentDetails(editingAssignmentId)
      .then((response) => {
        if (!isMounted) {
          return;
        }
        const mappedAssignment = mapTeacherAssignments([response])[0] || null;
        setEditingAssignment(mappedAssignment);
        if (mappedAssignment) {
          setSelectedAssignmentId(mappedAssignment.id);
          setAssignmentDetails(mappedAssignment);
          setAssignmentStatusDraft(mappedAssignment.status || 'draft');
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        const fallbackAssignment =
          teacherAssignments.find((item) => item.id === String(editingAssignmentId)) || null;
        setEditingAssignment(fallbackAssignment);
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, assignmentEditorMode, editingAssignmentId, editingAssignment, teacherAssignments]);

  const handleAssignmentStatusSave = async () => {
    if (!assignmentDetails?.id) {
      return;
    }

    setAssignmentStatusSaving(true);
    setAssignmentStatusError('');

    try {
      const response =
        assignmentStatusDraft === 'published' && assignmentDetails.status !== 'published'
          ? await api.publishAssignment(assignmentDetails.id)
          : await api.updateAssignment(assignmentDetails.id, {
              status: assignmentStatusDraft,
            });
      const mappedAssignment = mapTeacherAssignments([response])[0] || null;

      if (mappedAssignment) {
        setAssignmentDetails(mappedAssignment);
        setTeacherAssignments((previous) =>
          previous.map((item) =>
            item.id === mappedAssignment.id ? { ...item, ...mappedAssignment } : item
          )
        );
        setClasses((previous) =>
          previous.map((item) =>
            item.id === mappedAssignment.classroomId
              ? {
                  ...item,
                  assignmentCount:
                    assignmentStatusDraft === 'published'
                      ? Math.max(item.assignmentCount, 1)
                      : item.assignmentCount,
                }
              : item
          )
        );
      }
      onNotify?.(
        assignmentStatusDraft === 'published'
          ? 'Задачата е успешно објавена.'
          : 'Статусот на задачата е успешно ажуриран.',
        'success'
      );
    } catch (error) {
      setAssignmentStatusError(error.message || 'Не успеа зачувувањето на статусот.');
    } finally {
      setAssignmentStatusSaving(false);
    }
  };

  useEffect(() => {
    if (activePage !== 'students') {
      return;
    }

    if (!selectedStudentId) {
      setStudentDetails(null);
      return;
    }

    let isMounted = true;
    setStudentDetailsLoading(true);

    api
      .teacherStudentDetails(selectedStudentId)
      .then((response) => {
        if (isMounted) {
          setStudentDetails(mapTeacherStudentDetails(response));
        }
      })
      .catch(() => {
        if (isMounted) {
          setStudentDetails(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setStudentDetailsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, selectedStudentId]);

  useEffect(() => {
    if (
      activePage !== 'submission-review' ||
      selectedReviewStudentId ||
      !submissionReviewRoute?.classSlug ||
      !submissionReviewRoute?.studentSlug
    ) {
      return;
    }

    const matchingClass = classes.find(
      (item) => slugifyPathSegment(item.name) === submissionReviewRoute.classSlug
    );

    if (!matchingClass) {
      setSubmissionReviewError('Не успеавме да го пронајдеме класот за ова предавање.');
      return;
    }

    let isMounted = true;

    api
      .teacherClassroomDetails(matchingClass.id)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const mappedClassroom = mapClassroomDetails(response);
        const matchedStudent = (mappedClassroom?.students || []).find(
          (student) => slugifyPathSegment(student.fullName) === submissionReviewRoute.studentSlug
        );

        setSelectedClassroomId(matchingClass.id);
        setClassroomDetails(mappedClassroom);

        if (!matchedStudent) {
          setSubmissionReviewError('Не успеавме да го пронајдеме ученикот за ова предавање.');
          return;
        }

        setSelectedReviewStudentId(matchedStudent.id);
        setSelectedStudentId(matchedStudent.id);
      })
      .catch(() => {
        if (isMounted) {
          setSubmissionReviewError('Не успеа вчитувањето на податоците за предавањето.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePage, classes, selectedReviewStudentId, submissionReviewRoute]);

  useEffect(() => {
    if (activePage !== 'submission-review') {
      return;
    }

    if (!selectedReviewStudentId || !submissionReviewRoute?.assignmentId) {
      setSubmissionReview(null);
      return;
    }

    let isMounted = true;
    setSubmissionReviewLoading(true);
    setSubmissionReviewError('');

    async function loadSubmissionReview() {
      try {
        const studentPayload = await api.teacherStudentDetails(selectedReviewStudentId);
        if (!isMounted) {
          return;
        }

        const mappedStudent = mapTeacherStudentDetails(studentPayload);
        const matchedSubmission =
          mappedStudent?.recentSubmissions?.find(
            (item) => String(item.assignmentId) === String(submissionReviewRoute.assignmentId)
          ) || null;

        let mappedAssignment = null;
        let mappedReview = null;

        if (matchedSubmission?.submissionId) {
          try {
            const submissionPayload = await api.teacherSubmissionDetails(matchedSubmission.submissionId);
            if (!isMounted) {
              return;
            }

            mappedReview = mapTeacherSubmissionReviewDetail(
              submissionPayload,
              mappedStudent,
              matchedSubmission,
              submissionReviewRoute.assignmentId
            );
            mappedAssignment = mappedReview?.assignment || null;
          } catch {
            mappedReview = null;
          }
        }

        if (!mappedAssignment || !mappedAssignment.maxPoints) {
          try {
            const assignmentPayload = await api.assignmentDetails(submissionReviewRoute.assignmentId);
            if (!isMounted) {
              return;
            }

            const fallbackAssignment = mapTeacherAssignments([assignmentPayload])[0] || null;
            mappedAssignment = mappedAssignment
              ? {
                  ...fallbackAssignment,
                  ...mappedAssignment,
                  maxPoints: mappedAssignment.maxPoints || fallbackAssignment?.maxPoints || '',
                }
              : fallbackAssignment;
          } catch {
            mappedAssignment = null;
          }
        }

        const finalStudent = mappedReview?.student || mappedStudent;
        const finalSubmission = mappedReview?.submission || matchedSubmission;

        if (!isMounted) {
          return;
        }

        setStudentDetails(finalStudent);
        if (mappedAssignment) {
          setAssignmentDetails(mappedAssignment);
          setSelectedAssignmentId(mappedAssignment.id);
        }
        setSubmissionReview({
          student: finalStudent,
          assignment: mappedAssignment,
          submission: finalSubmission,
        });
        setSubmissionGradeDraft(finalSubmission?.totalScore || '');
        setSubmissionFeedbackDraft(finalSubmission?.feedback || '');
        setIsSubmissionReviewEditing(!hasSavedSubmissionReview(finalSubmission));

        if (!finalSubmission) {
          setSubmissionReviewError('Нема пронајдено поднесување за избраната задача.');
        }
      } catch {
        if (isMounted) {
          setSubmissionReview(null);
          setIsSubmissionReviewEditing(false);
          setSubmissionReviewError('Не успеа вчитувањето на предавањето.');
        }
      } finally {
        if (isMounted) {
          setSubmissionReviewLoading(false);
        }
      }
    }

    loadSubmissionReview();

    return () => {
      isMounted = false;
    };
  }, [activePage, selectedReviewStudentId, submissionReviewRoute]);

  const openSubmissionReview = (item) => {
    if (!item?.assignmentId || !item?.studentId) {
      return;
    }

    navigateTeacherPage('submission-review', {
      assignmentId: item.assignmentId,
      studentId: item.studentId,
      studentName: item.studentName || studentDetails?.fullName || 'student',
      className:
        item.className ||
        item.classroomName ||
        studentDetails?.classrooms?.[0]?.name ||
        assignmentDetails?.classroomName ||
        'class',
      classroomId: item.classroomId || studentDetails?.classrooms?.[0]?.id || '',
      schoolName: school || 'school',
    });
  };

  const handleSaveSubmissionReview = async () => {
    if (!submissionReview?.submission?.submissionId) {
      setSubmissionReviewError('Нема поднесување за оценување.');
      return;
    }

    if (submissionGradeDraft === '' && !submissionFeedbackDraft.trim()) {
      setSubmissionReviewError('Внеси поени или коментар.');
      return;
    }

    setSubmissionReviewSaving(true);
    setSubmissionReviewError('');

    try {
      const payload = {};
      if (submissionGradeDraft !== '') {
        payload.score = Number(submissionGradeDraft);
      }
      if (submissionFeedbackDraft.trim()) {
        payload.feedback = submissionFeedbackDraft.trim();
      }

      const response = await api.createSubmissionGrade(
        submissionReview.submission.submissionId,
        payload
      );

      const nextSubmission = {
        ...submissionReview.submission,
        status: response?.status || 'reviewed',
        statusLabel: 'Прегледано',
        totalScore:
          response?.total_score !== undefined && response?.total_score !== null
            ? String(response.total_score)
            : submissionGradeDraft,
        feedback: response?.feedback ?? submissionFeedbackDraft.trim(),
      };

      setSubmissionReview((current) =>
        current
          ? {
              ...current,
              submission: nextSubmission,
            }
          : current
      );
      setStudentDetails((current) =>
        current
          ? {
              ...current,
              recentSubmissions: current.recentSubmissions.map((item) =>
                item.submissionId === nextSubmission.submissionId
                  ? {
                      ...item,
                      ...nextSubmission,
                    }
                  : item
              ),
            }
          : current
      );
      setReviewQueue((current) =>
        current.map((item) =>
          item.submissionId === nextSubmission.submissionId
            ? {
                ...item,
                status: nextSubmission.status,
              }
            : item
        )
      );
      setIsSubmissionReviewEditing(false);
      onNotify?.('Оценката е успешно зачувана.', 'success');
    } catch (error) {
      setSubmissionReviewError(error.message || 'Не успеа зачувувањето на оценката.');
    } finally {
      setSubmissionReviewSaving(false);
    }
  };

  const handleEditSubmissionReview = () => {
    setSubmissionGradeDraft(submissionReview?.submission?.totalScore || '');
    setSubmissionFeedbackDraft(submissionReview?.submission?.feedback || '');
    setSubmissionReviewError('');
    setIsSubmissionReviewEditing(true);
  };

  const handleCancelSubmissionReviewEdit = () => {
    setSubmissionGradeDraft(submissionReview?.submission?.totalScore || '');
    setSubmissionFeedbackDraft(submissionReview?.submission?.feedback || '');
    setSubmissionReviewError('');
    setIsSubmissionReviewEditing(false);
  };

  const handleCreateSubjectTopic = async (subjectId, name) => {
    const trimmedName = String(name || '').trim();
    if (!subjectId || !trimmedName) {
      throw new Error('Одбери предмет и внеси име за тема.');
    }

    const response = await api.createTeacherSubjectTopic(subjectId, { name: trimmedName });
    const nextTopic = {
      id: String(response?.id ?? response?.topic?.id ?? trimmedName),
      name: response?.name || response?.topic?.name || trimmedName,
    };

    setSubjects((previous) =>
      previous.map((subject) => {
        if (String(subject.id) !== String(subjectId)) {
          return subject;
        }

        const existingTopics = Array.isArray(subject.topics) ? subject.topics : [];
        const alreadyExists = existingTopics.some(
          (topic) =>
            String(topic.id) === nextTopic.id ||
            String(topic.name).trim().toLowerCase() === nextTopic.name.trim().toLowerCase()
        );

        return {
          ...subject,
          topics: alreadyExists ? existingTopics : [...existingTopics, nextTopic],
        };
      })
    );

    return nextTopic;
  };

  const handleSaveAssignment = async (form) => {
    setIsCreatingAssignment(true);
    setAssignmentsLoading(true);
    setCreateError('');
    try {
      if (!form.classroomId || !form.subjectId) {
        setCreateError('Одбери клас и предмет.');
        return;
      }

      if (!Array.isArray(form.steps) || form.steps.length === 0) {
        setCreateError('Додај барем еден чекор.');
        return;
      }

      const invalidStep = form.steps.find(
        (step, index) =>
          !step.title?.trim() ||
          !step.content?.trim() ||
          (step.evaluationMode !== 'manual' &&
            String(step.answerKeysText || '')
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean).length === 0 &&
            index >= 0)
      );

      if (invalidStep) {
        const invalidIndex = form.steps.findIndex((step) => step.localId === invalidStep.localId) + 1;
        setCreateError(
          invalidStep.evaluationMode !== 'manual'
            ? `Пополнете наслов, содржина и точни одговори за чекор ${invalidIndex}.`
            : `Пополнете наслов и содржина за чекор ${invalidIndex}.`
        );
        return;
      }

      const contentBlocks = buildAssignmentContentBlocks(form.contentJsonText);
      const payload = buildAssignmentPayload(form, contentBlocks);
      const isEditing = assignmentEditorMode === 'edit' && editingAssignment?.id;
      const response = isEditing
        ? await api.updateAssignment(editingAssignment.id, payload)
        : await api.createAssignment(payload);

      let stepSaveFailed = false;
      const savedSteps = [];
      for (const [index, step] of form.steps.slice(0, 10).entries()) {
        const stepPayload = buildAssignmentStepPayload(step, index);
        let savedStep = null;

        try {
          savedStep = await (step.id
            ? api.updateAssignmentStep(response.id, step.id, stepPayload)
            : api.createAssignmentStep(response.id, stepPayload));
        } catch {
          stepSaveFailed = true;
        }

        if (savedStep) {
          savedSteps.push(savedStep);
        }
      }

      const resourceFiles = Array.isArray(form.resourceFiles) ? form.resourceFiles : [];
      const uploadResults = await Promise.allSettled(
        resourceFiles.map((file, index) =>
          api.createAssignmentResource(response.id, {
            title: file.name,
            resource_type: inferAssignmentResourceType(file),
            position:
              (Array.isArray(editingAssignment?.resources)
                ? editingAssignment.resources.length
                : 0) +
              index +
              1,
            is_required: true,
            file,
          })
        )
      );

      const uploadedResources = uploadResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      const failedUploads = uploadResults.filter((result) => result.status === 'rejected');

      const assignmentWithResources = await api
        .assignmentDetails(response.id)
        .catch(() => ({
          ...response,
          resources: [...(editingAssignment?.resources || []), ...uploadedResources],
          steps: savedSteps.length > 0 ? savedSteps : editingAssignment?.steps || [],
        }));

      const mappedAssignment = mapTeacherAssignments([assignmentWithResources])[0];
      if (mappedAssignment) {
        if (isEditing) {
          setTeacherAssignments((previous) =>
            previous.map((item) =>
              item.id === mappedAssignment.id ? { ...item, ...mappedAssignment } : item
            )
          );
          setAssignmentDetails(mappedAssignment);
        } else {
          setTeacherAssignments((previous) => [mappedAssignment, ...previous]);
        }
        setSelectedAssignmentId(mappedAssignment.id);
      }

      if (stepSaveFailed && failedUploads.length > 0) {
        setLoadError(
          isEditing
            ? `Задачата е изменета, но чекорот и ${failedUploads.length} датотеки не се зачувани.`
            : `Задачата е креирана, но почетниот чекор и ${failedUploads.length} датотеки не се прикачени.`
        );
        onNotify?.(
          isEditing
            ? 'Задачата е изменета со делумни податоци.'
            : 'Задачата е креирана со делумни податоци.',
          'info'
        );
      } else if (stepSaveFailed) {
        setLoadError(
          isEditing
            ? 'Задачата е изменета, но чекорот не е зачуван.'
            : 'Задачата е креирана, но почетниот чекор не е зачуван.'
        );
        onNotify?.(
          isEditing
            ? 'Задачата е изменета, но без ажуриран чекор.'
            : 'Задачата е креирана, но без почетен чекор.',
          'info'
        );
      } else if (failedUploads.length > 0) {
        setLoadError(
          isEditing
            ? `Задачата е изменета, но ${failedUploads.length} датотеки не се прикачени.`
            : `Задачата е креирана, но ${failedUploads.length} датотеки не се прикачени.`
        );
        onNotify?.(
          isEditing
            ? 'Задачата е изменета со делумно прикачени материјали.'
            : 'Задачата е креирана со делумно прикачени материјали.',
          'info'
        );
      } else {
        onNotify?.(
          isEditing ? 'Задачата е успешно изменета.' : 'Задачата е успешно креирана.',
          'success'
        );
      }

      resetAssignmentEditor();
      navigateTeacherPage('assignments');
    } catch (error) {
      setCreateError(
        error.message ||
          (assignmentEditorMode === 'edit'
            ? 'Не успеа измената на задачата.'
            : 'Не успеа креирањето на задачата.')
      );
    } finally {
      setIsCreatingAssignment(false);
      setAssignmentsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      setAnnouncementError('Внеси наслов и содржина.');
      return;
    }

    if (announcementForm.audience_type === 'classroom' && !announcementForm.classroomId) {
      setAnnouncementError('Одбери клас за објава на ниво на клас.');
      return;
    }

    setAnnouncementLoading(true);
    setAnnouncementError('');
    try {
      const payload = {
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        priority: announcementForm.priority,
        audience_type: announcementForm.audience_type,
        classroom_id:
          announcementForm.audience_type === 'classroom' && announcementForm.classroomId
            ? Number(announcementForm.classroomId)
            : null,
        file: announcementForm.file || undefined,
      };
      const response = await api.createAnnouncement(payload);
      const mapped = mapAnnouncements([response])[0];
      if (mapped) {
        setAnnouncements((previous) => [mapped, ...previous]);
      }
      onNotify?.('Објавата е успешно креирана.', 'success');
      setAnnouncementForm({
        title: '',
        body: '',
        priority: 'normal',
        audience_type: 'school',
        classroomId: '',
        file: null,
      });
      if (announcementFileInputRef.current) {
        announcementFileInputRef.current.value = '';
      }
    } catch (error) {
      setAnnouncementError(error.message || 'Не успеа креирањето на објавата.');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleAnnouncementAction = async (id, action) => {
    try {
      const response =
        action === 'publish'
          ? await api.publishAnnouncement(id)
          : await api.archiveAnnouncement(id);
      const mapped = mapAnnouncements([response])[0];
      if (!mapped) {
        return;
      }
      setAnnouncements((previous) =>
        previous.map((item) => (item.id === String(id) ? { ...item, ...mapped } : item))
      );
      onNotify?.(
        action === 'publish'
          ? 'Објавата е успешно објавена.'
          : 'Објавата е успешно архивирана.',
        'success'
      );
    } catch {
      // keep current UI state
    }
  };

  const handleExportAssignment = (assignment, targetClassroomIds) => {
    if (!assignment || !Array.isArray(targetClassroomIds) || targetClassroomIds.length === 0) {
      return;
    }

    const selectedClassrooms = classes
      .filter((classroom) => targetClassroomIds.includes(classroom.id))
      .map((classroom) => classroom.name);

    onNotify?.(
      `Подготвен е flow за "${assignment.title}" кон: ${selectedClassrooms.join(', ')}.`,
      'success'
    );
  };

  const filteredReviewQueue = selectedClassroomId
    ? reviewQueue.filter(
        (item) =>
          String(item.classroomId) === String(selectedClassroomId) ||
          item.className === classes.find((classItem) => classItem.id === String(selectedClassroomId))?.name
      )
    : reviewQueue;
  const filteredStudents = Array.isArray(classroomDetails?.students) ? classroomDetails.students : [];
  const featuredClassroom = classes.find((classItem) => classItem.isHomeroom) || classes[0] || null;
  const featuredClassroomLabel = featuredClassroom
    ? `${featuredClassroom.name}${featuredClassroom.gradeLevel ? ` · ${featuredClassroom.gradeLevel} одделение` : ''}`
    : school || 'Наставнички простор';

  return (
    <div className={`dashboard-root theme-${theme} teacher-root`}>
      <TeacherNavbar
        theme={theme}
        activePage={activePage === 'submission-review' ? 'students' : activePage}
        onToggleTheme={onToggleTheme}
        onNavigate={navigateTeacherPage}
        onLogout={onLogout}
        school={school}
        teacherName={teacherName}
      />

      <main className="dashboard-main teacher-main">
        {activePage === 'dashboard' ? (
          <TeacherDashboardPage
            featuredClassroomLabel={featuredClassroomLabel}
            teacherName={teacherName}
            school={school}
            overviewCards={overviewCards}
            calendarItems={calendarItems}
            classes={classes}
            reviewQueue={reviewQueue}
            announcements={announcements}
            activities={activities}
            loadError={loadError}
            onNavigate={navigateTeacherPage}
            onOpenCreate={openCreatePage}
          />
        ) : null}

        {activePage === 'classes' ? (
          <TeacherClassesPage
            classes={classes}
            selectedClassroomId={selectedClassroomId}
            onSelectClassroom={setSelectedClassroomId}
            classroomDetails={classroomDetails}
            classroomDetailsLoading={classroomDetailsLoading}
            onOpenStudent={(studentId) => {
              setSelectedStudentId(studentId);
              navigateTeacherPage('students');
            }}
            onOpenAssignment={(assignmentId) => {
              setSelectedAssignmentId(assignmentId);
              navigateTeacherPage('assignments');
            }}
            onNavigate={navigateTeacherPage}
          />
        ) : null}

        {activePage === 'students' ? (
          <TeacherStudentsPage
            classes={classes}
            selectedClassroomId={selectedClassroomId}
            onSelectClassroom={(classroomId) => {
              setSelectedClassroomId(classroomId);
              setSelectedStudentId('');
            }}
            activePage="students"
            onNavigate={navigateTeacherPage}
            teacherName={teacherName}
            school={school}
            subjects={subjects}
            students={filteredStudents}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            studentDetails={studentDetails}
            studentDetailsLoading={studentDetailsLoading}
            reviewQueue={filteredReviewQueue}
            onOpenSubmissionReview={openSubmissionReview}
            onNotify={onNotify}
          />
        ) : null}

        {activePage === 'submission-review' ? (
          <SubmissionReviewPage
            review={submissionReview}
            loading={submissionReviewLoading}
            error={submissionReviewError}
            gradeValue={submissionGradeDraft}
            feedbackValue={submissionFeedbackDraft}
            isEditing={isSubmissionReviewEditing}
            onGradeChange={setSubmissionGradeDraft}
            onFeedbackChange={setSubmissionFeedbackDraft}
            onStartEdit={handleEditSubmissionReview}
            onCancelEdit={handleCancelSubmissionReviewEdit}
            onSave={handleSaveSubmissionReview}
            onBack={() => navigateTeacherPage('students')}
            saving={submissionReviewSaving}
          />
        ) : null}

        {activePage === 'assignments' ? (
          <TeacherAssignmentsPage
            classes={classes}
            subjects={subjects}
            selectedClassroomId={selectedClassroomId}
            onSelectClassroom={setSelectedClassroomId}
            onNavigate={navigateTeacherPage}
            teacherAssignments={teacherAssignments}
            assignmentListFilter={assignmentListFilter}
            onAssignmentListFilterChange={setAssignmentListFilter}
            assignmentTypeFilter={assignmentTypeFilter}
            onAssignmentTypeFilterChange={setAssignmentTypeFilter}
            selectedAssignmentId={selectedAssignmentId}
            onSelectAssignment={setSelectedAssignmentId}
            assignmentDetails={assignmentDetails}
            assignmentDetailsLoading={assignmentsLoading || assignmentDetailsLoading}
            assignmentStatusDraft={assignmentStatusDraft}
            onAssignmentStatusDraftChange={setAssignmentStatusDraft}
            assignmentStatusSaving={assignmentStatusSaving}
            assignmentStatusError={assignmentStatusError}
            onSaveAssignmentStatus={handleAssignmentStatusSave}
            onOpenCreate={openCreatePage}
            onOpenEdit={openEditPage}
            onCreateTopic={handleCreateSubjectTopic}
            onExportAssignment={handleExportAssignment}
            formatAssignmentTypeLabel={getTeacherAssignmentTypeLabel}
            formatAssignmentStatusLabel={getTeacherAssignmentStatusLabel}
            getAssignmentTypeMonogram={getTeacherAssignmentTypeMonogram}
          />
        ) : null}

        {activePage === 'grades' ? (
          <TeacherGradesPage
            classes={classes}
            selectedClassroomId={selectedClassroomId}
            onSelectClassroom={setSelectedClassroomId}
            onNavigate={navigateTeacherPage}
            teacherAssignments={teacherAssignments}
            selectedAssignmentId={selectedAssignmentId}
            onSelectAssignment={setSelectedAssignmentId}
            classroomDetails={classroomDetails}
            classroomDetailsLoading={classroomDetailsLoading}
            assignmentDetails={assignmentDetails}
            assignmentRoster={assignmentRoster}
            assignmentRosterLoading={assignmentRosterLoading}
            gradebookRows={gradebookRows}
            gradebookLoading={gradebookLoading}
            onOpenSubmissionReview={openSubmissionReview}
            onOpenStudent={(studentId) => {
              setSelectedStudentId(studentId);
              navigateTeacherPage('students');
            }}
          />
        ) : null}

        {activePage === 'assignment-editor' ? (
          <AssignmentEditorPage
            mode={assignmentEditorMode}
            loading={isCreatingAssignment}
            classrooms={classes}
            subjects={subjects}
            error={createError}
            initialValues={
              assignmentEditorMode === 'edit' && editingAssignment
                ? {
                    assignmentId: editingAssignment.id,
                    title: editingAssignment.title,
                    topic: editingAssignment.topic,
                    subjectTopicId: editingAssignment.subjectTopicId,
                    subjectId: editingAssignment.subjectId,
                    classroomId: editingAssignment.classroomId,
                    description: editingAssignment.description,
                    teacherNotes: editingAssignment.teacherNotes,
                    contentJsonText: editingAssignment.contentJsonText,
                    dueDate: editingAssignment.dueDate,
                    type: editingAssignment.type,
                    points: editingAssignment.maxPoints,
                    steps: editingAssignment.steps,
                  }
                : null
            }
            existingResources={
              assignmentEditorMode === 'edit' ? editingAssignment?.resources || [] : []
            }
            onCreateTopic={handleCreateSubjectTopic}
            onSave={handleSaveAssignment}
            onCancel={() => {
              resetAssignmentEditor();
              navigateTeacherPage('assignments');
            }}
          />
        ) : null}

        {activePage === 'calendar' ? (
          <section className="teacher-panel">
            <WeeklyScheduleCalendar
              title="Наставнички распоред"
              description="Секоја недела ги прикажува часовите по предмет и паралелка, во едноставен classroom стил."
              slots={weeklyScheduleSlots}
              viewer="teacher"
              emptyText="Нема додадени часови за твојата наставна недела."
            />
          </section>
        ) : null}

        {activePage === 'announcements' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Објави</h1>
            <div className="modal-form teacher-announcement-form">
              <label>
                Наслов
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(event) =>
                    setAnnouncementForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Содржина
                <textarea
                  rows={3}
                  value={announcementForm.body}
                  onChange={(event) =>
                    setAnnouncementForm((previous) => ({
                      ...previous,
                      body: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Приоритет
                <select
                  value={announcementForm.priority}
                  onChange={(event) =>
                    setAnnouncementForm((previous) => ({
                      ...previous,
                      priority: event.target.value,
                    }))
                  }
                >
                  <option value="normal">Нормално</option>
                  <option value="important">Важно</option>
                  <option value="urgent">Итно</option>
                </select>
              </label>
              <label>
                Публика
                <select
                  value={announcementForm.audience_type}
                  onChange={(event) =>
                    setAnnouncementForm((previous) => ({
                      ...previous,
                      audience_type: event.target.value,
                      classroomId: event.target.value === 'classroom' ? previous.classroomId : '',
                    }))
                  }
                >
                  <option value="school">Цело училиште</option>
                  <option value="classroom">Клас</option>
                  <option value="students">Ученици</option>
                  <option value="teachers">Наставници</option>
                </select>
              </label>
              {announcementForm.audience_type === 'classroom' ? (
                <label>
                  Одбери клас
                  <select
                    value={announcementForm.classroomId}
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        classroomId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Избери клас</option>
                    {classes.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="teacher-file-upload-field">
                <span className="teacher-file-upload-label">Додаток</span>
                <div className="teacher-file-upload">
                  <input
                    ref={announcementFileInputRef}
                    className="teacher-file-upload-input"
                    id="teacher-announcement-file"
                    type="file"
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        file: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  <label htmlFor="teacher-announcement-file" className="teacher-file-upload-trigger">
                    <span className="teacher-file-upload-icon" aria-hidden="true">
                      +
                    </span>
                    <span className="teacher-file-upload-copy">
                      <strong>Прикачи датотека</strong>
                      <span>
                        {announcementForm.file
                          ? announcementForm.file.name
                          : 'PDF, слика или друг прилог за објавата'}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
              {announcementForm.file ? (
                <div className="item-actions teacher-file-upload-actions">
                  <span className="teacher-file-upload-pill">
                    {announcementForm.file.name}
                  </span>
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => {
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        file: null,
                      }));
                      if (announcementFileInputRef.current) {
                        announcementFileInputRef.current.value = '';
                      }
                    }}
                  >
                    Отстрани датотека
                  </button>
                </div>
              ) : null}
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateAnnouncement}
                  disabled={announcementLoading}
                >
                  {announcementLoading ? 'Се зачувува...' : 'Креирај објава'}
                </button>
              </div>
              {announcementError ? <p className="auth-error">{announcementError}</p> : null}
            </div>

            <ul className="list-reset teacher-assignment-list">
              {announcements.map((item) => (
                <li key={item.id} className="teacher-assignment-item">
                  <div className="announcement-top">
                    <p className="item-title">{item.title}</p>
                    <span className={`urgency-badge announcement-priority priority-${item.priority}`}>
                      {item.priorityLabel}
                    </span>
                  </div>
                  <p className="item-meta">{item.body}</p>
                  {item.uploadedFile ? (
                    <p className="item-meta">
                      Додаток: {item.uploadedFile.filename || 'Прикачена датотека'}
                    </p>
                  ) : null}
                  <p className="item-meta">
                    {item.audienceType} · {item.classroomName || 'Без клас'} ·{' '}
                    {item.subjectName || 'Без предмет'}
                  </p>
                  <p className="item-meta">
                    Статус: {item.status} · {item.publishedAt ? toMkDateTime(item.publishedAt) : 'необјавено'}
                  </p>
                  <div className="item-actions">
                    {item.status !== 'published' ? (
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => handleAnnouncementAction(item.id, 'publish')}
                      >
                        Објави
                      </button>
                    ) : null}
                    {item.status !== 'archived' ? (
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => handleAnnouncementAction(item.id, 'archive')}
                      >
                        Архивирај
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {activePage === 'attendance' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Присуство</h1>
            <label className="teacher-filter-label">
              Клас
              <select
                value={selectedClassroomId}
                onChange={(event) => setSelectedClassroomId(event.target.value)}
              >
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </label>
            {attendanceLoading ? (
              <p className="empty-state">Се вчитува присуството...</p>
            ) : attendanceRecords.length === 0 ? (
              <p className="empty-state">Нема записи за присуство.</p>
            ) : (
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Ученик</th>
                    <th>Статус</th>
                    <th>Датум</th>
                    <th>Предмет</th>
                    <th>Забелешка</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((item) => (
                    <tr key={item.id}>
                      <td>{item.studentName}</td>
                      <td>{item.status}</td>
                      <td>{item.date}</td>
                      <td>{item.subjectName || 'Општо'}</td>
                      <td>{item.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ) : null}

        {activePage === 'reports' ? (
          <TeacherAnalyticsPage
            classes={classes}
            selectedClassroomId={selectedClassroomId}
            onSelectClassroom={setSelectedClassroomId}
            onNavigate={navigateTeacherPage}
            performanceOverview={performanceOverview}
            reportsLoading={reportsLoading}
          />
        ) : null}

        {activePage === 'notifications' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Известувања</h1>
            {notifications.length === 0 ? (
              <p className="empty-state">Нема известувања.</p>
            ) : (
              <ul className="list-reset notifications-list">
                {notifications.map((item) => (
                  <li key={item.id} className="notification-item">
                    <div>
                      <p className="item-title">{item.title}</p>
                      <p className="item-meta">{item.detail}</p>
                    </div>
                    <span className="notification-time">{item.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {activePage === 'messages' ? <ChatMessagesPanel onNotify={onNotify} /> : null}

        {activePage === 'discussions' ? (
          <section className="dashboard-card content-card">
            <DiscussionsHub
              role="teacher"
              actor={{
                id: teacherEmail || teacherName || 'teacher-self',
                fullName: teacherName || 'Наставник',
                role: 'teacher',
              }}
            />
          </section>
        ) : null}

        {activePage === 'profile' ? (
          <TeacherTeachingProfilePage
            teacherName={teacherName}
            teacherEmail={teacherEmail}
            school={school}
            classes={classes}
            subjects={subjects}
            homerooms={homerooms}
          />
        ) : null}

        {activePage === 'settings' ? (
          <TeacherSettingsPage
            theme={theme}
            onThemeModeChange={onThemeModeChange}
            themeColor={themeColor}
            onThemeColorChange={onThemeColorChange}
            accessibility={accessibility}
            onSaveAccessibility={onSaveAccessibility}
            preferencesLoading={preferencesLoading}
            preferencesSaving={preferencesSaving}
          />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default TeacherArea;
