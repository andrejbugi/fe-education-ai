import { useCallback, useEffect, useMemo, useState } from 'react';
import FlashMessage from '../../components/FlashMessage';
import AdminAssignmentModal from './AdminAssignmentModal';
import AdminDashboardPage from './AdminDashboardPage';
import AdminCreateEntityModal from './AdminCreateEntityModal';
import AdminPersonEditPage from './AdminPersonEditPage';
import AdminSchedulePage from './AdminSchedulePage';
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
const STUDENTS_SECTION_PER_PAGE = 25;

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
  if (pathname === '/admin/schedule') {
    return { name: 'schedule', entityType: '', entityId: '' };
  }

  const teacherEditMatch = String(pathname || '').match(/^\/admin\/teachers\/([^/]+)\/edit$/);
  if (teacherEditMatch) {
    return { name: 'teacher-edit', entityType: 'teacher', entityId: teacherEditMatch[1] };
  }

  const studentEditMatch = String(pathname || '').match(/^\/admin\/students\/([^/]+)\/edit$/);
  if (studentEditMatch) {
    return { name: 'student-edit', entityType: 'student', entityId: studentEditMatch[1] };
  }

  if (pathname === '/admin/login') {
    return { name: 'login', entityType: '', entityId: '' };
  }

  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return { name: 'dashboard', entityType: '', entityId: '' };
  }

  return loggedIn
    ? { name: 'dashboard', entityType: '', entityId: '' }
    : { name: 'login', entityType: '', entityId: '' };
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

function getValueAtPath(item, path) {
  return String(path || '')
    .split('.')
    .reduce((current, segment) => (current && current[segment] !== undefined ? current[segment] : undefined), item);
}

function getFirstNumericValue(candidates) {
  const resolved = candidates.find((value) => Number.isFinite(Number(value)));
  return resolved !== undefined ? Number(resolved) : null;
}

function getRelationIds(candidates) {
  for (const candidate of candidates) {
    const { value, paths = [] } = candidate || {};
    if (!Array.isArray(value) || value.length === 0) {
      continue;
    }

    const ids = value
      .map((entry) => {
        if (entry === null || entry === undefined || entry === '') {
          return '';
        }

        if (typeof entry !== 'object') {
          return String(entry);
        }

        const resolved = paths
          .map((path) => getValueAtPath(entry, path))
          .find((resolvedValue) => resolvedValue !== undefined && resolvedValue !== null && resolvedValue !== '');

        return resolved !== undefined && resolved !== null && resolved !== '' ? String(resolved) : '';
      })
      .filter(Boolean);

    if (ids.length > 0) {
      return [...new Set(ids)];
    }
  }

  return [];
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
    getFirstNumericValue([
      item?.classroom_ids?.length,
      item?.classrooms?.length,
      item?.teacher_classrooms?.length,
      item?.classroom_assignments?.length,
      item?.classroom_count,
      item?.classrooms_count,
      item?.assignment_counts?.classrooms,
    ]) || 0;
  const subjectCount =
    getFirstNumericValue([
      item?.subject_ids?.length,
      item?.subjects?.length,
      item?.teacher_subjects?.length,
      item?.subject_assignments?.length,
      item?.subject_count,
      item?.subjects_count,
      item?.assignment_counts?.subjects,
    ]) || 0;

  if (type === 'teacher') {
    const parts = [];
    if (classroomCount > 0) {
      parts.push(`${classroomCount} паралелки`);
    }
    if (subjectCount > 0) {
      parts.push(`${subjectCount} предмети`);
    }

    return parts.join(' · ');
  }

  return classroomCount > 0 ? `${classroomCount} паралелки` : '';
}

function normalizePeople(payload, key, type) {
  return getCollection(payload, key).map((item, index) => {
    const status = getStatusPresentation(item);
    const invitationStatus = String(item?.invitation_status || item?.invitation?.status || '');
    const normalizedInvitationStatus = invitationStatus.toLowerCase();
    const invitationAcceptedAt =
      item?.accepted_at ||
      item?.invitation_accepted_at ||
      item?.invitation?.accepted_at ||
      item?.invitation?.acceptedAt ||
      null;
    const hasInvitation =
      Boolean(invitationStatus) ||
      Boolean(
        item?.invitation_last_sent_at ||
          item?.invitation?.last_sent_at ||
          item?.invitation?.lastSentAt ||
          item?.invitation_expires_at ||
          item?.invitation?.expires_at ||
          item?.invitation?.expiresAt
      );
    const classroomIds = getRelationIds([
      { value: item?.classroom_ids, paths: ['id'] },
      { value: item?.classrooms, paths: ['id'] },
      { value: item?.teacher_classrooms, paths: ['classroom_id', 'classroom.id', 'id'] },
      { value: item?.classroom_assignments, paths: ['classroom_id', 'classroom.id', 'id'] },
      { value: item?.student_classrooms, paths: ['classroom_id', 'classroom.id', 'id'] },
    ]);
    const subjectIds = getRelationIds([
      { value: item?.subject_ids, paths: ['id'] },
      { value: item?.subjects, paths: ['id'] },
      { value: item?.teacher_subjects, paths: ['subject_id', 'subject.id', 'id'] },
      { value: item?.subject_assignments, paths: ['subject_id', 'subject.id', 'id'] },
    ]);

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
      invitationStatus,
      canResendInvitation:
        hasInvitation && !invitationAcceptedAt && !normalizedInvitationStatus.includes('accepted'),
      classroomIds,
      subjectIds,
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
    teacherCount: 0,
    studentCount: 0,
    classroomCount: 0,
    subjectCount: 0,
  };
}

function getScheduleSlotKey(dayOfWeek, periodNumber) {
  return `${dayOfWeek}-${periodNumber}`;
}

function normalizeScheduleSlots(payload) {
  const slots = Array.isArray(payload?.slots) ? payload.slots : [];

  return slots.map((slot) => ({
    id: slot?.id ? String(slot.id) : '',
    day_of_week: String(slot?.day_of_week || ''),
    period_number: Number(slot?.period_number || 0),
    subject_id: slot?.subject_id ? String(slot.subject_id) : '',
    teacher_id: slot?.teacher_id ? String(slot.teacher_id) : '',
    room_name: slot?.room_name || '',
    room_label: slot?.room_label || '',
    display_room_name: slot?.display_room_name || '',
    display_room_label: slot?.display_room_label || '',
  }));
}

const CREATE_ENTITY_FIELDS = {
  school: [
    {
      id: 'name',
      label: 'Име на училиште',
      placeholder: 'пр. ОУ Браќа Миладиновци',
      required: true,
      fullWidth: true,
    },
    {
      id: 'code',
      label: 'Код',
      placeholder: 'пр. OU-BM',
      required: false,
      pattern: '[A-Za-z]{2}-[A-Za-z0-9]{2,4}',
      title: 'Користи формат како OU-BM или OU-AB1S.',
      maxLength: 7,
      autoCapitalize: 'characters',
    },
    {
      id: 'city',
      label: 'Град',
      placeholder: 'пр. Скопје',
      required: false,
    },
    {
      id: 'active',
      label: 'Статус',
      type: 'select',
      required: true,
      options: [
        { value: 'true', label: 'Активно' },
        { value: 'false', label: 'Неактивно' },
      ],
    },
  ],
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

function getInitialCreateValues(type) {
  if (type === 'school') {
    return {
      active: 'true',
    };
  }

  return {};
}

const PERSON_EDIT_FIELDS = {
  teacher: [
    { id: 'email', label: 'Е-пошта', type: 'email', fullWidth: true },
    { id: 'first_name', label: 'Име' },
    { id: 'last_name', label: 'Презиме' },
    { id: 'title', label: 'Титула' },
  ],
  student: [
    { id: 'email', label: 'Е-пошта', type: 'email', fullWidth: true },
    { id: 'first_name', label: 'Име' },
    { id: 'last_name', label: 'Презиме' },
    { id: 'grade_level', label: 'Одделение' },
    { id: 'student_number', label: 'Ученички број' },
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
      getFirstNumericValue([
        item?.student_count,
        item?.students_count,
        item?.studentCount,
        item?.student_ids?.length,
        item?.students?.length,
        item?.classroom_users?.length,
        item?.student_memberships?.length,
        item?.classroom_memberships?.length,
        item?.membership_ids?.length,
        item?.membership_count,
        item?.memberships_count,
        item?.assignment_counts?.students,
      ]) || 0,
    teacherCount:
      getFirstNumericValue([
        item?.teacher_count,
        item?.teachers_count,
        item?.teacherCount,
        item?.teacher_ids?.length,
        item?.teachers?.length,
        item?.teacher_classrooms?.length,
        item?.classroom_assignments?.length,
        item?.assignment_counts?.teachers,
      ]) || 0,
    teacherIds: getRelationIds([
      { value: item?.teacher_ids, paths: ['id'] },
      { value: item?.teachers, paths: ['id'] },
      { value: item?.teacher_classrooms, paths: ['teacher_id', 'teacher.id', 'id'] },
      { value: item?.classroom_assignments, paths: ['teacher_id', 'teacher.id', 'id'] },
    ]),
    studentIds: getRelationIds([
      { value: item?.student_ids, paths: ['id'] },
      { value: item?.students, paths: ['id'] },
      { value: item?.classroom_users, paths: ['student_id', 'student.id', 'user_id', 'user.id', 'id'] },
      { value: item?.student_memberships, paths: ['student_id', 'student.id', 'user_id', 'user.id', 'id'] },
      { value: item?.classroom_memberships, paths: ['student_id', 'student.id', 'user_id', 'user.id', 'id'] },
      { value: item?.membership_ids, paths: ['id'] },
    ]),
  }));
}

function normalizeSubjects(payload) {
  return getCollection(payload, 'subjects').map((item, index) => ({
    id: item?.id ?? `subject-${index}`,
    name: item?.name || `Предмет ${index + 1}`,
    code: item?.code || '',
    topicCount:
      getFirstNumericValue([
        item?.topic_count,
        item?.topics_count,
        item?.topics?.length,
        item?.subject_topics?.length,
        item?.assignment_counts?.topics,
      ]) || 0,
    teacherCount:
      getFirstNumericValue([
        item?.teacher_count,
        item?.teachers_count,
        item?.teachers?.length,
        item?.teacher_ids?.length,
        item?.teacher_subjects?.length,
        item?.assignment_counts?.teachers,
      ]) || 0,
    classroomCount:
      getFirstNumericValue([
        item?.classroom_count,
        item?.classrooms_count,
        item?.classrooms?.length,
        item?.classroom_ids?.length,
        item?.classroom_assignments?.length,
        item?.assignment_counts?.classrooms,
      ]) || 0,
    teacherIds: getRelationIds([
      { value: item?.teacher_ids, paths: ['id'] },
      { value: item?.teachers, paths: ['id'] },
      { value: item?.teacher_subjects, paths: ['teacher_id', 'teacher.id', 'id'] },
    ]),
    classroomIds: getRelationIds([
      { value: item?.classroom_ids, paths: ['id'] },
      { value: item?.classrooms, paths: ['id'] },
      { value: item?.classroom_assignments, paths: ['classroom_id', 'classroom.id', 'id'] },
    ]),
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

function normalizeStudentDirectory(payload, options = {}) {
  const requestedPage = Number(options.page) > 0 ? Number(options.page) : 1;
  const requestedPerPage = Number(options.perPage) > 0 ? Number(options.perPage) : STUDENTS_SECTION_PER_PAGE;
  const fallbackTotal = getFirstNumericValue([options.total, options.fallbackTotal]);
  const hasPaginationMeta =
    getFirstNumericValue([
      payload?.meta?.current_page,
      payload?.meta?.page,
      payload?.current_page,
      payload?.page,
      payload?.meta?.total_pages,
      payload?.total_pages,
      payload?.meta?.per_page,
      payload?.per_page,
    ]) !== null;
  const items = normalizePeople(payload, 'students', 'student');

  if (!hasPaginationMeta) {
    const total = fallbackTotal || items.length;
    const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / requestedPerPage));
    const currentPage = Math.min(requestedPage, totalPages);
    const pagedItems =
      items.length > requestedPerPage
        ? items.slice((currentPage - 1) * requestedPerPage, currentPage * requestedPerPage)
        : items;

    return {
      items: pagedItems,
      page: currentPage,
      perPage: requestedPerPage,
      total,
      totalPages,
    };
  }

  const total =
    getFirstNumericValue([
      payload?.meta?.total,
      payload?.meta?.count,
      payload?.meta?.total_count,
      payload?.total,
      payload?.count,
      payload?.total_count,
      fallbackTotal,
    ]) || items.length;
  const perPage =
    getFirstNumericValue([
      payload?.meta?.per_page,
      payload?.meta?.limit,
      payload?.per_page,
      payload?.limit,
      requestedPerPage,
    ]) || requestedPerPage;
  const totalPages =
    getFirstNumericValue([payload?.meta?.total_pages, payload?.total_pages]) ||
    Math.max(1, Math.ceil(Math.max(total, 0) / perPage));
  const currentPage = Math.min(
    getFirstNumericValue([
      payload?.meta?.current_page,
      payload?.meta?.page,
      payload?.current_page,
      payload?.page,
      requestedPage,
    ]) || requestedPage,
    totalPages
  );

  return {
    items,
    page: currentPage,
    perPage,
    total,
    totalPages,
  };
}

function getStudentDirectoryParams(page, perPage = STUDENTS_SECTION_PER_PAGE) {
  const resolvedPage = Number(page) > 0 ? Number(page) : 1;
  return {
    limit: perPage,
    offset: (resolvedPage - 1) * perPage,
  };
}

function normalizeSinglePerson(item, type) {
  const key = type === 'teacher' ? 'teachers' : 'students';
  return normalizePeople({ [key]: item ? [item] : [] }, key, type)[0] || null;
}

function buildPersonEditValues(entityType, payload) {
  const item = payload || {};
  const teacherProfile = item?.teacher_profile || item?.teacherProfile || {};
  const studentProfile = item?.student_profile || item?.studentProfile || {};

  return {
    id: item?.id ? String(item.id) : '',
    email: item?.email || '',
    first_name: item?.first_name || item?.firstName || '',
    last_name: item?.last_name || item?.lastName || '',
    full_name:
      item?.full_name ||
      item?.fullName ||
      [item?.first_name || item?.firstName, item?.last_name || item?.lastName].filter(Boolean).join(' '),
    title: entityType === 'teacher' ? teacherProfile?.title || '' : '',
    grade_level: entityType === 'student' ? studentProfile?.grade_level || studentProfile?.gradeLevel || '' : '',
    student_number:
      entityType === 'student'
        ? studentProfile?.student_number || studentProfile?.studentNumber || ''
        : '',
  };
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
  const [activeTab, setActiveTab] = useState('overview');
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
  const [assignmentResending, setAssignmentResending] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [personEditValues, setPersonEditValues] = useState({});
  const [personEditLoading, setPersonEditLoading] = useState(false);
  const [personEditSaving, setPersonEditSaving] = useState(false);
  const [personEditError, setPersonEditError] = useState('');
  const [scheduleClassroomId, setScheduleClassroomId] = useState('');
  const [schedulePayload, setSchedulePayload] = useState(null);
  const [scheduleDraftSlots, setScheduleDraftSlots] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [flash, setFlash] = useState(null);
  const [dashboardData, setDashboardData] = useState(createEmptyDashboardData);
  const [studentDirectory, setStudentDirectory] = useState({
    items: [],
    page: 1,
    perPage: STUDENTS_SECTION_PER_PAGE,
    total: 0,
    totalPages: 1,
    loading: false,
    error: '',
  });

  const routeState = useMemo(() => getAdminRouteState(pathname, loggedIn), [pathname, loggedIn]);
  const route = routeState.name;

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

  const applyStudentDirectoryPayload = useCallback(
    (payload, options = {}) => {
      const nextDirectory = normalizeStudentDirectory(payload, {
        page: options.page ?? 1,
        perPage: STUDENTS_SECTION_PER_PAGE,
        fallbackTotal: options.fallbackTotal ?? 0,
      });

      setStudentDirectory((previous) => ({
        ...previous,
        ...nextDirectory,
        loading: false,
        error: '',
      }));

      return nextDirectory;
    },
    []
  );

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

    setUser(nextUser);
    setSchoolOptions(normalizedSchools);
    setSelectedSchoolId(activeSchool?.id ? String(activeSchool.id) : '');
    setSelectedSchoolName(activeSchool?.name || '');
    saveAdminSession({
      user: nextUser,
      school: activeSchool || null,
      clearSchool: !activeSchool?.id,
    });
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && !window.confirm('Дали сте сигурни дека сакате да се одјавите?')) {
      return;
    }

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
    setAssignmentResending(false);
    setAssignmentError('');
    setPersonEditValues({});
    setPersonEditError('');
    setPersonEditLoading(false);
    setPersonEditSaving(false);
    setScheduleClassroomId('');
    setSchedulePayload(null);
    setScheduleDraftSlots([]);
    setScheduleLoading(false);
    setScheduleSaving(false);
    setScheduleError('');
    setDashboardData(createEmptyDashboardData());
    setStudentDirectory({
      items: [],
      page: 1,
      perPage: STUDENTS_SECTION_PER_PAGE,
      total: 0,
      totalPages: 1,
      loading: false,
      error: '',
    });
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
    const teacherCount = getCount(teachersPayload, teachers, 'teachers');
    const studentCount = getCount(studentsPayload, students, 'students');
    const classroomCount = getCount(classroomsPayload, classrooms, 'classrooms');
    const subjectCount = getCount(subjectsPayload, subjects, 'subjects');
    const nextDashboardData = {
      stats: buildStats({
        teachers,
        students,
        classrooms,
        subjects,
        teacherCount,
        studentCount,
        classroomCount,
        subjectCount,
      }),
      schoolSummary,
      teachers,
      students,
      classrooms,
      subjects,
      teacherCount,
      studentCount,
      classroomCount,
      subjectCount,
    };

    setDashboardData(nextDashboardData);
    return nextDashboardData;
  };

  const refreshPeopleCollection = async (role) => {
    const [teachersPayload, studentsPayload, studentDirectoryPayload] = await Promise.all([
      role === 'teacher'
        ? adminApi.adminTeachers({ limit: 100 })
        : Promise.resolve({ teachers: dashboardData.teachers }),
      role === 'student'
        ? adminApi.adminStudents({ limit: 100 })
        : Promise.resolve({ students: dashboardData.students }),
      role === 'student'
        ? adminApi.adminStudents(getStudentDirectoryParams(studentDirectory.page))
        : Promise.resolve(null),
    ]);

    const teachers = normalizePeople(teachersPayload, 'teachers', 'teacher');
    const students = normalizePeople(studentsPayload, 'students', 'student');
    const nextDashboardData = {
      ...dashboardData,
      teachers,
      students,
      teacherCount: getCount(teachersPayload, teachers, 'teachers'),
      studentCount: getCount(studentsPayload, students, 'students'),
    };

    setDashboardData((previous) => ({
      ...previous,
      teachers,
      students,
      teacherCount: nextDashboardData.teacherCount,
      studentCount: nextDashboardData.studentCount,
      stats: buildStats({
        teachers,
        students,
        classrooms: previous.classrooms,
        subjects: previous.subjects,
        teacherCount: nextDashboardData.teacherCount,
        studentCount: nextDashboardData.studentCount,
        classroomCount: previous.classroomCount,
        subjectCount: previous.subjectCount,
      }),
    }));

    if (role === 'student') {
      applyStudentDirectoryPayload(studentDirectoryPayload || studentsPayload, {
        page: studentDirectory.page,
        fallbackTotal: nextDashboardData.studentCount,
      });
    }
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
      classroomCount: getCount(classroomsPayload, classrooms, 'classrooms'),
      subjectCount: getCount(subjectsPayload, subjects, 'subjects'),
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
        teacherCount: previous.teacherCount,
        studentCount: previous.studentCount,
        classroomCount: getCount(classroomsPayload, classrooms, 'classrooms'),
        subjectCount: getCount(subjectsPayload, subjects, 'subjects'),
      }),
    }));
  };

  const handleStudentPageChange = async (page) => {
    const nextPage = Number(page);
    if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage === studentDirectory.page) {
      return;
    }

    setStudentDirectory((previous) => ({
      ...previous,
      loading: true,
      error: '',
    }));

    try {
      const payload = await adminApi.adminStudents({
        ...getStudentDirectoryParams(nextPage),
      });
      applyStudentDirectoryPayload(payload, {
        page: nextPage,
        fallbackTotal: dashboardData.studentCount,
      });
    } catch (error) {
      setStudentDirectory((previous) => ({
        ...previous,
        loading: false,
        error: error.message || 'Не успеа вчитувањето на страницата со ученици.',
      }));
    }
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
      setAssignmentResending(false);
      setAssignmentError('');
      setPersonEditValues({});
      setPersonEditError('');
      setPersonEditLoading(false);
      setPersonEditSaving(false);
      setScheduleClassroomId('');
      setSchedulePayload(null);
      setScheduleDraftSlots([]);
      setScheduleLoading(false);
      setScheduleSaving(false);
      setScheduleError('');
      setDashboardData(createEmptyDashboardData());
      setStudentDirectory({
        items: [],
        page: 1,
        perPage: STUDENTS_SECTION_PER_PAGE,
        total: 0,
        totalPages: 1,
        loading: false,
        error: '',
      });
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
    if (!loggedIn || !['dashboard', 'schedule'].includes(route) || !selectedSchoolId) {
      return;
    }

    let isMounted = true;
    setDashboardLoading(true);
    setDashboardError('');
    setStudentDirectory((previous) => ({
      ...previous,
      loading: true,
      error: '',
    }));

    Promise.allSettled([
      adminApi.adminSchoolDetails(selectedSchoolId),
      adminApi.adminTeachers({ limit: 100 }),
      adminApi.adminStudents({ limit: 100 }),
      adminApi.adminStudents(getStudentDirectoryParams(1)),
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
          studentDirectoryResult,
          classroomsResult,
          subjectsResult,
        ] = results;

        const schoolPayload =
          schoolDetailResult.status === 'fulfilled' ? schoolDetailResult.value : null;
        const teachersPayload =
          teachersResult.status === 'fulfilled' ? teachersResult.value : { teachers: [] };
        const studentsPayload =
          studentsResult.status === 'fulfilled' ? studentsResult.value : { students: [] };
        const studentDirectoryPayload =
          studentDirectoryResult.status === 'fulfilled' ? studentDirectoryResult.value : studentsPayload;
        const classroomsPayload =
          classroomsResult.status === 'fulfilled' ? classroomsResult.value : { classrooms: [] };
        const subjectsPayload =
          subjectsResult.status === 'fulfilled' ? subjectsResult.value : { subjects: [] };

        const nextDashboardData = applyDashboardPayload({
          schoolPayload,
          teachersPayload,
          studentsPayload,
          classroomsPayload,
          subjectsPayload,
          fallbackSchoolName: selectedSchoolName,
        });
        applyStudentDirectoryPayload(studentDirectoryPayload, {
          page: 1,
          fallbackTotal: nextDashboardData.studentCount,
        });

        const rejectedResults = results.filter((result) => result.status === 'rejected');
        if (rejectedResults.length > 0) {
          setDashboardError('Дел од админ податоците не се вчитаа целосно. Прикажан е достапниот преглед.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setDashboardError('Не може да се вчита админ контролната табла.');
          setStudentDirectory((previous) => ({
            ...previous,
            loading: false,
            error: 'Не успеа вчитувањето на учениците.',
          }));
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
  }, [applyStudentDirectoryPayload, loggedIn, route, selectedSchoolId, selectedSchoolName]);

  useEffect(() => {
    if (route !== 'schedule') {
      return;
    }

    if (scheduleClassroomId) {
      return;
    }

    if (dashboardData.classrooms.length === 0) {
      return;
    }

    setScheduleClassroomId(String(dashboardData.classrooms[0].id));
  }, [dashboardData.classrooms, route, scheduleClassroomId]);

  useEffect(() => {
    if (!loggedIn || route !== 'schedule' || !selectedSchoolId || !scheduleClassroomId) {
      return;
    }

    let isMounted = true;
    setScheduleLoading(true);
    setScheduleError('');

    adminApi
      .adminClassroomSchedule(scheduleClassroomId)
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setSchedulePayload(payload);
        setScheduleDraftSlots(normalizeScheduleSlots(payload));
      })
      .catch((error) => {
        if (isMounted) {
          setSchedulePayload(null);
          setScheduleDraftSlots([]);
          setScheduleError(error.message || 'Не успеа вчитувањето на распоредот.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setScheduleLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loggedIn, route, scheduleClassroomId, selectedSchoolId]);

  useEffect(() => {
    if (
      !loggedIn ||
      !selectedSchoolId ||
      !['teacher-edit', 'student-edit'].includes(route) ||
      !routeState.entityId
    ) {
      return;
    }

    let isMounted = true;
    setPersonEditLoading(true);
    setPersonEditError('');

    const request =
      route === 'teacher-edit'
        ? adminApi.adminTeacher(routeState.entityId)
        : adminApi.adminStudent(routeState.entityId);

    request
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setPersonEditValues(buildPersonEditValues(routeState.entityType, payload));
      })
      .catch((error) => {
        if (isMounted) {
          setPersonEditError(error.message || 'Не успеа вчитувањето на профилот.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setPersonEditLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loggedIn, route, routeState.entityId, routeState.entityType, selectedSchoolId]);

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

  const handleSubmitPersonEdit = async () => {
    if (!routeState.entityId || !['teacher', 'student'].includes(routeState.entityType)) {
      return;
    }

    setPersonEditError('');
    setPersonEditSaving(true);

    try {
      if (routeState.entityType === 'teacher') {
        await adminApi.updateAdminTeacher(routeState.entityId, {
          email: personEditValues.email?.trim(),
          first_name: personEditValues.first_name?.trim(),
          last_name: personEditValues.last_name?.trim(),
          teacher_profile: {
            title: personEditValues.title?.trim() || undefined,
          },
        });
      } else {
        await adminApi.updateAdminStudent(routeState.entityId, {
          email: personEditValues.email?.trim(),
          first_name: personEditValues.first_name?.trim(),
          last_name: personEditValues.last_name?.trim(),
          student_profile: {
            grade_level: personEditValues.grade_level?.trim() || undefined,
            student_number: personEditValues.student_number?.trim() || undefined,
          },
        });
      }

      showFlash(
        routeState.entityType === 'teacher' ? 'Наставникот е снимен.' : 'Ученикот е снимен.',
        'success'
      );
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      setPersonEditError(error.message || 'Снимањето не успеа.');
    } finally {
      setPersonEditSaving(false);
    }
  };

  const handleSelectSchool = (schoolId) => {
    setSelectedSchoolId(schoolId);
    setScheduleClassroomId('');
    setSchedulePayload(null);
    setScheduleDraftSlots([]);
    setScheduleError('');
    setStudentDirectory((previous) => ({
      ...previous,
      items: [],
      page: 1,
      total: 0,
      totalPages: 1,
      loading: false,
      error: '',
    }));
    const selectedSchool = schoolOptions.find((option) => option.id === schoolId);
    if (selectedSchool) {
      setSelectedSchoolName(selectedSchool.name);
      saveAdminSession({ school: selectedSchool });
    }
  };

  const handleChangeTab = (tab) => {
    setActiveTab(tab);

    if (route === 'schedule') {
      navigate('/admin/dashboard');
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

  const handleOpenSchedulePage = () => {
    setCreateMenuOpen(false);
    setActiveTab('setup');
    setScheduleError('');
    navigate('/admin/schedule');
  };

  const handleBackFromSchedule = () => {
    setActiveTab('setup');
    setScheduleError('');
    navigate('/admin/dashboard');
  };

  const handleOpenCreateModal = (type) => {
    setCreateMenuOpen(false);
    setCreateModal(type);
    setCreateValues(getInitialCreateValues(type));
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

  const handlePersonEditFieldChange = (fieldId, value) => {
    setPersonEditValues((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  };

  const handleOpenPersonEditPage = (entityType, entity) => {
    const entityId = String(entity?.id || '');
    if (!entityId) {
      return;
    }

    setAssignmentModal(null);
    setAssignmentValues({ teacherIds: [], studentIds: [], classroomIds: [], subjectIds: [] });
    setAssignmentError('');
    navigate(`/admin/${entityType === 'teacher' ? 'teachers' : 'students'}/${entityId}/edit`);
  };

  const handleResendAssignmentInvitation = async (entityType, entity) => {
    const entityId = String(entity?.id || '');
    if (!entityId || !['teacher', 'student'].includes(entityType)) {
      return;
    }

    setAssignmentError('');
    setAssignmentResending(true);

    try {
      const payload =
        entityType === 'teacher'
          ? await adminApi.resendAdminTeacherInvitation(entityId)
          : await adminApi.resendAdminStudentInvitation(entityId);
      const normalizedDetail = normalizeSinglePerson(payload, entityType);

      if (normalizedDetail) {
        setAssignmentModal((previous) =>
          previous && previous.type === entityType && String(previous.entity?.id) === entityId
            ? {
                ...previous,
                entity: {
                  ...previous.entity,
                  ...normalizedDetail,
                },
              }
            : previous
        );
      }

      await refreshPeopleCollection(entityType);
      showFlash(
        entityType === 'teacher'
          ? 'Поканата за наставник е испратена повторно.'
          : 'Поканата за ученик е испратена повторно.',
        'success'
      );
    } catch (error) {
      setAssignmentError(error.message || 'Повторното испраќање на поканата не успеа.');
    } finally {
      setAssignmentResending(false);
    }
  };

  const handleOpenAssignmentModal = async (type, entity) => {
    const entityId = String(entity?.id || '');
    if (!entityId) {
      return;
    }

    let resolvedEntity =
      (type === 'teacher'
        ? dashboardData.teachers.find((item) => String(item.id) === entityId)
        : type === 'student'
          ? dashboardData.students.find((item) => String(item.id) === entityId)
          : type === 'classroom'
            ? dashboardData.classrooms.find((item) => String(item.id) === entityId)
            : dashboardData.subjects.find((item) => String(item.id) === entityId)) || entity;

    if (type === 'teacher' || type === 'student') {
      try {
        const payload =
          type === 'teacher'
            ? await adminApi.adminTeacher(entityId)
            : await adminApi.adminStudent(entityId);
        const normalizedDetail = normalizeSinglePerson(payload, type);
        if (normalizedDetail) {
          resolvedEntity = {
            ...resolvedEntity,
            ...normalizedDetail,
          };
        }
      } catch (error) {
        showFlash(error.message || 'Не успеа вчитувањето на деталите за корисникот.', 'error');
      }
    }

    const teacherIds =
      type === 'classroom' || type === 'subject'
        ? resolvedEntity?.teacherIds?.map((id) => String(id)) ||
          dashboardData.teachers
            .filter((teacher) =>
              type === 'classroom'
                ? teacher.classroomIds.includes(entityId)
                : teacher.subjectIds.includes(entityId)
            )
            .map((teacher) => String(teacher.id))
        : [];
    const studentIds =
      type === 'classroom'
        ? resolvedEntity?.studentIds?.map((id) => String(id)) ||
          dashboardData.students
            .filter((student) => student.classroomIds.includes(entityId))
            .map((student) => String(student.id))
        : [];
    const classroomIds =
      type === 'teacher' || type === 'student'
        ? (resolvedEntity?.classroomIds || []).map((id) => String(id))
        : [];
    const subjectIds = type === 'teacher' ? (resolvedEntity?.subjectIds || []).map((id) => String(id)) : [];

    setAssignmentModal({ type, entity: resolvedEntity });
    setAssignmentValues({ teacherIds, studentIds, classroomIds, subjectIds });
    setAssignmentResending(false);
    setAssignmentError('');
  };

  const handleCloseAssignmentModal = () => {
    if (assignmentLoading || assignmentResending) {
      return;
    }

    setAssignmentModal(null);
    setAssignmentValues({ teacherIds: [], studentIds: [], classroomIds: [], subjectIds: [] });
    setAssignmentResending(false);
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

  const handleChangeScheduleSlot = (dayOfWeek, periodNumber, field, value) => {
    const slotKey = getScheduleSlotKey(dayOfWeek, periodNumber);
    setScheduleError('');

    setScheduleDraftSlots((previous) => {
      const nextSlots = [...previous];
      const slotIndex = nextSlots.findIndex(
        (slot) => getScheduleSlotKey(slot.day_of_week, slot.period_number) === slotKey
      );
      const nextValue = String(value || '');

      if (slotIndex === -1) {
        nextSlots.push({
          id: '',
          day_of_week: dayOfWeek,
          period_number: periodNumber,
          subject_id: field === 'subject_id' ? nextValue : '',
          teacher_id: field === 'teacher_id' ? nextValue : '',
          room_name: field === 'room_name' ? nextValue : '',
          room_label: field === 'room_label' ? nextValue : '',
          display_room_name: '',
          display_room_label: '',
        });
      } else {
        nextSlots[slotIndex] = {
          ...nextSlots[slotIndex],
          [field]: nextValue,
        };
      }

      return nextSlots;
    });
  };

  const handleClearScheduleSlot = (dayOfWeek, periodNumber) => {
    setScheduleError('');
    setScheduleDraftSlots((previous) =>
      previous.filter(
        (slot) => getScheduleSlotKey(slot.day_of_week, slot.period_number) !== getScheduleSlotKey(dayOfWeek, periodNumber)
      )
    );
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
      if (createModal === 'school') {
        const createdSchool = await adminApi.createAdminSchool({
          name: createValues.name?.trim(),
          code: createValues.code?.trim() || undefined,
          city: createValues.city?.trim() || undefined,
          active: createValues.active !== 'false',
        });
        const normalizedSchool = mapSchoolsToOptions([createdSchool])[0];

        setSchoolOptions((previous) => {
          const nextItems = [...previous.filter((item) => item.id !== normalizedSchool.id), normalizedSchool];
          return nextItems.sort((left, right) => left.name.localeCompare(right.name, 'mk'));
        });
        setSelectedSchoolId(normalizedSchool.id);
        setSelectedSchoolName(normalizedSchool.name);
        saveAdminSession({ school: normalizedSchool });
        showFlash('Училиштето е креирано.', 'success');
      }

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

  const handleSubmitSchedule = async () => {
    if (!scheduleClassroomId) {
      return;
    }

    const incompleteSlot = scheduleDraftSlots.find((slot) => {
      const hasAnyValue = Boolean(
        slot.subject_id || slot.teacher_id || String(slot.room_name || '').trim() || String(slot.room_label || '').trim()
      );
      return hasAnyValue && (!slot.subject_id || !slot.teacher_id);
    });

    if (incompleteSlot) {
      setScheduleError('Секој пополнет термин мора да има и предмет и наставник.');
      return;
    }

    setScheduleError('');
    setScheduleSaving(true);

    try {
      const payload = await adminApi.updateAdminClassroomSchedule(scheduleClassroomId, {
        slots: scheduleDraftSlots
          .filter(
            (slot) =>
              slot.subject_id &&
              slot.teacher_id
          )
          .map((slot) => ({
            day_of_week: slot.day_of_week,
            period_number: Number(slot.period_number),
            subject_id: Number(slot.subject_id),
            teacher_id: Number(slot.teacher_id),
            room_name: slot.room_name?.trim() || undefined,
            room_label: slot.room_label?.trim() || undefined,
          })),
      });

      setSchedulePayload(payload);
      setScheduleDraftSlots(normalizeScheduleSlots(payload));
      showFlash('Распоредот е снимен.', 'success');
    } catch (error) {
      setScheduleError(error.message || 'Снимањето на распоредот не успеа.');
    } finally {
      setScheduleSaving(false);
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
        studentDirectoryPayload,
        classroomsPayload,
        subjectsPayload,
      ] = await Promise.all([
        adminApi.adminSchoolDetails(selectedSchoolId),
        adminApi.adminTeachers({ limit: 100 }),
        adminApi.adminStudents({ limit: 100 }),
        adminApi.adminStudents(getStudentDirectoryParams(studentDirectory.page)),
        adminApi.adminClassrooms({ limit: 100 }),
        adminApi.adminSubjects({ limit: 100 }),
      ]);

      const nextDashboardData = applyDashboardPayload({
        schoolPayload,
        teachersPayload,
        studentsPayload,
        classroomsPayload,
        subjectsPayload,
        fallbackSchoolName: selectedSchoolName,
      });
      applyStudentDirectoryPayload(studentDirectoryPayload, {
        page: studentDirectory.page,
        fallbackTotal: nextDashboardData.studentCount,
      });

      setAssignmentModal(null);
      setAssignmentValues({ teacherIds: [], studentIds: [], classroomIds: [], subjectIds: [] });
      setAssignmentResending(false);
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
      {['teacher-edit', 'student-edit'].includes(route) ? (
        <AdminPersonEditPage
          entityType={routeState.entityType}
          values={personEditValues}
          fields={PERSON_EDIT_FIELDS[routeState.entityType] || []}
          loading={personEditLoading}
          saving={personEditSaving}
          error={personEditError}
          theme={theme}
          paletteStyle={paletteStyle}
          schoolName={selectedSchoolName}
          onChange={handlePersonEditFieldChange}
          onBack={() => navigate('/admin/dashboard')}
          onSubmit={() => void handleSubmitPersonEdit()}
        />
      ) : (
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
          activeTab={route === 'schedule' ? 'setup' : activeTab}
          onChangeTab={handleChangeTab}
          onOpenCreateSchool={() => handleOpenCreateModal('school')}
          createMenuOpen={createMenuOpen}
          onToggleCreateMenu={handleOpenCreateMenu}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenSchedulePage={handleOpenSchedulePage}
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
          teacherCount={dashboardData.teacherCount}
          studentCount={dashboardData.studentCount}
          classroomCount={dashboardData.classroomCount}
          subjectCount={dashboardData.subjectCount}
          studentDirectory={studentDirectory}
          onChangeStudentPage={(page) => void handleStudentPageChange(page)}
          classrooms={dashboardData.classrooms}
          subjects={dashboardData.subjects}
          showSchedulePage={route === 'schedule'}
          schedulePage={
            <AdminSchedulePage
              classrooms={dashboardData.classrooms}
              teacherRoster={dashboardData.teachers}
              selectedClassroomId={scheduleClassroomId}
              onSelectClassroom={(value) => setScheduleClassroomId(String(value || ''))}
              schedulePayload={schedulePayload}
              draftSlots={scheduleDraftSlots}
              loading={scheduleLoading}
              saving={scheduleSaving}
              error={scheduleError}
              onChangeSlot={handleChangeScheduleSlot}
              onClearSlot={handleClearScheduleSlot}
              onSave={() => void handleSubmitSchedule()}
              onBack={handleBackFromSchedule}
            />
          }
          loading={dashboardLoading}
          loadError={dashboardError}
        />
      )}
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
          onEditEntity={handleOpenPersonEditPage}
          onResendInvitation={(entityType, entity) =>
            void handleResendAssignmentInvitation(entityType, entity)
          }
          loading={assignmentLoading}
          resendLoading={assignmentResending}
          error={assignmentError}
          theme={theme}
          paletteStyle={paletteStyle}
        />
      ) : null}
    </>
  );
}

export default AdminApp;
