import {
  buildAssignmentDiscussionScope,
  mapDiscussionPost,
  mapDiscussionSpace,
  mapDiscussionThreadDetail,
} from './mappers';

describe('discussion mappers', () => {
  test('mapDiscussionSpace falls back safely for sparse payloads', () => {
    const scope = buildAssignmentDiscussionScope({
      assignmentId: '42',
      assignmentTitle: 'Равенки',
      subjectName: 'Математика',
      classroomName: '7-A',
      schoolName: 'ОУ Кочо Рацин',
    });

    const mappedSpace = mapDiscussionSpace({}, scope);

    expect(mappedSpace.id).toBe('discussion-space-42');
    expect(mappedSpace.spaceType).toBe('assignment');
    expect(mappedSpace.assignmentId).toBe('42');
    expect(mappedSpace.assignmentTitle).toBe('Равенки');
    expect(mappedSpace.subjectName).toBe('Математика');
    expect(mappedSpace.classroomName).toBe('7-A');
  });

  test('mapDiscussionThreadDetail and mapDiscussionPost tolerate missing optional fields', () => {
    const mappedThread = mapDiscussionThreadDetail({
      id: 9,
      title: 'Прашање',
      creator: {
        full_name: 'Ана',
        role: 'admin',
      },
    });
    const mappedPost = mapDiscussionPost({
      id: 12,
      body: 'Текст',
      author: {
        name: 'Марко',
      },
    });

    expect(mappedThread.id).toBe('9');
    expect(mappedThread.status).toBe('active');
    expect(mappedThread.creator.role).toBe('teacher');
    expect(mappedPost.id).toBe('12');
    expect(mappedPost.parentPostId).toBe('');
    expect(mappedPost.author.fullName).toBe('Марко');
    expect(mappedPost.author.role).toBe('student');
  });
});
