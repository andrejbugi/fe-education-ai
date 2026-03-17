import { render, screen } from '@testing-library/react';
import TaskDetailsPage from './TaskDetailsPage';

function buildDiscussionService() {
  return {
    mode: 'mock',
    resolveAssignmentSpace: jest.fn().mockResolvedValue({
      id: 'space-1',
      title: 'Дискусија за задачата',
      visibility: 'students_and_teachers',
      subjectName: 'Математика',
      classroomName: '7-A',
    }),
    listThreads: jest.fn().mockResolvedValue([
      {
        id: 'thread-1',
        title: 'Прашања за задачата',
        body: 'Кратка тема',
        status: 'active',
        pinned: false,
        locked: false,
        postsCount: 1,
        lastPostAt: '2026-03-17T18:10:00.000Z',
        creator: {
          id: 'teacher-1',
          fullName: 'Марија Стојанова',
          role: 'teacher',
        },
      },
    ]),
    getThread: jest.fn().mockResolvedValue({
      id: 'thread-1',
      title: 'Прашања за задачата',
      body: 'Кратка тема',
      status: 'active',
      pinned: false,
      locked: false,
      postsCount: 1,
      lastPostAt: '2026-03-17T18:10:00.000Z',
      createdAt: '2026-03-17T18:00:00.000Z',
      creator: {
        id: 'teacher-1',
        fullName: 'Марија Стојанова',
        role: 'teacher',
      },
    }),
    listPosts: jest.fn().mockResolvedValue([
      {
        id: 'post-1',
        discussionThreadId: 'thread-1',
        author: {
          id: 'teacher-1',
          fullName: 'Марија Стојанова',
          role: 'teacher',
        },
        parentPostId: '',
        body: 'Појаснување од наставникот.',
        status: 'visible',
        createdAt: '2026-03-17T18:10:00.000Z',
        updatedAt: '2026-03-17T18:10:00.000Z',
        repliesCount: 0,
        isHidden: false,
        isDeleted: false,
      },
    ]),
    createThread: jest.fn(),
    createPost: jest.fn(),
    lockThread: jest.fn(),
    unlockThread: jest.fn(),
    pinThread: jest.fn(),
    unpinThread: jest.fn(),
    archiveThread: jest.fn(),
    hidePost: jest.fn(),
    unhidePost: jest.fn(),
  };
}

function buildProps(overrides = {}) {
  return {
    theme: 'light',
    onToggleTheme: jest.fn(),
    onNavigate: jest.fn(),
    onLogout: jest.fn(),
    profile: {
      fullName: 'Андреј Костов',
      initials: 'АК',
      school: 'ОУ Кочо Рацин',
      studentId: 'student-7',
    },
    task: {
      id: '7',
      subject: 'Математика',
      title: 'Равенки',
      description: 'Реши ја задачата.',
      type: 'домашна',
      difficulty: 'Средно',
      dueText: 'Чет 19:00',
      instructions: 'Следи ги чекорите.',
      contentBlocks: [],
      resources: [],
      steps: [],
      status: 'in-progress',
    },
    onStartTask: jest.fn(),
    onBack: jest.fn(),
    ...overrides,
  };
}

describe('TaskDetailsPage discussions', () => {
  test('hides the discussion section when the feature is disabled', () => {
    render(<TaskDetailsPage {...buildProps()} discussionEnabled={false} />);

    expect(screen.queryByText('Дискусија')).not.toBeInTheDocument();
  });

  test('renders the discussion section when the feature is enabled', async () => {
    render(
      <TaskDetailsPage
        {...buildProps()}
        discussionEnabled
        discussionService={buildDiscussionService()}
      />
    );

    expect(await screen.findByText('Дискусија')).toBeInTheDocument();
    expect(await screen.findByText('Прашања за задачата')).toBeInTheDocument();
  });
});
