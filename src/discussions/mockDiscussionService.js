import {
  mapDiscussionPost,
  mapDiscussionPosts,
  mapDiscussionSpace,
  mapDiscussionThreadDetail,
  sortDiscussionPosts,
  sortDiscussionThreads,
} from './mappers';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function createDefaultSpace(scope) {
  return {
    id: `mock-space-${scope.assignmentId || 'assignment'}`,
    school_id: scope.schoolName ? 1 : '',
    space_type: 'assignment',
    title: `Дискусија за ${scope.assignmentTitle}`,
    description: 'Прашања и одговори поврзани со задачата.',
    status: 'active',
    visibility: 'students_and_teachers',
    assignment_id: scope.assignmentId,
    assignment: {
      id: scope.assignmentId,
      title: scope.assignmentTitle,
    },
    classroom: scope.classroomName ? { name: scope.classroomName } : null,
    subject: scope.subjectName ? { name: scope.subjectName } : null,
    school: scope.schoolName ? { name: scope.schoolName } : null,
  };
}

function createDefaultThreads(scope, spaceId) {
  return [
    {
      id: `mock-thread-${scope.assignmentId}-1`,
      discussion_space_id: spaceId,
      title: 'Прашања за рокот и барањата',
      body: 'Тука собираме кратки прашања околу рокот, чекорите и материјалите.',
      status: 'active',
      pinned: true,
      locked: false,
      posts_count: 2,
      last_post_at: '2026-03-17T18:15:00.000Z',
      creator: {
        id: 'teacher-1',
        full_name: 'Марија Стојанова',
        role: 'teacher',
      },
      created_at: '2026-03-16T09:30:00.000Z',
      updated_at: '2026-03-17T18:15:00.000Z',
    },
    {
      id: `mock-thread-${scope.assignmentId}-2`,
      discussion_space_id: spaceId,
      title: 'Решени примери',
      body: 'Оваа тема е затворена откако наставникот ги појасни примерите.',
      status: 'active',
      pinned: false,
      locked: true,
      posts_count: 1,
      last_post_at: '2026-03-17T12:05:00.000Z',
      creator: {
        id: 'teacher-1',
        full_name: 'Марија Стојанова',
        role: 'teacher',
      },
      created_at: '2026-03-16T12:00:00.000Z',
      updated_at: '2026-03-17T12:05:00.000Z',
    },
  ];
}

function createDefaultPosts(thread) {
  if (String(thread?.id || '').endsWith('-2')) {
    return [
      {
        id: `${thread.id}-post-1`,
        discussion_thread_id: thread.id,
        author: {
          id: 'teacher-1',
          full_name: 'Марија Стојанова',
          role: 'teacher',
        },
        parent_post_id: null,
        body: 'Ги затворам примерите за да остане дискусијата чиста. Ако има ново прашање, отвори нова тема.',
        status: 'visible',
        created_at: '2026-03-17T12:05:00.000Z',
        updated_at: '2026-03-17T12:05:00.000Z',
        replies_count: 0,
      },
    ];
  }

  return [
    {
      id: `${thread.id}-post-1`,
      discussion_thread_id: thread.id,
      author: {
        id: 'student-1',
        full_name: 'Андреј Костов',
        role: 'student',
      },
      parent_post_id: null,
      body: 'Дали треба да прикачиме и кратко образложение за секој чекор?',
      status: 'visible',
      created_at: '2026-03-17T17:30:00.000Z',
      updated_at: '2026-03-17T17:30:00.000Z',
      replies_count: 1,
    },
    {
      id: `${thread.id}-post-2`,
      discussion_thread_id: thread.id,
      author: {
        id: 'teacher-1',
        full_name: 'Марија Стојанова',
        role: 'teacher',
      },
      parent_post_id: `${thread.id}-post-1`,
      body: 'Да, доволни се 1-2 реченици по чекор за да се види постапката.',
      status: 'visible',
      created_at: '2026-03-17T18:15:00.000Z',
      updated_at: '2026-03-17T18:15:00.000Z',
      replies_count: 0,
    },
  ];
}

function normalizeFixtureState(scope, fixture = {}) {
  const space = mapDiscussionSpace(fixture.space || createDefaultSpace(scope), scope);
  const threads = sortDiscussionThreads(
    (fixture.threads || createDefaultThreads(scope, space.id)).map(mapDiscussionThreadDetail)
  );
  const postsByThreadId = new Map();

  threads.forEach((thread) => {
    const rawPosts =
      fixture.postsByThreadId?.[thread.id] ||
      fixture.postsByThreadId?.[String(thread.id)] ||
      createDefaultPosts(thread);
    postsByThreadId.set(thread.id, mapDiscussionPosts(rawPosts));
  });

  return {
    scope,
    space,
    threads,
    postsByThreadId,
  };
}

function buildAuthor(actor) {
  return {
    id: String(actor?.id || `${actor?.role || 'student'}-self`),
    full_name: actor?.fullName || actor?.name || (actor?.role === 'teacher' ? 'Наставник' : 'Ученик'),
    role: actor?.role || 'student',
  };
}

function recalculateThread(thread, posts) {
  const visiblePosts = posts.filter((post) => post.status !== 'deleted');
  const sortedPosts = sortDiscussionPosts(visiblePosts);
  const lastPost = sortedPosts[sortedPosts.length - 1];

  return {
    ...thread,
    postsCount: visiblePosts.length,
    lastPostAt: lastPost?.createdAt || thread.lastPostAt || nowIso(),
  };
}

export function createMockDiscussionService(options = {}) {
  const fixturesByAssignmentId = options.fixturesByAssignmentId || {};
  const stateByAssignmentId = new Map();
  let sequence = 1000;

  function ensureAssignmentScope(scope) {
    const assignmentId = String(scope?.assignmentId || '').trim();
    if (!assignmentId) {
      throw new Error('Недостасува идентификатор за задачата.');
    }

    if (!stateByAssignmentId.has(assignmentId)) {
      stateByAssignmentId.set(
        assignmentId,
        normalizeFixtureState(scope, fixturesByAssignmentId[assignmentId])
      );
    }

    return stateByAssignmentId.get(assignmentId);
  }

  function getAssignmentStateBySpaceId(spaceId) {
    for (const state of stateByAssignmentId.values()) {
      if (state.space.id === String(spaceId)) {
        return state;
      }
    }
    return null;
  }

  function getAssignmentStateByThreadId(threadId) {
    for (const state of stateByAssignmentId.values()) {
      if (state.threads.some((thread) => thread.id === String(threadId))) {
        return state;
      }
    }
    return null;
  }

  function replaceThread(state, nextThread) {
    state.threads = sortDiscussionThreads(
      state.threads.map((thread) => (thread.id === nextThread.id ? nextThread : thread))
    );
  }

  return {
    mode: 'mock',

    async resolveAssignmentSpace(scope) {
      const state = ensureAssignmentScope(scope);
      return clone(state.space);
    },

    async listThreads(spaceId) {
      const state = getAssignmentStateBySpaceId(spaceId);
      return clone(state?.threads || []);
    },

    async getThread(threadId) {
      const state = getAssignmentStateByThreadId(threadId);
      const thread = state?.threads.find((item) => item.id === String(threadId));
      return thread ? clone(mapDiscussionThreadDetail(thread)) : null;
    },

    async listPosts(threadId) {
      const state = getAssignmentStateByThreadId(threadId);
      return clone(state?.postsByThreadId.get(String(threadId)) || []);
    },

    async createThread(spaceId, payload) {
      const state = getAssignmentStateBySpaceId(spaceId);
      if (!state) {
        throw new Error('Не успеавме да го пронајдеме просторот за дискусија.');
      }

      const timestamp = nowIso();
      const thread = mapDiscussionThreadDetail({
        id: `mock-thread-${sequence += 1}`,
        discussion_space_id: state.space.id,
        title: payload?.title,
        body: payload?.body,
        status: 'active',
        pinned: false,
        locked: false,
        posts_count: 0,
        last_post_at: timestamp,
        creator: buildAuthor(payload?.actor),
        created_at: timestamp,
        updated_at: timestamp,
      });

      state.threads = sortDiscussionThreads([...state.threads, thread]);
      state.postsByThreadId.set(thread.id, []);
      return clone(thread);
    },

    async createPost(threadId, payload) {
      const state = getAssignmentStateByThreadId(threadId);
      const currentThread = state?.threads.find((thread) => thread.id === String(threadId));
      if (!state || !currentThread) {
        throw new Error('Не успеавме да ја пронајдеме темата.');
      }

      if (currentThread.locked || currentThread.status === 'archived') {
        throw new Error('Темата е заклучена и не прифаќа нови одговори.');
      }

      const timestamp = nowIso();
      const currentPosts = state.postsByThreadId.get(currentThread.id) || [];
      const nextPost = mapDiscussionPost({
        id: `mock-post-${sequence += 1}`,
        discussion_thread_id: currentThread.id,
        author: buildAuthor(payload?.actor),
        parent_post_id: payload?.parentPostId || null,
        body: payload?.body,
        status: 'visible',
        created_at: timestamp,
        updated_at: timestamp,
      });
      const nextPosts = sortDiscussionPosts([...currentPosts, nextPost]).map((post) => {
        if (post.id === nextPost.parentPostId) {
          return {
            ...post,
            repliesCount: (post.repliesCount || 0) + 1,
          };
        }
        return post;
      });

      state.postsByThreadId.set(currentThread.id, nextPosts);
      replaceThread(state, recalculateThread(currentThread, nextPosts));
      return clone(nextPost);
    },

    async lockThread(threadId) {
      const state = getAssignmentStateByThreadId(threadId);
      const currentThread = state?.threads.find((thread) => thread.id === String(threadId));
      if (!state || !currentThread) {
        throw new Error('Темата не е пронајдена.');
      }
      replaceThread(state, {
        ...currentThread,
        locked: true,
        updatedAt: nowIso(),
      });
      return this.getThread(threadId);
    },

    async unlockThread(threadId) {
      const state = getAssignmentStateByThreadId(threadId);
      const currentThread = state?.threads.find((thread) => thread.id === String(threadId));
      if (!state || !currentThread) {
        throw new Error('Темата не е пронајдена.');
      }
      replaceThread(state, {
        ...currentThread,
        locked: false,
        updatedAt: nowIso(),
      });
      return this.getThread(threadId);
    },

    async pinThread(threadId) {
      const state = getAssignmentStateByThreadId(threadId);
      const currentThread = state?.threads.find((thread) => thread.id === String(threadId));
      if (!state || !currentThread) {
        throw new Error('Темата не е пронајдена.');
      }
      replaceThread(state, {
        ...currentThread,
        pinned: true,
        updatedAt: nowIso(),
      });
      return this.getThread(threadId);
    },

    async unpinThread(threadId) {
      const state = getAssignmentStateByThreadId(threadId);
      const currentThread = state?.threads.find((thread) => thread.id === String(threadId));
      if (!state || !currentThread) {
        throw new Error('Темата не е пронајдена.');
      }
      replaceThread(state, {
        ...currentThread,
        pinned: false,
        updatedAt: nowIso(),
      });
      return this.getThread(threadId);
    },

    async archiveThread(threadId) {
      const state = getAssignmentStateByThreadId(threadId);
      const currentThread = state?.threads.find((thread) => thread.id === String(threadId));
      if (!state || !currentThread) {
        throw new Error('Темата не е пронајдена.');
      }
      replaceThread(state, {
        ...currentThread,
        status: 'archived',
        locked: true,
        updatedAt: nowIso(),
      });
      return this.getThread(threadId);
    },

    async hidePost(postId) {
      const postKey = String(postId);
      for (const state of stateByAssignmentId.values()) {
        for (const [threadId, posts] of state.postsByThreadId.entries()) {
          const target = posts.find((post) => post.id === postKey);
          if (!target) {
            continue;
          }

          const nextPosts = posts.map((post) =>
            post.id === postKey ? { ...post, status: 'hidden' } : post
          );
          state.postsByThreadId.set(threadId, nextPosts);
          return clone(nextPosts.find((post) => post.id === postKey));
        }
      }

      throw new Error('Објавата не е пронајдена.');
    },

    async unhidePost(postId) {
      const postKey = String(postId);
      for (const state of stateByAssignmentId.values()) {
        for (const [threadId, posts] of state.postsByThreadId.entries()) {
          const target = posts.find((post) => post.id === postKey);
          if (!target) {
            continue;
          }

          const nextPosts = posts.map((post) =>
            post.id === postKey ? { ...post, status: 'visible' } : post
          );
          state.postsByThreadId.set(threadId, nextPosts);
          return clone(nextPosts.find((post) => post.id === postKey));
        }
      }

      throw new Error('Објавата не е пронајдена.');
    },
  };
}
