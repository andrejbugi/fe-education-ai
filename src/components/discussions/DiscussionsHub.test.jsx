import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiscussionsHub from './DiscussionsHub';

function buildService() {
  return {
    mode: 'mock',
    listSpaces: jest.fn().mockResolvedValue([
      {
        id: 'space-1',
        title: 'Алгебра 7-А',
        description: 'Прашања за тековната тема.',
        spaceType: 'subject',
        visibility: 'students_and_teachers',
        subjectName: 'Математика',
        classroomName: '7-A',
        schoolName: 'ОУ Кочо Рацин',
        status: 'active',
      },
      {
        id: 'space-2',
        title: 'Хемија 7-А',
        description: 'Прашања за проектот.',
        spaceType: 'subject',
        visibility: 'students_and_teachers',
        subjectName: 'Хемија',
        classroomName: '7-A',
        schoolName: 'ОУ Кочо Рацин',
        status: 'active',
      },
    ]),
    listThreads: jest.fn().mockImplementation(async (spaceId) => {
      if (spaceId === 'space-2') {
        return [
          {
            id: 'thread-2',
            discussionSpaceId: 'space-2',
            title: 'Прашања за проектот',
            body: 'Да собереме материјали тука.',
            status: 'active',
            pinned: false,
            locked: false,
            postsCount: 0,
            lastPostAt: '2026-03-19T18:12:00.000Z',
            creator: {
              id: 'teacher-1',
              fullName: 'Ана Трајковска',
              role: 'teacher',
            },
          },
        ];
      }

      return [
        {
          id: 'thread-1',
          discussionSpaceId: 'space-1',
          title: 'Подготовка за контролна',
          body: 'Поставувајте прашања за задачите.',
          status: 'active',
          pinned: true,
          locked: false,
          postsCount: 1,
          lastPostAt: '2026-03-19T18:10:00.000Z',
          creator: {
            id: 'teacher-1',
            fullName: 'Ана Трајковска',
            role: 'teacher',
          },
        },
      ];
    }),
    getThread: jest.fn().mockImplementation(async (threadId) => {
      if (threadId === 'thread-2') {
        return {
          id: 'thread-2',
          discussionSpaceId: 'space-2',
          title: 'Прашања за проектот',
          body: 'Да собереме материјали тука.',
          status: 'active',
          pinned: false,
          locked: false,
          postsCount: 0,
          lastPostAt: '2026-03-19T18:12:00.000Z',
          createdAt: '2026-03-19T18:00:00.000Z',
          creator: {
            id: 'teacher-1',
            fullName: 'Ана Трајковска',
            role: 'teacher',
          },
        };
      }

      return {
        id: 'thread-1',
        discussionSpaceId: 'space-1',
        title: 'Подготовка за контролна',
        body: 'Поставувајте прашања за задачите.',
        status: 'active',
        pinned: true,
        locked: false,
        postsCount: 1,
        lastPostAt: '2026-03-19T18:10:00.000Z',
        createdAt: '2026-03-19T18:00:00.000Z',
        creator: {
          id: 'teacher-1',
          fullName: 'Ана Трајковска',
          role: 'teacher',
        },
      };
    }),
    listPosts: jest.fn().mockImplementation(async (threadId) => {
      if (threadId === 'thread-2') {
        return [];
      }

      return [
        {
          id: 'post-1',
          discussionThreadId: 'thread-1',
          author: {
            id: 'teacher-1',
            fullName: 'Ана Трајковска',
            role: 'teacher',
          },
          parentPostId: '',
          body: 'Фокусирајте се на равенки и текстуални задачи.',
          status: 'visible',
          createdAt: '2026-03-19T18:10:00.000Z',
          updatedAt: '2026-03-19T18:10:00.000Z',
          repliesCount: 0,
          isHidden: false,
          isDeleted: false,
        },
      ];
    }),
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

describe('DiscussionsHub', () => {
  test('loads available discussion spaces and switches to the selected space', async () => {
    const service = buildService();

    render(
      <DiscussionsHub
        role="student"
        actor={{ id: 'student-1', fullName: 'Лина Трајковска', role: 'student' }}
        discussionService={service}
      />
    );

    expect(await screen.findByRole('button', { name: /Алгебра 7-А/i })).toBeInTheDocument();
    expect(await screen.findByText('Подготовка за контролна')).toBeInTheDocument();
    expect(
      await screen.findByText('Фокусирајте се на равенки и текстуални задачи.')
    ).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Хемија 7-А/i }));
    });

    expect(
      await within(screen.getByLabelText('Листа на теми')).findByRole('button', {
        name: /Прашања за проектот/i,
      })
    ).toBeInTheDocument();
    expect(await screen.findByText('Оваа тема сè уште нема коментари.')).toBeInTheDocument();
    expect(service.listThreads).toHaveBeenCalledWith('space-2');
  });

  test('allows creating a thread with multiple attachments', async () => {
    const service = buildService();
    const uploadedFiles = [
      new File(['one'], 'guide.pdf', { type: 'application/pdf' }),
      new File(['two'], 'notes.txt', { type: 'text/plain' }),
    ];

    service.createThread.mockImplementation(async (spaceId, payload) => ({
      id: 'thread-new',
      discussionSpaceId: spaceId,
      title: payload.title,
      body: payload.body,
      status: 'active',
      pinned: false,
      locked: false,
      postsCount: 0,
      lastPostAt: '2026-03-19T19:00:00.000Z',
      createdAt: '2026-03-19T19:00:00.000Z',
      attachments: payload.files.map((file, index) => ({
        id: `attachment-${index + 1}`,
        attachmentType: file.type === 'application/pdf' ? 'pdf' : 'file',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        fileUrl: '',
      })),
      creator: {
        id: 'teacher-1',
        fullName: 'Ана Трајковска',
        role: 'teacher',
      },
    }));

    const { container } = render(
      <DiscussionsHub
        role="teacher"
        actor={{ id: 'teacher-1', fullName: 'Ана Трајковска', role: 'teacher' }}
        discussionService={service}
      />
    );

    await screen.findByRole('button', { name: /Алгебра 7-А/i });
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Нова тема' }));
    });

    await userEvent.type(screen.getByPlaceholderText('Наслов на темата'), 'Фајлови за час');

    const fileInput = container.querySelector('.discussion-composer input[type="file"]');
    expect(fileInput).not.toBeNull();
    await userEvent.upload(fileInput, uploadedFiles);

    expect(await screen.findByText('guide.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Постави тема' }));
    });

    expect(service.createThread).toHaveBeenCalledWith(
      'space-1',
      expect.objectContaining({
        title: 'Фајлови за час',
        body: '',
        files: expect.arrayContaining(uploadedFiles),
      })
    );
  });
});
