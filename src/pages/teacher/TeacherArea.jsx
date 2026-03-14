import { useEffect, useState } from 'react';
import Footer from '../../components/Footer';
import TeacherNavbar from '../../components/teacher/TeacherNavbar';
import CreateAssignmentModal from '../../components/teacher/CreateAssignmentModal';
import { api } from '../../services/apiClient';

const EMPTY_OVERVIEW = [
  { label: 'Мои класови', value: 0 },
  { label: 'Вкупно ученици', value: 0 },
  { label: 'Активни задачи', value: 0 },
  { label: 'Непрегледани предавања', value: 0 },
  { label: 'Наредни настани', value: 0 },
];

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
    className: item.classroom_name || item.classroom?.name || item.class_name || 'Клас',
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
          fullName: student.full_name || student.name || 'Ученик',
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
    activeAssignments: Array.isArray(payload.active_assignments)
      ? payload.active_assignments.map((assignment, index) => ({
          id: String(assignment.id ?? index),
          title: assignment.title || 'Задача',
          status: assignment.status || 'published',
        }))
      : [],
  };
}

function mapTeacherStudentDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const student = payload.student || {};
  return {
    id: String(student.id ?? ''),
    fullName: student.full_name || student.name || 'Ученик',
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
    recentSubmissions: Array.isArray(payload.recent_submissions)
      ? payload.recent_submissions.map((item, index) => ({
          id: String(item.id ?? index),
          assignmentTitle: item.assignment_title || 'Задача',
          status: item.status || 'submitted',
          submittedAt: toMkDateTime(item.submitted_at),
        }))
      : [],
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
    dueAt: toMkDateTime(assignment.due_at),
    publishedAt: assignment.published_at ? toMkDateTime(assignment.published_at) : '',
    classroomName: assignment.classroom?.name || assignment.classroom_name || 'Клас',
    subjectName: assignment.subject?.name || assignment.subject_name || 'Предмет',
    submissionCount: assignment.submission_count ?? 0,
    maxPoints:
      assignment.max_points !== undefined && assignment.max_points !== null
        ? String(assignment.max_points)
        : '',
    resourcesCount: Array.isArray(assignment.resources) ? assignment.resources.length : 0,
    stepsCount: Array.isArray(assignment.steps) ? assignment.steps.length : 0,
    contentBlocksCount: Array.isArray(assignment.content_json) ? assignment.content_json.length : 0,
  }));
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

function TeacherArea({ theme, onToggleTheme, onLogout, school, schoolId }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
  });
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [classroomDetailsLoading, setClassroomDetailsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [assignmentDetailsLoading, setAssignmentDetailsLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [performanceOverview, setPerformanceOverview] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [createError, setCreateError] = useState('');

  const openCreateModal = () => {
    setCreateError('');
    setIsCreateModalOpen(true);
  };

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
      return;
    }

    let isMounted = true;
    setAssignmentDetailsLoading(true);

    api
      .assignmentDetails(selectedAssignmentId)
      .then((response) => {
        if (isMounted) {
          setAssignmentDetails(mapTeacherAssignments([response])[0] || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAssignmentDetails(
            teacherAssignments.find((item) => item.id === String(selectedAssignmentId)) || null
          );
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

  const handleCreateAssignment = async (form) => {
    setIsCreatingAssignment(true);
    setAssignmentsLoading(true);
    setCreateError('');
    try {
      if (!form.classroomId || !form.subjectId) {
        setCreateError('Одбери клас и предмет.');
        return;
      }

      const contentBlocks = form.contentJsonText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text, index) => ({
          type: index === 0 ? 'paragraph' : 'instruction',
          text,
        }));

      const resources = form.resourceUrl.trim()
        ? [
            {
              title: form.resourceTitle.trim() || 'Материјал',
              resource_type: form.resourceType,
              external_url: form.resourceUrl.trim(),
              position: 1,
              is_required: true,
            },
          ]
        : [];

      const response = await api.createAssignment({
        title: form.title || 'Нова задача',
        description: form.description,
        due_at: form.dueDate || null,
        assignment_type: form.type,
        classroom_id: Number(form.classroomId),
        subject_id: Number(form.subjectId),
        teacher_notes: form.teacherNotes || null,
        content_json: contentBlocks,
        resources,
        max_points: form.points ? Number(form.points) : null,
      });
      const mappedAssignment = mapTeacherAssignments([response])[0];
      if (mappedAssignment) {
        setTeacherAssignments((previous) => [mappedAssignment, ...previous]);
        setSelectedAssignmentId(mappedAssignment.id);
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      setCreateError(error.message || 'Не успеа креирањето на задачата.');
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

    setAnnouncementLoading(true);
    setAnnouncementError('');
    try {
      const payload = {
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        priority: announcementForm.priority,
        audience_type: announcementForm.audience_type,
        classroom_id:
          announcementForm.audience_type === 'classroom' && selectedClassroomId
            ? Number(selectedClassroomId)
            : null,
      };
      const response = await api.createAnnouncement(payload);
      const mapped = mapAnnouncements([response])[0];
      if (mapped) {
        setAnnouncements((previous) => [mapped, ...previous]);
      }
      setAnnouncementForm({
        title: '',
        body: '',
        priority: 'normal',
        audience_type: 'school',
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
    } catch {
      // keep current UI state
    }
  };

  return (
    <div className={`dashboard-root theme-${theme} teacher-root`}>
      <TeacherNavbar
        theme={theme}
        activePage={activePage}
        onToggleTheme={onToggleTheme}
        onNavigate={setActivePage}
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
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                  Нова задача
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActivePage('classes')}
                >
                  Преглед на класови
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActivePage('notifications')}
                >
                  Види активности
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActivePage('announcements')}
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
                            onClick={openCreateModal}
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
                                  setActivePage('students');
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
                              <p className="item-title">{assignment.title}</p>
                              <p className="item-meta">Статус: {assignment.status}</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {reviewQueue.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Нема предавања за преглед.</td>
                      </tr>
                    ) : (
                      reviewQueue.map((item) => (
                        <tr key={`students-${item.id}`}>
                          <td>
                            <button
                              type="button"
                              className="inline-action teacher-link-button"
                              onClick={() => setSelectedStudentId(item.studentId)}
                            >
                              {item.studentName}
                            </button>
                          </td>
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
                              {submission.status} · {submission.submittedAt}
                            </p>
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
                    </>
                  )}
                </section>
              </div>
            )}
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              Нова задача
            </button>
          </section>
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
                    }))
                  }
                >
                  <option value="school">Цело училиште</option>
                  <option value="classroom">Клас</option>
                  <option value="students">Ученици</option>
                  <option value="teachers">Наставници</option>
                </select>
              </label>
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

      {isCreateModalOpen ? (
        <CreateAssignmentModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateAssignment}
          loading={isCreatingAssignment}
          classrooms={classes}
          subjects={subjects}
          error={createError}
        />
      ) : null}
    </div>
  );
}

export default TeacherArea;
