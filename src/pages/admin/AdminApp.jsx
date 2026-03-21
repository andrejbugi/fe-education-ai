import { useEffect, useMemo, useState } from 'react';
import FlashMessage from '../../components/FlashMessage';
import AdminAssignmentModal from './AdminAssignmentModal';
import AdminDashboardPage from './AdminDashboardPage';
import AdminCreateEntityModal from './AdminCreateEntityModal';
import AdminLoginPage from './AdminLoginPage';
import {
  ADMIN_STORAGE_KEYS,
  ADMIN_UNAUTHORIZED_EVENT,
  adminApi,
  clearAdminSession,
  getStoredAdminPalette,
  getStoredAdminSchoolId,
  getStoredAdminSchoolName,
  getStoredAdminTheme,
  getStoredAdminUser,
  saveAdminSession,
} from '../../services/adminApiClient';

const ADMIN_PALETTES = {
  green: {
    label: 'Green',
    swatch: '#2f8f63',
    light: {
      bgBase: '#eef8f2',
      bgSoft: '#fbfefc',
      surface: '#ffffff',
      surfaceMuted: '#f5fbf7',
      surfaceBorder: '#d5e8dd',
      primary: '#2f8f63',
      hover: '#24724f',
      accent: '#d8f0e3',
      document: '#eef8f2',
      shadow: '0 14px 26px rgba(47, 111, 79, 0.1)',
    },
    dark: {
      bgBase: '#101b16',
      bgSoft: '#15231c',
      surface: '#18271f',
      surfaceMuted: '#1d2f26',
      surfaceBorder: '#315141',
      primary: '#73d5a4',
      hover: '#95e0bb',
      accent: '#20382f',
      document: '#101b16',
      shadow: '0 20px 34px rgba(4, 10, 7, 0.34)',
    },
  },
  pink: {
    label: 'Pink',
    swatch: '#b03d75',
    light: {
      bgBase: '#faf7fb',
      bgSoft: '#fffdfd',
      surface: '#ffffff',
      surfaceMuted: '#fbf7f9',
      surfaceBorder: '#ead6df',
      primary: '#b03d75',
      hover: '#952e61',
      accent: '#f3dbe6',
      document: '#faf3f7',
      shadow: '0 14px 26px rgba(125, 73, 101, 0.08)',
    },
    dark: {
      bgBase: '#18121a',
      bgSoft: '#241b25',
      surface: '#221a22',
      surfaceMuted: '#2b212b',
      surfaceBorder: '#4d3442',
      primary: '#ea78ae',
      hover: '#f29bc2',
      accent: '#3a2131',
      document: '#18121a',
      shadow: '0 20px 34px rgba(5, 3, 5, 0.34)',
    },
  },
  blue: {
    label: 'Blue',
    swatch: '#326fce',
    light: {
      bgBase: '#f2f6ff',
      bgSoft: '#fcfdff',
      surface: '#ffffff',
      surfaceMuted: '#f5f8ff',
      surfaceBorder: '#d8e4fb',
      primary: '#326fce',
      hover: '#2558aa',
      accent: '#dce8ff',
      document: '#f2f6ff',
      shadow: '0 14px 26px rgba(45, 82, 150, 0.1)',
    },
    dark: {
      bgBase: '#111827',
      bgSoft: '#152033',
      surface: '#18253b',
      surfaceMuted: '#1d2c46',
      surfaceBorder: '#31466c',
      primary: '#82b3ff',
      hover: '#a0c7ff',
      accent: '#1e3358',
      document: '#111827',
      shadow: '0 20px 34px rgba(4, 9, 18, 0.36)',
    },
  },
  yellow: {
    label: 'Yellow',
    swatch: '#c89a1b',
    light: {
      bgBase: '#fffaf0',
      bgSoft: '#fffdf7',
      surface: '#ffffff',
      surfaceMuted: '#fffaf2',
      surfaceBorder: '#f2e0ad',
      primary: '#c89a1b',
      hover: '#a57d10',
      accent: '#fff0ba',
      document: '#fffaf0',
      shadow: '0 14px 26px rgba(155, 116, 19, 0.1)',
    },
    dark: {
      bgBase: '#1d190d',
      bgSoft: '#262011',
      surface: '#2a2414',
      surfaceMuted: '#342c18',
      surfaceBorder: '#5c4b21',
      primary: '#f3cf67',
      hover: '#f7db8d',
      accent: '#433614',
      document: '#1d190d',
      shadow: '0 20px 34px rgba(16, 12, 3, 0.36)',
    },
  },
  red: {
    label: 'Red',
    swatch: '#c54d4d',
    light: {
      bgBase: '#fdf4f4',
      bgSoft: '#fffdfd',
      surface: '#ffffff',
      surfaceMuted: '#fdf8f8',
      surfaceBorder: '#f1d7d7',
      primary: '#c54d4d',
      hover: '#a43d3d',
      accent: '#f8dddd',
      document: '#fdf4f4',
      shadow: '0 14px 26px rgba(138, 58, 58, 0.1)',
    },
    dark: {
      bgBase: '#1c1111',
      bgSoft: '#261616',
      surface: '#2b1a1a',
      surfaceMuted: '#362020',
      surfaceBorder: '#5c3131',
      primary: '#f08c8c',
      hover: '#f4a5a5',
      accent: '#412121',
      document: '#1c1111',
      shadow: '0 20px 34px rgba(16, 5, 5, 0.36)',
    },
  },
  orange: {
    label: 'Orange',
    swatch: '#d7792a',
    light: {
      bgBase: '#fff7f1',
      bgSoft: '#fffdfb',
      surface: '#ffffff',
      surfaceMuted: '#fff8f2',
      surfaceBorder: '#f3dbc8',
      primary: '#d7792a',
      hover: '#b96219',
      accent: '#ffe3c8',
      document: '#fff7f1',
      shadow: '0 14px 26px rgba(161, 95, 32, 0.1)',
    },
    dark: {
      bgBase: '#1f140d',
      bgSoft: '#2a1b11',
      surface: '#301f14',
      surfaceMuted: '#3a2518',
      surfaceBorder: '#644026',
      primary: '#ffb06f',
      hover: '#ffc18f',
      accent: '#452a17',
      document: '#1f140d',
      shadow: '0 20px 34px rgba(17, 8, 3, 0.36)',
    },
  },
};

const DEFAULT_ADMIN_PALETTE = 'green';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = getStoredAdminTheme();
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
    return 'dark';
  }

  return 'light';
}

function getInitialPalette() {
  const storedPalette = getStoredAdminPalette();
  return ADMIN_PALETTES[storedPalette] ? storedPalette : DEFAULT_ADMIN_PALETTE;
}

function getInitialPathname() {
  if (typeof window === 'undefined') {
    return '/admin/login';
  }

  return window.location.pathname || '/admin/login';
}

function getInitialLoggedIn() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(
    window.localStorage.getItem(ADMIN_STORAGE_KEYS.loggedIn) ||
      window.localStorage.getItem(ADMIN_STORAGE_KEYS.user)
  );
}

function getUserRoles(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.length > 0) {
    return roles;
  }

  return user?.role ? [user.role] : [];
}

function isAdminUser(user) {
  return getUserRoles(user).includes('admin');
}

function mapSchoolsToOptions(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }

  return schools.map((school) => ({
    id: String(school.id),
    name: school.name || `Училиште ${school.id}`,
    code: school.code || '',
    city: school.city || '',
    active: school.active !== false,
  }));
}

function getAdminRouteState(pathname, loggedIn) {
  if (pathname === '/admin/login') {
    return 'login';
  }

  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return 'dashboard';
  }

  return loggedIn ? 'dashboard' : 'login';
}

function getDisplayName(user) {
  if (user?.full_name) {
    return user.full_name;
  }
  if (user?.fullName) {
    return user.fullName;
  }
  if (user?.name) {
    return user.name;
  }

  return 'Администратор';
}

function getCollection(payload, key) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function getCount(payload, collection, key) {
  const countCandidates = [
    payload?.meta?.total,
    payload?.meta?.count,
    payload?.meta?.total_count,
    payload?.total,
    payload?.count,
    payload?.total_count,
    payload?.[`${key}_count`],
  ];

  const resolvedCount = countCandidates.find((value) => Number.isFinite(Number(value)));
  if (resolvedCount !== undefined) {
    return Number(resolvedCount);
  }

  return collection.length;
}

function getStatusPresentation(item) {
  const invitationStatus = item?.invitation_status || item?.invitation?.status || '';
  const accountStatus = item?.status || '';
  const normalizedInvitationStatus = String(invitationStatus).toLowerCase();
  const normalizedAccountStatus = String(accountStatus).toLowerCase();
  const acceptedAt =
    item?.accepted_at ||
    item?.invitation_accepted_at ||
    item?.invitation?.accepted_at ||
    item?.invitation?.acceptedAt;
  const expiresAt =
    item?.invitation_expires_at ||
    item?.expires_at ||
    item?.invitation?.expires_at ||
    item?.invitation?.expiresAt;
  const isAccepted = Boolean(acceptedAt) || normalizedInvitationStatus.includes('accepted');
  const isDeactivated =
    item?.active === false ||
    normalizedAccountStatus.includes('deactiv') ||
    normalizedInvitationStatus.includes('deactiv');
  const isExplicitlyInactive =
    normalizedAccountStatus.includes('inactive') || normalizedInvitationStatus.includes('inactive');
  const isExpired =
    normalizedInvitationStatus.includes('expired') ||
    (!isAccepted &&
      Boolean(expiresAt) &&
      !Number.isNaN(new Date(expiresAt).getTime()) &&
      new Date(expiresAt).getTime() < Date.now());
  const isPending =
    normalizedInvitationStatus.includes('pending') ||
    normalizedInvitationStatus.includes('sent');
  const isActive =
    item?.active === true ||
    normalizedAccountStatus.includes('active') ||
    (isAccepted && !isDeactivated);

  if (isDeactivated) {
    return { label: isAccepted ? 'Деактивиран' : 'Неактивен', tone: 'is-inactive' };
  }
  if (isExpired) {
    return { label: 'Истечена покана', tone: 'is-warn' };
  }
  if (isPending) {
    return { label: 'Поканет', tone: 'is-pending' };
  }
  if (isActive) {
    return { label: 'Активен', tone: 'is-active' };
  }
  if (isExplicitlyInactive) {
    return { label: 'Неактивен', tone: 'is-inactive' };
  }

  return { label: 'Во подготовка', tone: 'is-neutral' };
}

function buildAssignmentSummary(item, type) {
  const classroomCount =
    item?.classroom_ids?.length ||
    item?.classrooms?.length ||
    item?.classroom_count ||
    item?.assignment_counts?.classrooms ||
    0;
  const subjectCount =
    item?.subject_ids?.length ||
    item?.subjects?.length ||
    item?.subject_count ||
    item?.assignment_counts?.subjects ||
    0;

  if (type === 'teacher') {
    return `${classroomCount} паралелки · ${subjectCount} предмети`;
  }

  return `${classroomCount} паралелки`;
}

function normalizePeople(payload, key, type) {
  return getCollection(payload, key).map((item, index) => {
    const status = getStatusPresentation(item);
    return {
      id: item?.id ?? `${type}-${index}`,
      name:
        item?.full_name ||
        item?.fullName ||
        item?.name ||
        [item?.first_name, item?.last_name].filter(Boolean).join(' ') ||
        'Без име',
      email: item?.email || '',
      statusLabel: status.label,
      statusTone: status.tone,
      classroomIds: (item?.classroom_ids || item?.classrooms || [])
        .map((entry) => String(entry?.id ?? entry))
        .filter(Boolean),
      subjectIds: (item?.subject_ids || item?.subjects || [])
        .map((entry) => String(entry?.id ?? entry))
        .filter(Boolean),
      assignmentSummary: buildAssignmentSummary(item, type),
    };
  });
}

function createEmptyDashboardData() {
  return {
    stats: [],
    schoolSummary: {
      name: '',
      code: '',
      city: '',
      active: true,
      classroomCount: 0,
      subjectCount: 0,
      topicCount: 0,
    },
    teachers: [],
    students: [],
    classrooms: [],
    subjects: [],
  };
}

const CREATE_ENTITY_FIELDS = {
  classroom: [
    {
      id: 'name',
      label: 'Име на паралелка',
      placeholder: 'пр. 7-A',
      required: true,
    },
    {
      id: 'grade_level',
      label: 'Одделение',
      placeholder: 'пр. 7',
      required: false,
    },
    {
      id: 'academic_year',
      label: 'Учебна година',
      placeholder: 'пр. 2025/2026',
      required: false,
    },
  ],
  subject: [
    {
      id: 'name',
      label: 'Име на предмет',
      placeholder: 'пр. Математика',
      required: true,
    },
    {
      id: 'code',
      label: 'Код',
      placeholder: 'пр. MAT-7',
      required: false,
    },
  ],
};

function normalizeClassrooms(payload) {
  return getCollection(payload, 'classrooms').map((item, index) => ({
    id: item?.id ?? `classroom-${index}`,
    name: item?.name || `Паралелка ${index + 1}`,
    subtitle:
      [item?.grade_level || item?.gradeLevel, item?.academic_year || item?.academicYear]
        .filter(Boolean)
        .join(' · ') || 'Без дополнителни детали',
    studentCount:
      item?.student_count ||
      item?.students_count ||
      item?.students?.length ||
      item?.membership_ids?.length ||
      0,
    teacherCount:
      item?.teacher_count ||
      item?.teachers_count ||
      item?.teachers?.length ||
      item?.teacher_ids?.length ||
      0,
    teacherIds: (item?.teacher_ids || item?.teachers || [])
      .map((entry) => String(entry?.id ?? entry))
      .filter(Boolean),
    studentIds: (item?.student_ids || item?.students || item?.membership_ids || [])
      .map((entry) => String(entry?.id ?? entry))
      .filter(Boolean),
  }));
}

function normalizeSubjects(payload) {
  return getCollection(payload, 'subjects').map((item, index) => ({
    id: item?.id ?? `subject-${index}`,
    name: item?.name || `Предмет ${index + 1}`,
    code: item?.code || '',
    topicCount:
      item?.topic_count ||
      item?.topics?.length ||
      item?.subject_topics?.length ||
      item?.assignment_counts?.topics ||
      0,
    teacherCount:
      item?.teacher_count ||
      item?.teachers?.length ||
      item?.teacher_ids?.length ||
      0,
    classroomCount:
      item?.classroom_count ||
      item?.classrooms?.length ||
      item?.classroom_ids?.length ||
      0,
    teacherIds: (item?.teacher_ids || item?.teachers || [])
      .map((entry) => String(entry?.id ?? entry))
      .filter(Boolean),
    classroomIds: (item?.classroom_ids || item?.classrooms || [])
      .map((entry) => String(entry?.id ?? entry))
      .filter(Boolean),
  }));
}

function normalizeSchoolSummary(payload, fallbackSchoolName) {
  const school = payload?.school || payload || {};
  const classrooms = getCollection(school, 'classrooms');
  const subjects = getCollection(school, 'subjects');
  const topicCount = subjects.reduce((sum, subject) => {
    const subjectTopics = Array.isArray(subject?.subject_topics)
      ? subject.subject_topics.length
      : Array.isArray(subject?.topics)
        ? subject.topics.length
        : 0;
    return sum + subjectTopics;
  }, 0);

  return {
    name: school?.name || fallbackSchoolName || '',
    code: school?.code || '',
    city: school?.city || '',
    active: school?.active !== false,
    classroomCount: classrooms.length,
    subjectCount: subjects.length,
    topicCount,
  };
}

function buildStats({
  teachers,
  students,
  classrooms,
  subjects,
  teacherCount,
  studentCount,
  classroomCount,
  subjectCount,
}) {
  const invitedTeachers = teachers.filter((item) => item.statusTone === 'is-pending').length;
  const invitedStudents = students.filter((item) => item.statusTone === 'is-pending').length;
  const subjectTopics = subjects.reduce((sum, subject) => sum + subject.topicCount, 0);

  return [
    {
      label: 'Наставници',
      value: teacherCount,
      note: invitedTeachers > 0 ? `${invitedTeachers} со активна покана` : 'Подготвени профили',
    },
    {
      label: 'Ученици',
      value: studentCount,
      note: invitedStudents > 0 ? `${invitedStudents} со активна покана` : 'Запишани профили',
    },
    {
      label: 'Паралелки',
      value: classroomCount,
      note: classrooms.length > 0 ? 'Структура по одделение' : 'Уште нема креирани',
    },
    {
      label: 'Предмети',
      value: subjectCount,
      note: subjectTopics > 0 ? `${subjectTopics} теми вкупно` : 'Почетен каталог',
    },
  ];
}

function AdminApp() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [palette, setPalette] = useState(getInitialPalette);
  const [loggedIn, setLoggedIn] = useState(getInitialLoggedIn);
  const [pathname, setPathname] = useState(getInitialPathname);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [bootstrapChecked, setBootstrapChecked] = useState(false);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(() => getStoredAdminSchoolId() || '');
  const [selectedSchoolName, setSelectedSchoolName] = useState(getStoredAdminSchoolName);
  const [user, setUser] = useState(getStoredAdminUser);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createModal, setCreateModal] = useState(null);
  const [createValues, setCreateValues] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [assignmentModal, setAssignmentModal] = useState(null);
  const [assignmentValues, setAssignmentValues] = useState({
    teacherIds: [],
    studentIds: [],
    classroomIds: [],
    subjectIds: [],
  });
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [flash, setFlash] = useState(null);
  const [dashboardData, setDashboardData] = useState(createEmptyDashboardData);

  const route = useMemo(() => getAdminRouteState(pathname, loggedIn), [pathname, loggedIn]);

  const showFlash = (message, type = 'success') => {
    setFlash({
      id: Date.now(),
      message,
      type,
    });
  };

  const navigate = (nextPath, options = {}) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.location.pathname !== nextPath) {
      const method = options.replace ? 'replaceState' : 'pushState';
      window.history[method]({}, '', nextPath);
    }

    setPathname(nextPath);
  };

  const applySession = ({ user: nextUser, schools, school }) => {
    const normalizedSchools = mapSchoolsToOptions(schools);
    const responseSchool = school?.id
      ? { id: String(school.id), name: school.name || `Училиште ${school.id}` }
      : null;
    const activeSchool =
      normalizedSchools.find((item) => item.id === String(responseSchool?.id || '')) ||
      normalizedSchools.find((item) => item.id === getStoredAdminSchoolId()) ||
      normalizedSchools[0] ||
      responseSchool;

    if (!activeSchool?.id) {
      throw new Error('Администраторот нема достапно училиште за работа.');
    }

    setUser(nextUser);
    setSchoolOptions(normalizedSchools);
    setSelectedSchoolId(String(activeSchool.id));
    setSelectedSchoolName(activeSchool.name);
    saveAdminSession({
      user: nextUser,
      school: activeSchool,
    });
  };

  const handleLogout = () => {
    adminApi.logout().catch(() => null);
    clearAdminSession();
    setLoggedIn(false);
    setUser(null);
    setAuthError('');
    setDashboardError('');
    setSchoolOptions([]);
    setSelectedSchoolId('');
    setSelectedSchoolName('');
    setInviteModal(null);
    setInviteEmail('');
    setInviteError('');
    setCreateMenuOpen(false);
    setCreateModal(null);
    setCreateValues({});
    setCreateError('');
    setAssignmentModal(null);
    setAssignmentValues({ teacherIds: [], studentIds: [], classroomIds: [], subjectIds: [] });
    setAssignmentError('');
    setDashboardData(createEmptyDashboardData());
    navigate('/admin/login', { replace: true });
    showFlash('Администраторската сесија е затворена.', 'success');
  };

  const applyDashboardPayload = ({
    schoolPayload,
    teachersPayload,
    studentsPayload,
    classroomsPayload,
    subjectsPayload,
    fallbackSchoolName,
  }) => {
    const teachers = normalizePeople(teachersPayload, 'teachers', 'teacher');
    const students = normalizePeople(studentsPayload, 'students', 'student');
    const classrooms = normalizeClassrooms(classroomsPayload);
    const subjects = normalizeSubjects(subjectsPayload);
    const schoolSummary = normalizeSchoolSummary(schoolPayload, fallbackSchoolName);

    setDashboardData({
      stats: buildStats({
        teachers,
        students,
        classrooms,
        subjects,
        teacherCount: getCount(teachersPayload, teachers, 'teachers'),
        studentCount: getCount(studentsPayload, students, 'students'),
        classroomCount: getCount(classroomsPayload, classrooms, 'classrooms'),
        subjectCount: getCount(subjectsPayload, subjects, 'subjects'),
      }),
      schoolSummary,
      teachers,
      students,
      classrooms,
      subjects,
    });
  };

  const refreshPeopleCollection = async (role) => {
    const [teachersPayload, studentsPayload] = await Promise.all([
      role === 'teacher'
        ? adminApi.adminTeachers({ limit: 100 })
        : Promise.resolve({ teachers: dashboardData.teachers }),
      role === 'student'
        ? adminApi.adminStudents({ limit: 100 })
        : Promise.resolve({ students: dashboardData.students }),
    ]);

    const teachers = normalizePeople(teachersPayload, 'teachers', 'teacher');
    const students = normalizePeople(studentsPayload, 'students', 'student');

    setDashboardData((previous) => ({
      ...previous,
      teachers,
      students,
      stats: buildStats({
        teachers,
        students,
        classrooms: previous.classrooms,
        subjects: previous.subjects,
        teacherCount: getCount(teachersPayload, teachers, 'teachers'),
        studentCount: getCount(studentsPayload, students, 'students'),
        classroomCount: previous.classrooms.length,
        subjectCount: previous.subjects.length,
      }),
    }));
  };

  const refreshSetupCollection = async (type) => {
    const [classroomsPayload, subjectsPayload] = await Promise.all([
      type === 'classroom'
        ? adminApi.adminClassrooms({ limit: 100 })
        : Promise.resolve({ classrooms: dashboardData.classrooms }),
      type === 'subject'
        ? adminApi.adminSubjects({ limit: 100 })
        : Promise.resolve({ subjects: dashboardData.subjects }),
    ]);

    const classrooms = normalizeClassrooms(classroomsPayload);
    const subjects = normalizeSubjects(subjectsPayload);

    setDashboardData((previous) => ({
      ...previous,
      classrooms,
      subjects,
      schoolSummary: {
        ...previous.schoolSummary,
        classroomCount: classrooms.length,
        subjectCount: subjects.length,
        topicCount: subjects.reduce((sum, subject) => sum + subject.topicCount, 0),
      },
      stats: buildStats({
        teachers: previous.teachers,
        students: previous.students,
        classrooms,
        subjects,
        teacherCount: previous.teachers.length,
        studentCount: previous.students.length,
        classroomCount: getCount(classroomsPayload, classrooms, 'classrooms'),
        subjectCount: getCount(subjectsPayload, subjects, 'subjects'),
      }),
    }));
  };

  useEffect(() => {
    if (!flash?.id) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFlash(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [flash]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = () => {
      setPathname(window.location.pathname || '/admin/login');
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

    window.localStorage.setItem(ADMIN_STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(ADMIN_STORAGE_KEYS.palette, palette);
  }, [palette]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const activePalette =
      ADMIN_PALETTES[palette]?.[theme] || ADMIN_PALETTES[DEFAULT_ADMIN_PALETTE][theme];
    const backgroundColor = activePalette.document;
    document.documentElement.style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', backgroundColor);
    }
  }, [theme, palette]);

  useEffect(() => {
    if (!loggedIn) {
      setBootstrapChecked(true);
      return;
    }

    let isMounted = true;
    adminApi
      .me()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        if (!isAdminUser(response?.user)) {
          throw new Error('Овој профил нема администраторски пристап.');
        }

        applySession({
          user: response.user,
          schools: response?.schools,
          school: response?.current_school || response?.school,
        });
        setLoggedIn(true);
      })
      .catch((error) => {
        clearAdminSession();
        if (!isMounted) {
          return;
        }

        setLoggedIn(false);
        setUser(null);
        setAuthError(error.message || 'Сесијата е истечена. Најавете се повторно.');
      })
      .finally(() => {
        if (isMounted) {
          setBootstrapChecked(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleUnauthorized = () => {
      clearAdminSession();
      setLoggedIn(false);
      setBootstrapChecked(true);
      setUser(null);
      setDashboardError('');
      setSchoolOptions([]);
      setSelectedSchoolId('');
      setSelectedSchoolName('');
      setInviteModal(null);
      setInviteEmail('');
      setInviteError('');
      setCreateMenuOpen(false);
      setCreateModal(null);
      setCreateValues({});
      setCreateError('');
      setAssignmentModal(null);
      setAssignmentValues({ teacherIds: [], studentIds: [], classroomIds: [], subjectIds: [] });
      setAssignmentError('');
      setDashboardData(createEmptyDashboardData());
      navigate('/admin/login', { replace: true });
      showFlash('Администраторската сесија е истечена. Најавете се повторно.', 'error');
    };

    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (!bootstrapChecked) {
      return;
    }

    if (!loggedIn) {
      if (pathname !== '/admin/login') {
        navigate('/admin/login', { replace: true });
      }
      return;
    }

    if (route === 'login') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [bootstrapChecked, loggedIn, pathname, route]);

  useEffect(() => {
    if (!loggedIn || route !== 'dashboard' || !selectedSchoolId) {
      return;
    }

    let isMounted = true;
    setDashboardLoading(true);
    setDashboardError('');

    Promise.allSettled([
      adminApi.adminSchoolDetails(selectedSchoolId),
      adminApi.adminTeachers({ limit: 100 }),
      adminApi.adminStudents({ limit: 100 }),
      adminApi.adminClassrooms({ limit: 100 }),
      adminApi.adminSubjects({ limit: 100 }),
    ])
      .then((results) => {
        if (!isMounted) {
          return;
        }

        const [
          schoolDetailResult,
          teachersResult,
          studentsResult,
          classroomsResult,
          subjectsResult,
        ] = results;

        const schoolPayload =
          schoolDetailResult.status === 'fulfilled' ? schoolDetailResult.value : null;
        const teachersPayload =
          teachersResult.status === 'fulfilled' ? teachersResult.value : { teachers: [] };
        const studentsPayload =
          studentsResult.status === 'fulfilled' ? studentsResult.value : { students: [] };
        const classroomsPayload =
          classroomsResult.status === 'fulfilled' ? classroomsResult.value : { classrooms: [] };
        const subjectsPayload =
          subjectsResult.status === 'fulfilled' ? subjectsResult.value : { subjects: [] };

        applyDashboardPayload({
          schoolPayload,
          teachersPayload,
          studentsPayload,
          classroomsPayload,
          subjectsPayload,
          fallbackSchoolName: selectedSchoolName,
        });

        const rejectedResults = results.filter((result) => result.status === 'rejected');
        if (rejectedResults.length > 0) {
          setDashboardError('Дел од админ податоците не се вчитаа целосно. Прикажан е достапниот преглед.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setDashboardError('Не може да се вчита админ контролната табла.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setDashboardLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loggedIn, route, selectedSchoolId, selectedSchoolName]);

  const handleAuthSubmit = async () => {
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await adminApi.login({
        email: authForm.email,
        password: authForm.password,
      });
      const meResponse = await adminApi.me();
      const resolvedUser = meResponse?.user || response?.user;

      if (!isAdminUser(resolvedUser)) {
        throw new Error('Овој профил не е администраторски. Користете ја соодветната најава.');
      }

      applySession({
        user: resolvedUser,
        schools: meResponse?.schools || response?.schools,
        school: meResponse?.current_school || response?.school || meResponse?.school,
      });

      setLoggedIn(true);
      navigate('/admin/dashboard', { replace: true });
      showFlash('Успешно се најавивте како администратор.', 'success');
    } catch (error) {
      setAuthError(error.message || 'Најавата не успеа.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSelectSchool = (schoolId) => {
    setSelectedSchoolId(schoolId);
    const selectedSchool = schoolOptions.find((option) => option.id === schoolId);
    if (selectedSchool) {
      setSelectedSchoolName(selectedSchool.name);
      saveAdminSession({ school: selectedSchool });
    }
  };

  const handleOpenInviteModal = (role) => {
    setInviteModal(role);
    setInviteEmail('');
    setInviteError('');
  };

  const handleCloseInviteModal = () => {
    if (inviteLoading) {
      return;
    }

    setInviteModal(null);
    setInviteEmail('');
    setInviteError('');
  };

  const handleOpenCreateMenu = () => {
    setCreateMenuOpen((current) => !current);
  };

  const handleOpenCreateModal = (type) => {
    setCreateMenuOpen(false);
    setCreateModal(type);
    setCreateValues({});
    setCreateError('');
  };

  const handleCloseCreateModal = () => {
    if (createLoading) {
      return;
    }

    setCreateModal(null);
    setCreateValues({});
    setCreateError('');
  };

  const handleOpenAssignmentModal = (type, entity) => {
    const entityId = String(entity?.id || '');
    if (!entityId) {
      return;
    }

    const teacherIds =
      type === 'classroom' || type === 'subject'
        ? dashboardData.teachers
            .filter((teacher) =>
              type === 'classroom'
                ? teacher.classroomIds.includes(entityId)
                : teacher.subjectIds.includes(entityId)
            )
            .map((teacher) => String(teacher.id))
        : [];
    const studentIds =
      type === 'classroom'
        ? dashboardData.students
            .filter((student) => student.classroomIds.includes(entityId))
            .map((student) => String(student.id))
        : [];
    const classroomIds =
      type === 'teacher' || type === 'student'
        ? entity.classroomIds.map((id) => String(id))
        : [];
    const subjectIds = type === 'teacher' ? entity.subjectIds.map((id) => String(id)) : [];

    setAssignmentModal({ type, entity });
    setAssignmentValues({ teacherIds, studentIds, classroomIds, subjectIds });
    setAssignmentError('');
  };

  const handleCloseAssignmentModal = () => {
    if (assignmentLoading) {
      return;
    }

    setAssignmentModal(null);
    setAssignmentValues({ teacherIds: [], studentIds: [], classroomIds: [], subjectIds: [] });
    setAssignmentError('');
  };

  const addAssignmentValue = (key, id) => {
    setAssignmentValues((previous) => ({
      ...previous,
      [key]: previous[key].includes(String(id)) ? previous[key] : [...previous[key], String(id)],
    }));
  };

  const removeAssignmentValue = (key, id) => {
    setAssignmentValues((previous) => ({
      ...previous,
      [key]: previous[key].filter((entry) => entry !== String(id)),
    }));
  };

  const handleCreateFieldChange = (fieldId, value) => {
    setCreateValues((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  };

  const handleSubmitInvite = async () => {
    if (!inviteModal) {
      return;
    }

    setInviteError('');
    setInviteLoading(true);

    try {
      if (inviteModal === 'teacher') {
        await adminApi.createAdminTeacher({ email: inviteEmail.trim() });
        await refreshPeopleCollection('teacher');
        showFlash('Поканата за наставник е испратена.', 'success');
      } else {
        await adminApi.createAdminStudent({ email: inviteEmail.trim() });
        await refreshPeopleCollection('student');
        showFlash('Поканата за ученик е испратена.', 'success');
      }

      setInviteModal(null);
      setInviteEmail('');
    } catch (error) {
      setInviteError(error.message || 'Поканата не успеа.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSubmitCreate = async () => {
    if (!createModal) {
      return;
    }

    setCreateError('');
    setCreateLoading(true);

    try {
      if (createModal === 'classroom') {
        await adminApi.createAdminClassroom({
          name: createValues.name?.trim(),
          grade_level: createValues.grade_level?.trim() || undefined,
          academic_year: createValues.academic_year?.trim() || undefined,
        });
        await refreshSetupCollection('classroom');
        showFlash('Паралелката е креирана.', 'success');
      }

      if (createModal === 'subject') {
        await adminApi.createAdminSubject({
          name: createValues.name?.trim(),
          code: createValues.code?.trim() || undefined,
        });
        await refreshSetupCollection('subject');
        showFlash('Предметот е креиран.', 'success');
      }

      setCreateModal(null);
      setCreateValues({});
    } catch (error) {
      setCreateError(error.message || 'Креирањето не успеа.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmitAssignments = async () => {
    if (!assignmentModal?.entity?.id) {
      return;
    }

    setAssignmentError('');
    setAssignmentLoading(true);

    try {
      if (assignmentModal.type === 'classroom') {
        const classroomId = String(assignmentModal.entity.id);
        const teacherUpdates = dashboardData.teachers
          .filter((teacher) => {
            const isAssigned = teacher.classroomIds.includes(classroomId);
            const shouldBeAssigned = assignmentValues.teacherIds.includes(String(teacher.id));
            return isAssigned !== shouldBeAssigned;
          })
          .map((teacher) => {
            const nextClassroomIds = assignmentValues.teacherIds.includes(String(teacher.id))
              ? [...teacher.classroomIds, classroomId]
              : teacher.classroomIds.filter((id) => id !== classroomId);

            return adminApi.updateAdminTeacherClassrooms(teacher.id, {
              classroom_ids: nextClassroomIds.map((id) => Number(id)),
            });
          });
        const studentUpdates = dashboardData.students
          .filter((student) => {
            const isAssigned = student.classroomIds.includes(classroomId);
            const shouldBeAssigned = assignmentValues.studentIds.includes(String(student.id));
            return isAssigned !== shouldBeAssigned;
          })
          .map((student) => {
            const nextClassroomIds = assignmentValues.studentIds.includes(String(student.id))
              ? [...student.classroomIds, classroomId]
              : student.classroomIds.filter((id) => id !== classroomId);

            return adminApi.updateAdminStudentClassrooms(student.id, {
              classroom_ids: nextClassroomIds.map((id) => Number(id)),
            });
          });

        await Promise.all([...teacherUpdates, ...studentUpdates]);
      }

      if (assignmentModal.type === 'subject') {
        const subjectId = String(assignmentModal.entity.id);
        const teacherUpdates = dashboardData.teachers
          .filter((teacher) => {
            const isAssigned = teacher.subjectIds.includes(subjectId);
            const shouldBeAssigned = assignmentValues.teacherIds.includes(String(teacher.id));
            return isAssigned !== shouldBeAssigned;
          })
          .map((teacher) => {
            const nextSubjectIds = assignmentValues.teacherIds.includes(String(teacher.id))
              ? [...teacher.subjectIds, subjectId]
              : teacher.subjectIds.filter((id) => id !== subjectId);

            return adminApi.updateAdminTeacherSubjects(teacher.id, {
              subject_ids: nextSubjectIds.map((id) => Number(id)),
            });
          });

        await Promise.all(teacherUpdates);
      }

      if (assignmentModal.type === 'teacher') {
        const teacherId = assignmentModal.entity.id;
        const teacherClassroomsChanged =
          [...(assignmentModal.entity.classroomIds || [])].sort().join(',') !==
          [...assignmentValues.classroomIds].sort().join(',');
        const teacherSubjectsChanged =
          [...(assignmentModal.entity.subjectIds || [])].sort().join(',') !==
          [...assignmentValues.subjectIds].sort().join(',');

        const updates = [];
        if (teacherClassroomsChanged) {
          updates.push(
            adminApi.updateAdminTeacherClassrooms(teacherId, {
              classroom_ids: assignmentValues.classroomIds.map((id) => Number(id)),
            })
          );
        }
        if (teacherSubjectsChanged) {
          updates.push(
            adminApi.updateAdminTeacherSubjects(teacherId, {
              subject_ids: assignmentValues.subjectIds.map((id) => Number(id)),
            })
          );
        }

        await Promise.all(updates);
      }

      if (assignmentModal.type === 'student') {
        await adminApi.updateAdminStudentClassrooms(assignmentModal.entity.id, {
          classroom_ids: assignmentValues.classroomIds.map((id) => Number(id)),
        });
      }

      const [
        schoolPayload,
        teachersPayload,
        studentsPayload,
        classroomsPayload,
        subjectsPayload,
      ] = await Promise.all([
        adminApi.adminSchoolDetails(selectedSchoolId),
        adminApi.adminTeachers({ limit: 100 }),
        adminApi.adminStudents({ limit: 100 }),
        adminApi.adminClassrooms({ limit: 100 }),
        adminApi.adminSubjects({ limit: 100 }),
      ]);

      applyDashboardPayload({
        schoolPayload,
        teachersPayload,
        studentsPayload,
        classroomsPayload,
        subjectsPayload,
        fallbackSchoolName: selectedSchoolName,
      });

      setAssignmentModal(null);
      setAssignmentValues({ teacherIds: [], studentIds: [], classroomIds: [], subjectIds: [] });
      showFlash(
        assignmentModal.type === 'classroom'
          ? 'Паралелката е ажурирана.'
          : assignmentModal.type === 'subject'
            ? 'Предметот е ажуриран.'
            : assignmentModal.type === 'teacher'
              ? 'Наставникот е ажуриран.'
              : 'Ученикот е ажуриран.',
        'success'
      );
    } catch (error) {
      setAssignmentError(error.message || 'Поврзувањето не успеа.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  if (!bootstrapChecked) {
    return (
      <>
        <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
        <main className={`auth-root theme-${theme}`}>
          <section className="auth-card">
            <p className="auth-eyebrow">Се вчитува администраторската сесија...</p>
          </section>
        </main>
      </>
    );
  }

  if (!loggedIn) {
    return (
      <>
        <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
        <AdminLoginPage
          theme={theme}
          email={authForm.email}
          password={authForm.password}
          onEmailChange={(email) => setAuthForm((previous) => ({ ...previous, email }))}
          onPasswordChange={(password) =>
            setAuthForm((previous) => ({ ...previous, password }))
          }
          onSubmit={() => void handleAuthSubmit()}
          loading={authLoading}
          error={authError}
        />
      </>
    );
  }

  const activePalette = ADMIN_PALETTES[palette] || ADMIN_PALETTES[DEFAULT_ADMIN_PALETTE];
  const paletteTheme = activePalette[theme];
  const paletteStyle = {
    '--bg-base': paletteTheme.bgBase,
    '--bg-soft': paletteTheme.bgSoft,
    '--surface': paletteTheme.surface,
    '--surface-muted': paletteTheme.surfaceMuted,
    '--surface-border': paletteTheme.surfaceBorder,
    '--primary': paletteTheme.primary,
    '--primary-hover': paletteTheme.hover,
    '--bg-accent': paletteTheme.accent,
    '--shadow': paletteTheme.shadow,
  };

  return (
    <>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      <AdminDashboardPage
        theme={theme}
        palette={palette}
        palettes={Object.entries(ADMIN_PALETTES).map(([id, item]) => ({
          id,
          label: item.label,
          swatch: item.swatch,
        }))}
        onChangePalette={setPalette}
        paletteStyle={paletteStyle}
        userName={getDisplayName(user)}
        schoolName={selectedSchoolName}
        schoolOptions={schoolOptions}
        selectedSchoolId={selectedSchoolId}
        onSelectSchool={handleSelectSchool}
        onLogout={handleLogout}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        createMenuOpen={createMenuOpen}
        onToggleCreateMenu={handleOpenCreateMenu}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenAssignmentModal={handleOpenAssignmentModal}
        inviteModal={inviteModal}
        inviteEmail={inviteEmail}
        onInviteEmailChange={setInviteEmail}
        onOpenInviteModal={handleOpenInviteModal}
        onCloseInviteModal={handleCloseInviteModal}
        onSubmitInvite={() => void handleSubmitInvite()}
        inviteLoading={inviteLoading}
        inviteError={inviteError}
        stats={dashboardData.stats}
        schoolSummary={dashboardData.schoolSummary}
        teachers={dashboardData.teachers}
        students={dashboardData.students}
        classrooms={dashboardData.classrooms}
        subjects={dashboardData.subjects}
        loading={dashboardLoading}
        loadError={dashboardError}
      />
      {createModal ? (
        <AdminCreateEntityModal
          entityType={createModal}
          values={createValues}
          fields={CREATE_ENTITY_FIELDS[createModal] || []}
          onChange={handleCreateFieldChange}
          onClose={handleCloseCreateModal}
          onSubmit={() => void handleSubmitCreate()}
          loading={createLoading}
          error={createError}
          theme={theme}
          paletteStyle={paletteStyle}
        />
      ) : null}
      {assignmentModal ? (
        <AdminAssignmentModal
          entityType={assignmentModal.type}
          entity={assignmentModal.entity}
          teachers={dashboardData.teachers}
          students={dashboardData.students}
          subjects={dashboardData.subjects}
          classrooms={dashboardData.classrooms}
          values={assignmentValues}
          onAddTeacher={(id) => addAssignmentValue('teacherIds', id)}
          onRemoveTeacher={(id) => removeAssignmentValue('teacherIds', id)}
          onAddStudent={(id) => addAssignmentValue('studentIds', id)}
          onRemoveStudent={(id) => removeAssignmentValue('studentIds', id)}
          onAddClassroom={(id) => addAssignmentValue('classroomIds', id)}
          onRemoveClassroom={(id) => removeAssignmentValue('classroomIds', id)}
          onAddSubject={(id) => addAssignmentValue('subjectIds', id)}
          onRemoveSubject={(id) => removeAssignmentValue('subjectIds', id)}
          onClose={handleCloseAssignmentModal}
          onSubmit={() => void handleSubmitAssignments()}
          loading={assignmentLoading}
          error={assignmentError}
          theme={theme}
          paletteStyle={paletteStyle}
        />
      ) : null}
    </>
  );
}

export default AdminApp;
