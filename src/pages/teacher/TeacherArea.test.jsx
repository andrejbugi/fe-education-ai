import { render, waitFor } from '@testing-library/react';
import TeacherArea from './TeacherArea';
import { api } from '../../services/apiClient';

jest.mock('../../discussions/featureFlags', () => ({
  isDiscussionFeatureEnabled: () => false,
}));

jest.mock('../../services/apiClient', () => ({
  api: {
    me: jest.fn(),
    teacherDashboard: jest.fn(),
    teacherClassrooms: jest.fn(),
    teacherClassroomDetails: jest.fn(),
    teacherSubjects: jest.fn(),
    teacherStudentDetails: jest.fn(),
    teacherSubmissionDetails: jest.fn(),
    teacherHomerooms: jest.fn(),
    announcements: jest.fn(),
    assignments: jest.fn(),
    assignmentDetails: jest.fn(),
    classroomAttendance: jest.fn(),
    classroomPerformanceOverview: jest.fn(),
    schoolDetails: jest.fn(),
    publishAssignment: jest.fn(),
    updateAssignment: jest.fn(),
    createAssignment: jest.fn(),
    createAssignmentStep: jest.fn(),
    updateAssignmentStep: jest.fn(),
    createAssignmentResource: jest.fn(),
    createAnnouncement: jest.fn(),
    publishAnnouncement: jest.fn(),
    archiveAnnouncement: jest.fn(),
    createSubmissionGrade: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.me.mockResolvedValue({
    user: {
      id: 1,
      full_name: 'Наставник Тест',
      email: 'teacher@example.com',
    },
  });
  api.teacherDashboard.mockResolvedValue({
    teacher: { full_name: 'Наставник Тест' },
    review_queue: [],
    upcoming_calendar_events: [],
    announcement_feed: [],
    classroom_count: 0,
    active_assignments: 0,
  });
  api.teacherClassrooms.mockResolvedValue({ classrooms: [] });
  api.teacherClassroomDetails.mockResolvedValue(null);
  api.teacherSubjects.mockResolvedValue([]);
  api.teacherStudentDetails.mockResolvedValue(null);
  api.teacherSubmissionDetails.mockResolvedValue(null);
  api.teacherHomerooms.mockResolvedValue([]);
  api.announcements.mockResolvedValue({ announcements: [] });
  api.assignments.mockResolvedValue([]);
  api.assignmentDetails.mockResolvedValue(null);
  api.classroomAttendance.mockResolvedValue([]);
  api.classroomPerformanceOverview.mockResolvedValue(null);
  api.schoolDetails.mockResolvedValue(null);
});

test('teacher dashboard loads only dashboard essentials on first mount', async () => {
  window.history.replaceState({}, '', '/teacher');

  render(
    <TeacherArea
      theme="light"
      onToggleTheme={jest.fn()}
      onLogout={jest.fn()}
      onNotify={jest.fn()}
      school="ОУ Браќа Миладиновци"
      schoolId="1"
    />
  );

  await waitFor(() => {
    expect(api.me).toHaveBeenCalledTimes(1);
    expect(api.teacherDashboard).toHaveBeenCalledTimes(1);
    expect(api.teacherClassrooms).toHaveBeenCalledTimes(1);
  });

  expect(api.schoolDetails).not.toHaveBeenCalled();
  expect(api.teacherHomerooms).not.toHaveBeenCalled();
  expect(api.announcements).not.toHaveBeenCalled();
  expect(api.teacherSubjects).not.toHaveBeenCalled();
  expect(api.assignments).not.toHaveBeenCalled();
  expect(api.teacherClassroomDetails).not.toHaveBeenCalled();
  expect(api.classroomAttendance).not.toHaveBeenCalled();
  expect(api.classroomPerformanceOverview).not.toHaveBeenCalled();
});

test('teacher classes page loads classroom details without attendance and reports', async () => {
  window.history.replaceState({}, '', '/teacher/classes');
  api.teacherClassrooms.mockResolvedValue({
    classrooms: [{ id: 4, name: 'VII-1', grade_level: '7', academic_year: '2025/26' }],
  });
  api.teacherClassroomDetails.mockResolvedValue({
    id: 4,
    name: 'VII-1',
    grade_level: '7',
    academic_year: '2025/26',
    students: [],
    subjects: [],
    active_assignments: [],
  });

  render(
    <TeacherArea
      theme="light"
      onToggleTheme={jest.fn()}
      onLogout={jest.fn()}
      onNotify={jest.fn()}
      school="ОУ Браќа Миладиновци"
      schoolId="1"
    />
  );

  await waitFor(() => {
    expect(api.teacherClassrooms).toHaveBeenCalledTimes(1);
    expect(api.teacherClassroomDetails).toHaveBeenCalledTimes(1);
  });

  expect(api.classroomAttendance).not.toHaveBeenCalled();
  expect(api.classroomPerformanceOverview).not.toHaveBeenCalled();
});

test('teacher assignments page does not preload roster or student detail data for assignment details', async () => {
  window.history.replaceState({}, '', '/teacher/assignments');
  api.assignments.mockResolvedValue([
    {
      id: 10,
      title: 'Домашна',
      assignment_type: 'homework',
      status: 'published',
      classroom: { id: 4, name: 'VII-1' },
      subject: { id: 1, name: 'Математика' },
      submission_count: 0,
    },
  ]);
  api.assignmentDetails.mockResolvedValue({
    id: 10,
    title: 'Домашна',
    assignment_type: 'homework',
    status: 'published',
    classroom: { id: 4, name: 'VII-1' },
    subject: { id: 1, name: 'Математика' },
    submission_count: 0,
  });
  api.teacherClassroomDetails.mockResolvedValue({
    id: 4,
    name: 'VII-1',
    grade_level: '7',
    academic_year: '2025/26',
    students: [{ id: 26, full_name: 'Марија Стојанова', email: 'maria@test.mk' }],
    subjects: [],
    active_assignments: [],
  });

  render(
    <TeacherArea
      theme="light"
      onToggleTheme={jest.fn()}
      onLogout={jest.fn()}
      onNotify={jest.fn()}
      school="ОУ Браќа Миладиновци"
      schoolId="1"
    />
  );

  await waitFor(() => {
    expect(api.assignments).toHaveBeenCalledTimes(1);
    expect(api.assignmentDetails).toHaveBeenCalledTimes(1);
  });

  expect(api.teacherClassroomDetails).not.toHaveBeenCalled();
  expect(api.teacherStudentDetails).not.toHaveBeenCalled();
});

test('teacher grades page builds a classroom-style matrix from student submissions', async () => {
  window.history.replaceState({}, '', '/teacher/grades');
  api.teacherClassrooms.mockResolvedValue({
    classrooms: [{ id: 4, name: 'VII-1', grade_level: '7', academic_year: '2025/26' }],
  });
  api.assignments.mockResolvedValue([
    {
      id: 10,
      title: 'Домашна',
      assignment_type: 'homework',
      status: 'published',
      due_at: '2026-03-20T00:00:00.000Z',
      max_points: 10,
      classroom: { id: 4, name: 'VII-1' },
      subject: { id: 1, name: 'Математика' },
      submission_count: 1,
    },
  ]);
  api.assignmentDetails.mockResolvedValue({
    id: 10,
    title: 'Домашна',
    assignment_type: 'homework',
    status: 'published',
    due_at: '2026-03-20T00:00:00.000Z',
    max_points: 10,
    classroom: { id: 4, name: 'VII-1' },
    subject: { id: 1, name: 'Математика' },
    submission_count: 1,
  });
  api.teacherClassroomDetails.mockResolvedValue({
    id: 4,
    name: 'VII-1',
    grade_level: '7',
    academic_year: '2025/26',
    students: [
      {
        id: 26,
        full_name: 'Марија Стојанова',
        email: 'maria@test.mk',
        average_grade: '9.5',
        submission_rate: 100,
      },
    ],
    subjects: [],
    active_assignments: [],
  });
  api.teacherStudentDetails.mockResolvedValue({
    student: {
      id: 26,
      full_name: 'Марија Стојанова',
      email: 'maria@test.mk',
    },
    classrooms: [{ id: 4, name: 'VII-1' }],
    subjects: [{ id: 1, name: 'Математика', current_grade: '9.5', missing_assignments: 0 }],
    recent_submissions: [
      {
        id: 501,
        submission_id: 501,
        assignment_id: 10,
        assignment_title: 'Домашна',
        classroom_id: 4,
        classroom_name: 'VII-1',
        status: 'reviewed',
        submitted_at: '2026-03-18T08:15:00.000Z',
        total_score: '9',
        feedback: 'Одлично.',
      },
    ],
  });

  render(
    <TeacherArea
      theme="light"
      onToggleTheme={jest.fn()}
      onLogout={jest.fn()}
      onNotify={jest.fn()}
      school="ОУ Браќа Миладиновци"
      schoolId="1"
    />
  );

  await waitFor(() => {
    expect(api.teacherStudentDetails).toHaveBeenCalledWith('26');
  });

  await waitFor(() => {
    expect(api.assignmentDetails).toHaveBeenCalledWith('10');
  });

  await waitFor(() => {
    expect(document.body).toHaveTextContent('Просек на паралелка');
    expect(document.body).toHaveTextContent('9/10');
  });
});
