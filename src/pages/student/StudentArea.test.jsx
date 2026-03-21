import { render, waitFor } from '@testing-library/react';
import StudentArea from './StudentArea';
import { api } from '../../services/apiClient';

jest.mock('../../services/apiClient', () => ({
  STORAGE_KEYS: {
    theme: 'student-app-theme',
  },
  api: {
    me: jest.fn(),
    studentDashboard: jest.fn(),
    studentAssignments: jest.fn(),
    notifications: jest.fn(),
    announcements: jest.fn(),
    studentPerformance: jest.fn(),
    studentDailyQuiz: jest.fn(),
    studentLearningGames: jest.fn(),
    studentAttendance: jest.fn(),
    studentAssignmentDetails: jest.fn(),
    announcementDetails: jest.fn(),
    answerStudentDailyQuiz: jest.fn(),
    markNotificationRead: jest.fn(),
    aiSessions: jest.fn(),
    createAiSession: jest.fn(),
    createAiMessage: jest.fn(),
    updateSubmission: jest.fn(),
    createAssignmentSubmission: jest.fn(),
    submitSubmission: jest.fn(),
  },
}));

const baseProps = {
  theme: 'light',
  onToggleTheme: jest.fn(),
  onLogout: jest.fn(),
  onNotify: jest.fn(),
};

function mockSharedStudentData() {
  api.me.mockResolvedValue({
    user: {
      id: 26,
      full_name: 'Марија Стојанова',
      roles: ['student'],
      classroom_name: '7-A',
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци' }],
  });
  api.studentDashboard.mockResolvedValue({
    student: {
      classroom_name: '7-A',
    },
    deadlines: [],
    homework: [],
    recent_activity: [],
    notifications_unread: 0,
  });
  api.studentAssignments.mockResolvedValue({ assignments: [] });
  api.notifications.mockResolvedValue({ notifications: [] });
  api.announcements.mockResolvedValue({ announcements: [] });
  api.studentPerformance.mockResolvedValue({});
  api.studentDailyQuiz.mockResolvedValue({
    available_now: true,
    already_answered: false,
    question: null,
  });
  api.studentLearningGames.mockResolvedValue({
    available_now: true,
    available_from: '00:00',
    available_until: '23:59',
    games: [],
  });
  api.studentAttendance.mockResolvedValue({ attendance_records: [] });
  api.studentAssignmentDetails.mockResolvedValue(null);
  api.announcementDetails.mockResolvedValue(null);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSharedStudentData();
});

test('daily quiz route avoids dashboard and performance bootstrap requests', async () => {
  window.history.replaceState({}, '', '/daily-quiz');

  render(<StudentArea {...baseProps} />);

  await waitFor(() => {
    expect(api.me).toHaveBeenCalledTimes(1);
    expect(api.studentDailyQuiz).toHaveBeenCalledTimes(1);
  });

  expect(api.studentDashboard).not.toHaveBeenCalled();
  expect(api.studentAssignments).not.toHaveBeenCalled();
  expect(api.notifications).not.toHaveBeenCalled();
  expect(api.announcements).not.toHaveBeenCalled();
  expect(api.studentPerformance).not.toHaveBeenCalled();
  expect(api.studentLearningGames).not.toHaveBeenCalled();
});

test('learning games route avoids dashboard and performance bootstrap requests', async () => {
  window.history.replaceState({}, '', '/learning-games');

  render(<StudentArea {...baseProps} />);

  await waitFor(() => {
    expect(api.me).toHaveBeenCalledTimes(1);
    expect(api.studentLearningGames).toHaveBeenCalledTimes(1);
  });

  expect(api.studentDashboard).not.toHaveBeenCalled();
  expect(api.studentAssignments).not.toHaveBeenCalled();
  expect(api.notifications).not.toHaveBeenCalled();
  expect(api.announcements).not.toHaveBeenCalled();
  expect(api.studentPerformance).not.toHaveBeenCalled();
  expect(api.studentDailyQuiz).not.toHaveBeenCalled();
});

test('dashboard route loads dashboard data without the extra performance read', async () => {
  window.history.replaceState({}, '', '/dashboard');

  render(<StudentArea {...baseProps} />);

  await waitFor(() => {
    expect(api.me).toHaveBeenCalledTimes(1);
    expect(api.studentDashboard).toHaveBeenCalledTimes(1);
    expect(api.studentAssignments).toHaveBeenCalledTimes(1);
    expect(api.notifications).toHaveBeenCalledTimes(1);
    expect(api.announcements).toHaveBeenCalledTimes(1);
    expect(api.studentDailyQuiz).toHaveBeenCalledTimes(1);
    expect(api.studentLearningGames).toHaveBeenCalledTimes(1);
  });

  expect(api.studentPerformance).not.toHaveBeenCalled();
  expect(api.studentAttendance).not.toHaveBeenCalled();
});
