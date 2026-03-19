import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentDiscussionPanel from './AssignmentDiscussionPanel';
import { createMockDiscussionService } from '../../discussions/discussionService';

function buildFixture({ locked = false } = {}) {
  return {
    space: {
      id: 'space-7',
      space_type: 'assignment',
      title: 'Дискусија за задачата',
      visibility: 'students_and_teachers',
      assignment_id: 7,
      assignment: {
        id: 7,
        title: 'Равенки',
      },
      subject: {
        name: 'Математика',
      },
      classroom: {
        name: '7-A',
      },
    },
    threads: [
      {
        id: 'thread-1',
        discussion_space_id: 'space-7',
        title: 'Прашања за задачата',
        body: 'Кратка дискусија за барањата.',
        status: 'active',
        pinned: false,
        locked,
        posts_count: 1,
        last_post_at: '2026-03-17T18:10:00.000Z',
        creator: {
          id: 'teacher-1',
          full_name: 'Марија Стојанова',
          role: 'teacher',
        },
        created_at: '2026-03-17T18:00:00.000Z',
        updated_at: '2026-03-17T18:10:00.000Z',
      },
    ],
    postsByThreadId: {
      'thread-1': [
        {
          id: 'post-1',
          discussion_thread_id: 'thread-1',
          author: {
            id: 'teacher-1',
            full_name: 'Марија Стојанова',
            role: 'teacher',
          },
          body: 'Одговор од наставник.',
          status: 'visible',
          created_at: '2026-03-17T18:10:00.000Z',
          updated_at: '2026-03-17T18:10:00.000Z',
        },
      ],
    },
  };
}

function renderPanel({ role = 'student', fixture, assignmentId = '7' }) {
  const service = createMockDiscussionService({
    fixturesByAssignmentId: {
      [assignmentId]: fixture,
    },
  });

  const renderResult = render(
    <AssignmentDiscussionPanel
      assignmentId={assignmentId}
      assignmentTitle="Равенки"
      subjectName="Математика"
      classroomName="7-A"
      schoolName="ОУ Кочо Рацин"
      role={role}
      actor={{
        id: role === 'teacher' ? 'teacher-self' : 'student-self',
        fullName: role === 'teacher' ? 'Наставник' : 'Ученик',
        role,
      }}
      discussionService={service}
    />
  );

  return {
    ...renderResult,
    service,
  };
}

describe('AssignmentDiscussionPanel', () => {
  test('shows empty state when no threads exist', async () => {
    renderPanel({
      fixture: {
        ...buildFixture(),
        threads: [],
        postsByThreadId: {},
      },
    });

    expect(await screen.findByText('Биди прв што ќе постави прашање.')).toBeInTheDocument();
  });

  test('shows teacher badge and disables composer for locked thread', async () => {
    renderPanel({
      fixture: buildFixture({ locked: true }),
    });

    expect(await screen.findByText('Наставник')).toBeInTheDocument();
    expect(await screen.findByText('Темата е заклучена и не прифаќа нови одговори.')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('opens an inline comment box for replies and keeps the new comment box separate', async () => {
    renderPanel({
      fixture: buildFixture(),
    });

    expect(await screen.findByText('Одговор од наставник.')).toBeInTheDocument();
    expect(screen.getByLabelText('Нов коментар')).toBeInTheDocument();
    expect(screen.queryByLabelText('Одговор на коментар')).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByText('Коментирај')[0]);

    const replyBox = await screen.findByLabelText('Одговор на коментар');
    await userEvent.type(replyBox, 'Фала, ми стана појасно.');
    await userEvent.click(screen.getAllByText('Коментирај')[0]);

    expect(await screen.findByText('Фала, ми стана појасно.')).toBeInTheDocument();
    expect(screen.getByLabelText('Нов коментар')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByLabelText('Одговор на коментар')).not.toBeInTheDocument();
    });
  });

  test('allows attaching files to a new comment', async () => {
    const { container, service } = renderPanel({
      fixture: buildFixture(),
    });

    const createPostSpy = jest.spyOn(service, 'createPost');
    expect(await screen.findByText('Одговор од наставник.')).toBeInTheDocument();

    const file = new File(['notes'], 'my-notes.txt', { type: 'text/plain' });
    const fileInput = container.querySelector('.discussion-comment-composer input[type="file"]');

    expect(fileInput).not.toBeNull();
    await userEvent.upload(fileInput, file);
    expect(await screen.findByText('my-notes.txt')).toBeInTheDocument();

    await userEvent.click(screen.getAllByText('Коментирај').at(-1));

    await waitFor(() => {
      expect(createPostSpy).toHaveBeenCalledWith(
        'thread-1',
        expect.objectContaining({
          body: '',
          files: [file],
        })
      );
    });

    expect(await screen.findAllByText('my-notes.txt')).not.toHaveLength(0);
  });

  test('moderation controls render only for teacher role and update state through the service', async () => {
    const studentRender = renderPanel({
      role: 'student',
      fixture: buildFixture(),
    });

    expect(await screen.findByText('Прашања за задачата')).toBeInTheDocument();
    expect(screen.queryByText('Заклучи тема')).not.toBeInTheDocument();
    studentRender.unmount();

    const { service } = renderPanel({
      role: 'teacher',
      fixture: buildFixture(),
      assignmentId: '9',
    });

    expect(await screen.findByText('Заклучи тема')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Прикачи на врв'));
    expect(await screen.findByText('Откачи')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Заклучи тема'));
    expect(await screen.findByText('Отклучи тема')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Архивирај'));

    await waitFor(async () => {
      const thread = await service.getThread('thread-1');
      expect(thread.status).toBe('archived');
    });

    expect(await screen.findAllByText('Архивирана')).not.toHaveLength(0);
  });
});
