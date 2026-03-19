import { getAssignmentDiscussionService } from './discussionService';
import { api } from '../services/apiClient';

describe('discussionService resolveAssignmentSpace', () => {
  const scope = {
    assignmentId: '7',
    assignmentTitle: 'Равенки',
    subjectName: 'Математика',
    classroomName: '7-A',
    schoolName: 'ОУ Кочо Рацин',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not create a missing assignment discussion space for students', async () => {
    jest.spyOn(api, 'discussionSpaces').mockResolvedValue({ discussion_spaces: [] });
    const createDiscussionSpace = jest.spyOn(api, 'createDiscussionSpace').mockResolvedValue({
      id: 'space-created',
    });

    const service = getAssignmentDiscussionService();
    const result = await service.resolveAssignmentSpace(scope, { role: 'student' });

    expect(result).toBeNull();
    expect(createDiscussionSpace).not.toHaveBeenCalled();
  });

  test('creates a missing assignment discussion space for teachers', async () => {
    jest.spyOn(api, 'discussionSpaces').mockResolvedValue({ discussion_spaces: [] });
    const createDiscussionSpace = jest.spyOn(api, 'createDiscussionSpace').mockResolvedValue({
      id: 'space-created',
      space_type: 'assignment',
      title: 'Дискусија за Равенки',
      description: 'Прашања, појаснувања и одговори поврзани со задачата.',
      status: 'active',
      visibility: 'students_and_teachers',
      assignment_id: 7,
      assignment: {
        id: 7,
        title: 'Равенки',
      },
      classroom: {
        name: '7-A',
      },
      subject: {
        name: 'Математика',
      },
      school: {
        name: 'ОУ Кочо Рацин',
      },
    });

    const service = getAssignmentDiscussionService();
    const result = await service.resolveAssignmentSpace(scope, { role: 'teacher' });

    expect(createDiscussionSpace).toHaveBeenCalledWith({
      space_type: 'assignment',
      title: 'Дискусија за Равенки',
      description: 'Прашања, појаснувања и одговори поврзани со задачата.',
      assignment_id: 7,
      visibility: 'students_and_teachers',
    });
    expect(result).toMatchObject({
      id: 'space-created',
      assignmentId: '7',
      title: 'Дискусија за Равенки',
      visibility: 'students_and_teachers',
    });
  });

  test('passes attachment files through when creating a discussion post', async () => {
    const createDiscussionPost = jest.spyOn(api, 'createDiscussionPost').mockResolvedValue({
      id: 'post-9',
      discussion_thread_id: 'thread-4',
      author: {
        id: 'student-1',
        full_name: 'Ученик',
        role: 'student',
      },
      body: '',
      status: 'visible',
      created_at: '2026-03-19T19:00:00.000Z',
      updated_at: '2026-03-19T19:00:00.000Z',
      attachments: [
        {
          id: 'attachment-1',
          attachment_type: 'file',
          file_name: 'notes.txt',
          content_type: 'text/plain',
          file_size: 5,
          file_url: '',
        },
      ],
    });

    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    const service = getAssignmentDiscussionService();
    const result = await service.createPost('thread-4', {
      body: '',
      files: [file],
    });

    expect(createDiscussionPost).toHaveBeenCalledWith('thread-4', {
      body: '',
      parent_post_id: undefined,
      files: [file],
    });
    expect(result.attachments).toEqual([
      expect.objectContaining({
        fileName: 'notes.txt',
        attachmentType: 'file',
      }),
    ]);
  });
});
