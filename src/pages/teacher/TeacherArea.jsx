import { useEffect, useState } from 'react';
import Footer from '../../components/Footer';
import TeacherNavbar from '../../components/teacher/TeacherNavbar';
import AssignmentEditorPage from '../../components/teacher/AssignmentEditorPage';
import SubmissionReviewPage from '../../components/teacher/SubmissionReviewPage';
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
  announcements: `${TEACHER_BASE_PATH}/announcements`,
  attendance: `${TEACHER_BASE_PATH}/attendance`,
  reports: `${TEACHER_BASE_PATH}/reports`,
  calendar: `${TEACHER_BASE_PATH}/calendar`,
  notifications: `${TEACHER_BASE_PATH}/notifications`,
  profile: `${TEACHER_BASE_PATH}/profile`,
};
const ASSIGNMENT_NEW_PATH = `${TEACHER_PAGE_PATHS.assignments}/new`;

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

function mergeClassrooms(schoolClasses, teacherClasses) {
  if (schoolClasses.length === 0) {
    return teacherClasses;
  }

  const teacherById = new Map(teacherClasses.map((item) => [item.id, item]));
  const merged = schoolClasses.map((item) => {
    const teacherClass = teacherById.get(item.id);
    if (!teacherClass) {
      return item;
    }

    return {
      ...item,
      students: teacherClass.students,
      assignmentCount: teacherClass.assignmentCount,
    };
  });

  const existingIds = new Set(merged.map((item) => item.id));
  const teacherOnly = teacherClasses.filter((item) => !existingIds.has(item.id));
  return [...merged, ...teacherOnly];
}

function mapSubjects(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((subject, index) => ({
    id: String(subject.id ?? `subject-${index}`),
    name: subject.name || 'Предмет',
    code: subject.code || '',
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

function mapTeacherAssignments(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.assignments)
      ? payload.assignments
      : [];

  return list.map((assignment, index) => ({
    id: String(assignment.id ?? index),
    title: assignment.title || 'Задача',
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

function mapAssignmentRoster(classroomPayload, studentDetailsPayloads, assignmentId) {
  const students = Array.isArray(classroomPayload?.students) ? classroomPayload.students : [];
  if (students.length === 0 || !assignmentId) {
    return [];
  }

  const detailsById = new Map(
    studentDetailsPayloads
      .filter(Boolean)
      .map((item) => [String(item.id), item])
  );

  return students.map((student, index) => {
    const studentId = String(student.id ?? index);
    const detail = detailsById.get(studentId);
    const submission = detail?.recentSubmissions?.find(
      (item) => String(item.assignmentId) === String(assignmentId)
    );

    return {
      id: studentId,
      fullName:
        student.fullName ||
        [student.first_name, student.last_name].filter(Boolean).join(' ') ||
        'Ученик',
      email: student.email || detail?.email || '',
      status: submission?.status || 'not_started',
      statusLabel:
        submission?.status === 'reviewed'
          ? 'Прегледано'
          : submission?.status === 'submitted'
            ? 'Предадено'
            : submission?.status === 'in_progress'
              ? 'Во тек'
              : 'Не е започнато',
      submittedAt: submission?.submittedAt || '',
      totalScore: submission?.totalScore || '',
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

function TeacherArea({ theme, onToggleTheme, onLogout, onNotify, school, schoolId }) {
  const initialRoute = getTeacherRouteState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
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
  const [homerooms, setHomerooms] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    priority: 'normal',
    audience_type: 'school',
    classroomId: '',
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
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [assignmentDetailsLoading, setAssignmentDetailsLoading] = useState(false);
  const [assignmentRoster, setAssignmentRoster] = useState([]);
  const [assignmentRosterLoading, setAssignmentRosterLoading] = useState(false);
  const [assignmentStatusDraft, setAssignmentStatusDraft] = useState('draft');
  const [assignmentStatusSaving, setAssignmentStatusSaving] = useState(false);
  const [assignmentStatusError, setAssignmentStatusError] = useState('');
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
      setAssignmentsLoading(true);

      const [
        meResult,
        dashboardResult,
        classroomsResult,
        schoolDetailsResult,
        homeroomsResult,
        announcementsResult,
        teacherSubjectsResult,
        assignmentsResult,
      ] = await Promise.allSettled([
        api.me(),
        api.teacherDashboard(),
        api.teacherClassrooms(),
        schoolId ? api.schoolDetails(schoolId) : Promise.resolve(null),
        api.teacherHomerooms(),
        api.announcements({ status: 'published' }),
        api.teacherSubjects(),
        api.assignments(),
      ]);

      if (!isMounted) {
        return;
      }

      const mePayload = meResult.status === 'fulfilled' ? meResult.value : null;
      const dashboardPayload = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null;
      const schoolDetailsPayload =
        schoolDetailsResult.status === 'fulfilled' ? schoolDetailsResult.value : null;

      const classroomsPayload =
        classroomsResult.status === 'fulfilled'
          ? Array.isArray(classroomsResult.value)
            ? classroomsResult.value
            : classroomsResult.value?.classrooms || []
          : [];

      const teacherClasses = mapClassrooms(classroomsPayload);
      const schoolClasses = mapClassrooms(schoolDetailsPayload?.classrooms);
      const homeroomItems =
        homeroomsResult.status === 'fulfilled' ? mapHomerooms(homeroomsResult.value) : [];
      const homeroomByClassroomId = new Map(
        homeroomItems.map((item) => [item.classroomId, item])
      );
      const mappedClasses = mergeClassrooms(schoolClasses, teacherClasses).map((item) => {
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
        teacherSubjectsResult.status === 'fulfilled'
          ? mapSubjects(teacherSubjectsResult.value)
          : mapSubjects(schoolDetailsPayload?.subjects);
      const mappedReviewQueue = mapReviewQueue(dashboardPayload?.review_queue);
      const mappedCalendarItems = mapCalendarEvents(dashboardPayload?.upcoming_calendar_events);
      const mappedAnnouncements =
        Array.isArray(dashboardPayload?.announcement_feed)
          ? mapAnnouncements(dashboardPayload.announcement_feed)
          : announcementsResult.status === 'fulfilled'
            ? mapAnnouncements(announcementsResult.value)
            : [];
      const mappedAnnouncementNotifications =
        Array.isArray(dashboardPayload?.announcement_feed)
          ? mapAnnouncementsToNotifications(dashboardPayload.announcement_feed)
          : announcementsResult.status === 'fulfilled'
            ? mapAnnouncementsToNotifications(announcementsResult.value)
            : [];
      const mappedHomerooms =
        Array.isArray(dashboardPayload?.homerooms) && dashboardPayload.homerooms.length > 0
          ? mapHomerooms(dashboardPayload.homerooms)
          : homeroomItems;
      const mappedAssignments =
        assignmentsResult.status === 'fulfilled'
          ? mapTeacherAssignments(assignmentsResult.value)
          : [];

      setClasses(mappedClasses);
      setSubjects(mappedSubjects);
      setHomerooms(mappedHomerooms);
      setAnnouncements(mappedAnnouncements);
      setTeacherAssignments(mappedAssignments);
      setReviewQueue(mappedReviewQueue);
      setCalendarItems(mappedCalendarItems);
      setNotifications([
        ...mapNotificationsFromReviewQueue(mappedReviewQueue),
        ...mappedAnnouncementNotifications,
      ]);
      setActivities(buildActivitiesFromClasses(mappedClasses));
      setSelectedClassroomId((current) => current || mappedClasses[0]?.id || '');
      setSelectedAssignmentId((current) => current || mappedAssignments[0]?.id || '');
      setOverviewCards(
        buildOverview(dashboardPayload, mappedClasses, mappedReviewQueue, mappedCalendarItems)
      );

      setTeacherEmail(mePayload?.user?.email || '');
      setTeacherName(dashboardPayload?.teacher?.full_name || mePayload?.user?.full_name || '');

      if (
        meResult.status === 'rejected' &&
        dashboardResult.status === 'rejected' &&
        classroomsResult.status === 'rejected' &&
        schoolDetailsResult.status === 'rejected' &&
        homeroomsResult.status === 'rejected' &&
        announcementsResult.status === 'rejected' &&
        teacherSubjectsResult.status === 'rejected' &&
        assignmentsResult.status === 'rejected'
      ) {
        setLoadError('Не успеа вчитувањето на наставничките податоци.');
      }

      setAssignmentsLoading(false);
    };

    loadTeacherData().catch(() => {
      if (isMounted) {
        setLoadError('Не успеа вчитувањето на наставничките податоци.');
        setAssignmentsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClassroomId) {
      setClassroomDetails(null);
      setAttendanceRecords([]);
      setPerformanceOverview(null);
      return;
    }

    let isMounted = true;
    setClassroomDetailsLoading(true);
    setAttendanceLoading(true);
    setReportsLoading(true);

    Promise.allSettled([
      api.teacherClassroomDetails(selectedClassroomId),
      api.classroomAttendance(selectedClassroomId),
      api.classroomPerformanceOverview(selectedClassroomId),
    ])
      .then(([classroomResult, attendanceResult, performanceResult]) => {
        if (!isMounted) {
          return;
        }

        setClassroomDetails(
          classroomResult.status === 'fulfilled'
            ? mapClassroomDetails(classroomResult.value)
            : null
        );
        setAttendanceRecords(
          attendanceResult.status === 'fulfilled'
            ? mapAttendanceRecords(attendanceResult.value)
            : []
        );
        setPerformanceOverview(
          performanceResult.status === 'fulfilled'
            ? mapPerformanceOverview(performanceResult.value)
            : null
        );
      })
      .finally(() => {
        if (isMounted) {
          setClassroomDetailsLoading(false);
          setAttendanceLoading(false);
          setReportsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedClassroomId]);

  useEffect(() => {
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
  }, [selectedAssignmentId, teacherAssignments]);

  useEffect(() => {
    if (!assignmentDetails?.classroomId || !assignmentDetails?.id) {
      setAssignmentRoster([]);
      return;
    }

    let isMounted = true;
    setAssignmentRosterLoading(true);

    api
      .teacherClassroomDetails(assignmentDetails.classroomId)
      .then(async (classroomResponse) => {
        const mappedClassroom = mapClassroomDetails(classroomResponse);
        const studentDetailsResults = await Promise.all(
          (mappedClassroom?.students || []).map((student) =>
            api
              .teacherStudentDetails(student.id)
              .then((response) => mapTeacherStudentDetails(response))
              .catch(() => null)
          )
        );

        if (isMounted) {
          setAssignmentRoster(
            mapAssignmentRoster(mappedClassroom, studentDetailsResults, assignmentDetails.id)
          );
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
  }, [assignmentDetails]);

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
  }, [selectedStudentId]);

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

    Promise.allSettled([
      api.teacherStudentDetails(selectedReviewStudentId),
      api.assignmentDetails(submissionReviewRoute.assignmentId),
      api.studentAssignmentDetails(submissionReviewRoute.assignmentId),
    ])
      .then(([studentResult, assignmentResult, studentAssignmentResult]) => {
        if (!isMounted) {
          return;
        }

        const mappedStudent =
          studentResult.status === 'fulfilled'
            ? mapTeacherStudentDetails(studentResult.value)
            : null;
        const mappedAssignment =
          assignmentResult.status === 'fulfilled'
            ? mapTeacherAssignments([assignmentResult.value])[0] || null
            : null;
        const mappedStudentAssignmentSubmission =
          studentAssignmentResult.status === 'fulfilled' && studentAssignmentResult.value?.submission
            ? mapTeacherSubmissionSummary({
                submission_id: studentAssignmentResult.value.submission.id,
                assignment_id:
                  studentAssignmentResult.value.id ?? submissionReviewRoute.assignmentId,
                assignment_title: studentAssignmentResult.value.title || mappedAssignment?.title,
                classroom_name:
                  studentAssignmentResult.value.classroom?.name ||
                  mappedAssignment?.classroomName ||
                  '',
                status: studentAssignmentResult.value.submission.status,
                submitted_at: studentAssignmentResult.value.submission.submitted_at,
                total_score: studentAssignmentResult.value.submission.total_score,
                feedback: studentAssignmentResult.value.submission.feedback,
                step_answers: studentAssignmentResult.value.submission.step_answers,
                submission: studentAssignmentResult.value.submission,
              })
            : null;

        let matchedSubmission =
          mappedStudent?.recentSubmissions?.find(
            (item) => String(item.assignmentId) === String(submissionReviewRoute.assignmentId)
          ) || null;

        matchedSubmission = mergeTeacherSubmissionSummary(
          matchedSubmission,
          mappedStudentAssignmentSubmission
        );

        if (!isMounted) {
          return;
        }

        setStudentDetails(mappedStudent);
        if (mappedAssignment) {
          setAssignmentDetails(mappedAssignment);
          setSelectedAssignmentId(mappedAssignment.id);
        }
        setSubmissionReview({
          student: mappedStudent,
          assignment: mappedAssignment,
          submission: matchedSubmission,
        });
        setSubmissionGradeDraft(matchedSubmission?.totalScore || '');
        setSubmissionFeedbackDraft(matchedSubmission?.feedback || '');

        if (!matchedSubmission) {
          setSubmissionReviewError('Нема пронајдено поднесување за избраната задача.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setSubmissionReview(null);
          setSubmissionReviewError('Не успеа вчитувањето на предавањето.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setSubmissionReviewLoading(false);
        }
      });

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
      onNotify?.('Оценката е успешно зачувана.', 'success');
    } catch (error) {
      setSubmissionReviewError(error.message || 'Не успеа зачувувањето на оценката.');
    } finally {
      setSubmissionReviewSaving(false);
    }
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
        const savedStep = await (step.id
          ? api.updateAssignmentStep(response.id, step.id, stepPayload)
          : api.createAssignmentStep(response.id, stepPayload)
        ).catch(() => {
          stepSaveFailed = true;
          return null;
        });

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
      });
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

  const filteredReviewQueue = selectedClassroomId
    ? reviewQueue.filter(
        (item) =>
          String(item.classroomId) === String(selectedClassroomId) ||
          item.className === classes.find((classItem) => classItem.id === String(selectedClassroomId))?.name
      )
    : reviewQueue;
  const filteredStudents = Array.isArray(classroomDetails?.students) ? classroomDetails.students : [];

  return (
    <div className={`dashboard-root theme-${theme} teacher-root`}>
      <TeacherNavbar
        theme={theme}
        activePage={activePage === 'submission-review' ? 'students' : activePage}
        onToggleTheme={onToggleTheme}
        onNavigate={navigateTeacherPage}
        onLogout={onLogout}
      />

      <main className="dashboard-main teacher-main">
        {activePage === 'dashboard' ? (
          <>
            <section className="dashboard-card hero-card teacher-hero-card">
              <p className="hero-eyebrow">Наставничка контролна табла</p>
              <h1 className="hero-title">
                Добредојдовте{teacherName ? `, ${teacherName}` : ''}
              </h1>
              <p className="hero-meta">
                Училиште: {school || 'Нема податок'} · Активни класови:{' '}
                {overviewCards[0]?.value} · Активни задачи: {overviewCards[2]?.value} ·
                Предавања за преглед: {overviewCards[3]?.value}
              </p>
              <div className="hero-actions">
                <button type="button" className="btn btn-primary" onClick={openCreatePage}>
                  Нова задача
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigateTeacherPage('classes')}
                >
                  Преглед на класови
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigateTeacherPage('notifications')}
                >
                  Види активности
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigateTeacherPage('announcements')}
                >
                  Објави
                </button>
              </div>
              {loadError ? <p className="auth-error">{loadError}</p> : null}
            </section>

            <section className="profile-summary-row teacher-summary-row">
              {overviewCards.map((item) => (
                <article key={item.label} className="dashboard-card profile-summary-card">
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </section>

            <section className="dashboard-grid">
              <section className="dashboard-card content-card">
                <h2 className="section-title">Мои класови</h2>
                {classes.length === 0 ? (
                  <p className="empty-state">Нема достапни класови.</p>
                ) : (
                  <div className="teacher-class-grid">
                    {classes.map((classItem) => (
                      <article key={classItem.id} className="teacher-class-card">
                        <h3>{classItem.name}</h3>
                        <p>Одделение: {classItem.gradeLevel}</p>
                        <p>Учебна година: {classItem.academicYear}</p>
                        <p>Ученици: {classItem.students}</p>
                        <p>Активни задачи: {classItem.assignmentCount}</p>
                        <p>
                          Класно раководство:{' '}
                          {classItem.isHomeroom
                            ? 'Да'
                            : classItem.homeroomTeacherName || 'Нема податок'}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-card content-card">
                <h2 className="section-title">Редица за преглед</h2>
                <table className="teacher-table">
                  <thead>
                    <tr>
                      <th>Ученик</th>
                      <th>Клас</th>
                      <th>Задача</th>
                      <th>Поднесено</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewQueue.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Нема предавања за преглед.</td>
                      </tr>
                    ) : (
                      reviewQueue.map((item) => (
                        <tr key={item.id}>
                          <td>{item.studentName}</td>
                          <td>{item.className}</td>
                          <td>{item.assignmentTitle}</td>
                          <td>{item.submittedAt}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            </section>

            <section className="dashboard-grid">
              <section className="dashboard-card content-card">
                <h2 className="section-title">Задачи по клас</h2>
                {classes.length === 0 ? (
                  <p className="empty-state">Нема податоци за задачи по клас.</p>
                ) : (
                  <ul className="list-reset teacher-assignment-list">
                    {classes.map((classItem) => (
                      <li key={`assignment-${classItem.id}`} className="teacher-assignment-item">
                        <div>
                          <p className="item-title">{classItem.name}</p>
                          <p className="item-meta">
                            Одделение: {classItem.gradeLevel} · Учебна година:{' '}
                            {classItem.academicYear}
                          </p>
                          <p className="item-meta">
                            Ученици: {classItem.students} · Активни задачи:{' '}
                            {classItem.assignmentCount}
                          </p>
                          {classItem.isHomeroom ? (
                            <p className="item-meta">Класен раководител: вие</p>
                          ) : null}
                        </div>
                        <div className="item-actions">
                          <button
                            type="button"
                            className="inline-action"
                            onClick={openCreatePage}
                          >
                            Нова задача
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="dashboard-card content-card">
                <h2 className="section-title">Календар</h2>
                {calendarItems.length === 0 ? (
                  <p className="empty-state">Нема рокови за денес.</p>
                ) : (
                  <ul className="list-reset deadlines-list">
                    {calendarItems.slice(0, 2).map((item) => (
                      <li key={item.id} className="deadline-item">
                        <div>
                          <p className="item-title">{item.title}</p>
                          <p className="item-meta">{item.when}</p>
                        </div>
                        <span className="urgency-badge urgency-soon">Наскоро</span>
                      </li>
                    ))}
                  </ul>
                )}
                <h2 className="section-title teacher-activity-title">Последни активности</h2>
                {activities.length === 0 ? (
                  <p className="empty-state">Нема активности.</p>
                ) : (
                  <ul className="list-reset profile-activity-list">
                    {activities.map((activity) => (
                      <li key={activity} className="profile-activity-item">
                        {activity}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </section>

            <section className="dashboard-grid">
              <section className="dashboard-card content-card">
                <h2 className="section-title">Мои хомрумови</h2>
                {homerooms.length === 0 ? (
                  <p className="empty-state">Нема активни хомрумови.</p>
                ) : (
                  <ul className="list-reset teacher-assignment-list">
                    {homerooms.map((item) => (
                      <li key={item.id} className="teacher-assignment-item">
                        <p className="item-title">{item.classroomName}</p>
                        <p className="item-meta">
                          Наставник: {item.teacherName || teacherName || 'Нема податок'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="dashboard-card content-card">
                <h2 className="section-title">Објави</h2>
                {announcements.length === 0 ? (
                  <p className="empty-state">Нема објави.</p>
                ) : (
                  <ul className="list-reset announcements-list">
                    {announcements.slice(0, 3).map((item) => (
                      <li key={item.id} className="announcement-item">
                        <div className="announcement-top">
                          <strong>{item.title}</strong>
                          <span className={`urgency-badge announcement-priority priority-${item.priority}`}>
                            {item.priorityLabel}
                          </span>
                        </div>
                        <p className="item-meta">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </section>
          </>
        ) : null}

        {activePage === 'classes' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Класови</h1>
            <label className="teacher-filter-label">
              Избери клас
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
            {classes.length === 0 ? (
              <p className="empty-state">Нема достапни класови.</p>
            ) : (
              <div className="dashboard-grid teacher-detail-grid">
                <ul className="list-reset teacher-assignment-list">
                  {classes.map((classItem) => (
                    <li key={`classes-${classItem.id}`} className="teacher-assignment-item">
                      <div>
                        <p className="item-title">{classItem.name}</p>
                        <p className="item-meta">
                          Одделение: {classItem.gradeLevel} · Учебна година:{' '}
                          {classItem.academicYear}
                        </p>
                        <p className="item-meta">
                          Ученици: {classItem.students} · Активни задачи:{' '}
                          {classItem.assignmentCount}
                        </p>
                        {classItem.isHomeroom ? (
                          <p className="item-meta">Класен раководител: вие</p>
                        ) : null}
                      </div>
                      <div className="item-actions">
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() => setSelectedClassroomId(classItem.id)}
                        >
                          Детали
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <section className="dashboard-card content-card">
                  <h2 className="section-title">Детали за клас</h2>
                  {classroomDetailsLoading ? (
                    <p className="empty-state">Се вчитуваат деталите...</p>
                  ) : !classroomDetails ? (
                    <p className="empty-state">Нема избран клас.</p>
                  ) : (
                    <>
                      <p className="item-title">{classroomDetails.name}</p>
                      <p className="item-meta">
                        Одделение: {classroomDetails.gradeLevel} · Учебна година:{' '}
                        {classroomDetails.academicYear}
                      </p>
                      <p className="item-meta">
                        Предмети:{' '}
                        {classroomDetails.subjects.length > 0
                          ? classroomDetails.subjects.map((subject) => subject.name).join(', ')
                          : 'Нема податоци'}
                      </p>
                      <h3 className="section-title teacher-subtitle">Ученици</h3>
                      {classroomDetails.students.length === 0 ? (
                        <p className="empty-state">Нема ученици.</p>
                      ) : (
                        <ul className="list-reset teacher-assignment-list">
                          {classroomDetails.students.map((student) => (
                            <li key={student.id} className="teacher-assignment-item compact-item">
                              <div>
                                <p className="item-title">{student.fullName}</p>
                                <p className="item-meta">
                                  Просек: {student.averageGrade ?? 'Нема податок'} ·
                                  Стапка на предавање:{' '}
                                  {student.submissionRate ?? 'Нема податок'}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="inline-action"
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  navigateTeacherPage('students');
                                }}
                              >
                                Отвори ученик
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <h3 className="section-title teacher-subtitle">Активни задачи</h3>
                      {classroomDetails.activeAssignments.length === 0 ? (
                        <p className="empty-state">Нема активни задачи.</p>
                      ) : (
                        <ul className="list-reset teacher-assignment-list">
                          {classroomDetails.activeAssignments.map((assignment) => (
                            <li key={assignment.id} className="teacher-assignment-item compact-item">
                              <div>
                                <p className="item-title">{assignment.title}</p>
                                <p className="item-meta">
                                  Статус: {assignment.status}
                                  {assignment.dueAt ? ` · Рок: ${assignment.dueAt}` : ''}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="inline-action"
                                onClick={() => {
                                  setSelectedAssignmentId(assignment.id);
                                  navigateTeacherPage('assignments');
                                }}
                              >
                                Отвори задача
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}
          </section>
        ) : null}

        {activePage === 'students' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Ученици</h1>
            <div className="teacher-toolbar">
              <label className="teacher-filter-label">
                Клас
                <select
                  value={selectedClassroomId}
                  onChange={(event) => {
                    setSelectedClassroomId(event.target.value);
                    setSelectedStudentId('');
                  }}
                >
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="teacher-filter-label">
                Ученик
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                >
                  <option value="">Одбери ученик</option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="dashboard-grid teacher-detail-grid">
              <section className="dashboard-card content-card">
                <h2 className="section-title">Редица за преглед</h2>
                <table className="teacher-table">
                  <thead>
                    <tr>
                      <th>Ученик</th>
                      <th>Клас</th>
                      <th>Задача</th>
                      <th>Поднесено</th>
                      <th>Статус</th>
                      <th>Акција</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviewQueue.length === 0 ? (
                      <tr>
                        <td colSpan={6}>Нема предавања за преглед.</td>
                      </tr>
                    ) : (
                      filteredReviewQueue.map((item) => (
                        <tr key={`students-${item.id}`}>
                          <td>
                            <button
                              type="button"
                              className="inline-action teacher-link-button"
                              onClick={() => {
                                setSelectedClassroomId(item.classroomId || selectedClassroomId);
                                setSelectedStudentId(item.studentId);
                              }}
                            >
                              {item.studentName}
                            </button>
                          </td>
                          <td>{item.className}</td>
                          <td>
                            <button
                              type="button"
                              className="inline-action teacher-link-button"
                              onClick={() =>
                                openSubmissionReview({
                                  ...item,
                                  className: item.className,
                                })
                              }
                            >
                              {item.assignmentTitle}
                            </button>
                          </td>
                          <td>{item.submittedAt}</td>
                          <td>{item.status}</td>
                          <td>
                            <button
                              type="button"
                              className="inline-action"
                              onClick={() =>
                                openSubmissionReview({
                                  ...item,
                                  className: item.className,
                                })
                              }
                            >
                              Прегледај
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>

              <section className="dashboard-card content-card">
                <h2 className="section-title">Профил на ученик</h2>
                {studentDetailsLoading ? (
                  <p className="empty-state">Се вчитува профилот...</p>
                ) : !studentDetails ? (
                  <p className="empty-state">Одбери ученик за детали.</p>
                ) : (
                  <>
                    <p className="item-title">{studentDetails.fullName}</p>
                    <p className="item-meta">Е-пошта: {studentDetails.email}</p>
                    <p className="item-meta">
                      Класови:{' '}
                      {studentDetails.classrooms.length > 0
                        ? studentDetails.classrooms.map((item) => item.name).join(', ')
                        : 'Нема податоци'}
                    </p>
                    <h3 className="section-title teacher-subtitle">Предмети</h3>
                    {studentDetails.subjects.length === 0 ? (
                      <p className="empty-state">Нема предмети.</p>
                    ) : (
                      <ul className="list-reset teacher-assignment-list">
                        {studentDetails.subjects.map((subject) => (
                          <li key={subject.id} className="teacher-assignment-item compact-item">
                            <p className="item-title">{subject.name}</p>
                            <p className="item-meta">
                              Тековна оценка: {subject.currentGrade} · Непредадени:{' '}
                              {subject.missingAssignments}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <h3 className="section-title teacher-subtitle">Последни предавања</h3>
                    {studentDetails.recentSubmissions.length === 0 ? (
                      <p className="empty-state">Нема предавања.</p>
                    ) : (
                      <ul className="list-reset teacher-assignment-list">
                        {studentDetails.recentSubmissions.map((submission) => (
                          <li key={submission.id} className="teacher-assignment-item compact-item">
                            <p className="item-title">{submission.assignmentTitle}</p>
                            <p className="item-meta">
                              {submission.statusLabel || submission.status} · {submission.submittedAt}
                            </p>
                            <button
                              type="button"
                              className="inline-action"
                              onClick={() =>
                                openSubmissionReview({
                                  studentId: studentDetails.id,
                                  studentName: studentDetails.fullName,
                                  classroomId:
                                    submission.classroomId || studentDetails.classrooms?.[0]?.id || '',
                                  className:
                                    submission.classroomName ||
                                    studentDetails.classrooms?.[0]?.name ||
                                    'Клас',
                                  assignmentId: submission.assignmentId,
                                  assignmentTitle: submission.assignmentTitle,
                                  submissionId: submission.submissionId,
                                })
                              }
                            >
                              Отвори предавање
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </section>
            </div>
          </section>
        ) : null}

        {activePage === 'submission-review' ? (
          <SubmissionReviewPage
            review={submissionReview}
            loading={submissionReviewLoading}
            error={submissionReviewError}
            gradeValue={submissionGradeDraft}
            feedbackValue={submissionFeedbackDraft}
            onGradeChange={setSubmissionGradeDraft}
            onFeedbackChange={setSubmissionFeedbackDraft}
            onSave={handleSaveSubmissionReview}
            onBack={() => navigateTeacherPage('students')}
            saving={submissionReviewSaving}
          />
        ) : null}

        {activePage === 'assignments' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Задачи по клас</h1>
            <label className="teacher-filter-label">
              Избери задача
              <select
                value={selectedAssignmentId}
                onChange={(event) => setSelectedAssignmentId(event.target.value)}
              >
                {teacherAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            </label>
            {teacherAssignments.length === 0 ? (
              <p className="empty-state">Нема достапни податоци за задачи.</p>
            ) : (
              <div className="dashboard-grid teacher-detail-grid">
                <ul className="list-reset teacher-assignment-list">
                  {teacherAssignments.map((assignment) => (
                    <li key={`assignments-${assignment.id}`} className="teacher-assignment-item">
                      <div>
                        <p className="item-title">{assignment.title}</p>
                        <p className="item-meta">
                          {assignment.subjectName} · {assignment.classroomName}
                        </p>
                        <p className="item-meta">
                          Рок: {assignment.dueAt} · Поднесувања: {assignment.submissionCount}
                        </p>
                        <p className="item-meta">
                          Тип: {assignment.type} · Статус: {assignment.status}
                        </p>
                        {assignment.maxPoints ? (
                          <p className="item-meta">Макс. поени: {assignment.maxPoints}</p>
                        ) : null}
                      </div>
                      <div className="item-actions">
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() => setSelectedAssignmentId(assignment.id)}
                        >
                          Детали
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <section className="dashboard-card content-card">
                  <h2 className="section-title">Детали за задача</h2>
                  {assignmentsLoading || assignmentDetailsLoading ? (
                    <p className="empty-state">Се вчитуваат деталите...</p>
                  ) : !assignmentDetails ? (
                    <p className="empty-state">Одбери задача за детали.</p>
                  ) : (
                    <>
                      <p className="item-title">{assignmentDetails.title}</p>
                      <p className="item-meta">
                        {assignmentDetails.subjectName} · {assignmentDetails.classroomName}
                      </p>
                      <p className="item-meta">
                        Тип: {assignmentDetails.type} · Статус: {assignmentDetails.status}
                      </p>
                      {assignmentDetails.status !== 'published' ? (
                        <div className="item-actions">
                          <button
                            type="button"
                            className="inline-action"
                            onClick={openEditPage}
                          >
                            Измени задача
                          </button>
                        </div>
                      ) : null}
                      <div className="teacher-announcement-form">
                        <label>
                          Промени статус
                          <select
                            value={assignmentStatusDraft}
                            onChange={(event) => setAssignmentStatusDraft(event.target.value)}
                            disabled={assignmentStatusSaving}
                          >
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                          </select>
                        </label>
                        <div className="item-actions">
                          <button
                            type="button"
                            className="inline-action"
                            onClick={handleAssignmentStatusSave}
                            disabled={
                              assignmentStatusSaving ||
                              assignmentStatusDraft === assignmentDetails.status
                            }
                          >
                            {assignmentStatusSaving ? 'Се зачувува...' : 'Зачувај статус'}
                          </button>
                        </div>
                        {assignmentStatusError ? (
                          <p className="auth-error">{assignmentStatusError}</p>
                        ) : null}
                      </div>
                      <p className="item-meta">Рок: {assignmentDetails.dueAt}</p>
                      {assignmentDetails.publishedAt ? (
                        <p className="item-meta">
                          Објавено: {assignmentDetails.publishedAt}
                        </p>
                      ) : null}
                      {assignmentDetails.maxPoints ? (
                        <p className="item-meta">
                          Макс. поени: {assignmentDetails.maxPoints}
                        </p>
                      ) : null}
                      {assignmentDetails.description ? (
                        <p className="item-meta">{assignmentDetails.description}</p>
                      ) : null}
                      {assignmentDetails.teacherNotes ? (
                        <p className="item-meta">
                          Белешки: {assignmentDetails.teacherNotes}
                        </p>
                      ) : null}
                      <p className="item-meta">
                        Материјали: {assignmentDetails.resourcesCount} · Чекори:{' '}
                        {assignmentDetails.stepsCount} · Content blocks:{' '}
                        {assignmentDetails.contentBlocksCount}
                      </p>
                      <h3 className="section-title teacher-subtitle">Ученици по задача</h3>
                      {assignmentDetails.status === 'draft' ? (
                        <p className="item-meta">
                          Оваа задача е `draft`, па учениците обично нема да имаат активни
                          submissions додека не се објави.
                        </p>
                      ) : null}
                      {assignmentRosterLoading ? (
                        <p className="empty-state">Се вчитува напредокот...</p>
                      ) : assignmentRoster.length === 0 ? (
                        <p className="empty-state">
                          Нема податоци за напредок по ученици.
                        </p>
                      ) : (
                        <table className="teacher-table">
                          <thead>
                            <tr>
                              <th>Ученик</th>
                              <th>Статус</th>
                              <th>Предадено</th>
                              <th>Поени</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignmentRoster.map((student) => (
                              <tr key={`assignment-roster-${student.id}`}>
                                <td>{student.fullName}</td>
                                <td>{student.statusLabel}</td>
                                <td>{student.submittedAt || 'Нема'}</td>
                                <td>{student.totalScore || 'Нема'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}
            <button type="button" className="btn btn-primary" onClick={openCreatePage}>
              Нова задача
            </button>
          </section>
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
                    title: editingAssignment.title,
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
            onSave={handleSaveAssignment}
            onCancel={() => {
              resetAssignmentEditor();
              navigateTeacherPage('assignments');
            }}
          />
        ) : null}

        {activePage === 'calendar' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Календар</h1>
            {calendarItems.length === 0 ? (
              <p className="empty-state">Нема рокови за денес.</p>
            ) : (
              <ul className="list-reset deadlines-list">
                {calendarItems.map((item) => (
                  <li key={`calendar-${item.id}`} className="deadline-item">
                    <div>
                      <p className="item-title">{item.title}</p>
                      <p className="item-meta">{item.when}</p>
                    </div>
                    <span className="urgency-badge urgency-soon">Наскоро</span>
                  </li>
                ))}
              </ul>
            )}
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
          <section className="dashboard-card content-card">
            <h1 className="section-title">Извештаи по клас</h1>
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
            {reportsLoading ? (
              <p className="empty-state">Се вчитува извештајот...</p>
            ) : !performanceOverview ? (
              <p className="empty-state">Нема извештај за овој клас.</p>
            ) : (
              <>
                <section className="profile-summary-row teacher-summary-row">
                  <article className="dashboard-card profile-summary-card">
                    <p>Просечна оценка</p>
                    <strong>{performanceOverview.averageGrade}</strong>
                  </article>
                  <article className="dashboard-card profile-summary-card">
                    <p>Просечно присуство</p>
                    <strong>{performanceOverview.averageAttendanceRate}%</strong>
                  </article>
                  <article className="dashboard-card profile-summary-card">
                    <p>Ангажман</p>
                    <strong>{performanceOverview.averageEngagementScore}%</strong>
                  </article>
                  <article className="dashboard-card profile-summary-card">
                    <p>Ученици</p>
                    <strong>{performanceOverview.studentCount}</strong>
                  </article>
                </section>
                <table className="teacher-table">
                  <thead>
                    <tr>
                      <th>Ученик</th>
                      <th>Просек</th>
                      <th>Присуство</th>
                      <th>Ангажман</th>
                      <th>Завршени задачи</th>
                      <th>Задоцнети</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceOverview.students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.averageGrade}</td>
                        <td>{student.attendanceRate}%</td>
                        <td>{student.engagementScore}%</td>
                        <td>{student.completedAssignmentsCount}</td>
                        <td>{student.overdueAssignmentsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
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

        {activePage === 'profile' ? (
          <section className="dashboard-card content-card">
            <h1 className="section-title">Профил</h1>
            <p className="item-meta">Наставник: {teacherName || 'Нема податок'}</p>
            <p className="item-meta">Е-пошта: {teacherEmail || 'Нема податок'}</p>
            <p className="item-meta">Училиште: {school || 'Нема податок'}</p>
            <p className="item-meta">
              Класно раководство:{' '}
              {homerooms.length > 0
                ? homerooms.map((item) => item.classroomName).join(', ')
                : 'Нема податоци'}
            </p>
            <p className="item-meta">
              Предмети:{' '}
              {subjects.length > 0
                ? subjects.map((subject) => subject.name).join(', ')
                : 'Нема податоци'}
            </p>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default TeacherArea;
