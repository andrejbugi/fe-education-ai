import { api } from '../services/apiClient';
import {
  mapDiscussionPost,
  mapDiscussionPosts,
  mapDiscussionSpace,
  mapDiscussionThreadDetail,
  mapDiscussionThreads,
  normalizeDiscussionRole,
} from './mappers';
import { shouldUseMockDiscussionProvider } from './featureFlags';
import { createMockDiscussionService } from './mockDiscussionService';

function extractList(payload, keys) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

const mockDiscussionService = createMockDiscussionService();

function isPersistedAssignmentId(value) {
  return /^\d+$/.test(String(value || '').trim());
}

const apiDiscussionService = {
  mode: 'api',

  async resolveAssignmentSpace(scope, options = {}) {
    if (!isPersistedAssignmentId(scope?.assignmentId)) {
      return null;
    }

    const response = await api.discussionSpaces({
      space_type: 'assignment',
      assignment_id: scope.assignmentId,
      status: 'active',
    });
    const rawSpace = extractList(response, ['discussion_spaces', 'spaces'])[0] || null;

    if (rawSpace) {
      return mapDiscussionSpace(rawSpace, scope);
    }

    if (normalizeDiscussionRole(options?.role) !== 'teacher') {
      return null;
    }

    const createdSpace = await api.createDiscussionSpace({
      space_type: 'assignment',
      title: `Дискусија за ${scope.assignmentTitle}`,
      description: 'Прашања, појаснувања и одговори поврзани со задачата.',
      assignment_id: Number(scope.assignmentId),
      visibility: 'students_and_teachers',
    });

    return createdSpace ? mapDiscussionSpace(createdSpace, scope) : null;
  },

  async listThreads(spaceId) {
    const response = await api.discussionThreads(spaceId);
    return mapDiscussionThreads(response);
  },

  async getThread(threadId) {
    const response = await api.discussionThreadDetails(threadId);
    return response ? mapDiscussionThreadDetail(response) : null;
  },

  async listPosts(threadId) {
    const response = await api.discussionThreadPosts(threadId);
    return mapDiscussionPosts(response);
  },

  async createThread(spaceId, payload) {
    const response = await api.createDiscussionThread(spaceId, {
      title: payload?.title,
      body: payload?.body,
      files: payload?.files,
    });
    return mapDiscussionThreadDetail(response);
  },

  async createPost(threadId, payload) {
    const response = await api.createDiscussionPost(threadId, {
      body: payload?.body,
      parent_post_id: payload?.parentPostId || undefined,
      files: payload?.files,
    });
    return mapDiscussionPost(response);
  },

  async lockThread(threadId) {
    const response = await api.lockDiscussionThread(threadId);
    return mapDiscussionThreadDetail(response);
  },

  async unlockThread(threadId) {
    const response = await api.unlockDiscussionThread(threadId);
    return mapDiscussionThreadDetail(response);
  },

  async pinThread(threadId) {
    const response = await api.pinDiscussionThread(threadId);
    return mapDiscussionThreadDetail(response);
  },

  async unpinThread(threadId) {
    const response = await api.unpinDiscussionThread(threadId);
    return mapDiscussionThreadDetail(response);
  },

  async archiveThread(threadId) {
    const response = await api.archiveDiscussionThread(threadId);
    return mapDiscussionThreadDetail(response);
  },

  async hidePost(postId) {
    const response = await api.hideDiscussionPost(postId);
    return mapDiscussionPost(response);
  },

  async unhidePost(postId) {
    const response = await api.unhideDiscussionPost(postId);
    return mapDiscussionPost(response);
  },
};

export function getAssignmentDiscussionService() {
  return shouldUseMockDiscussionProvider() ? mockDiscussionService : apiDiscussionService;
}

export { createMockDiscussionService };
