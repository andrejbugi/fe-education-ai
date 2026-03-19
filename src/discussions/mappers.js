/**
 * @typedef {Object} DiscussionScope
 * @property {string} scopeType
 * @property {string} assignmentId
 * @property {string} assignmentTitle
 * @property {string} subjectName
 * @property {string} classroomName
 * @property {string} schoolName
 */

/**
 * @typedef {Object} DiscussionSpace
 * @property {string} id
 * @property {string} schoolId
 * @property {string} spaceType
 * @property {string} title
 * @property {string} description
 * @property {string} status
 * @property {string} visibility
 * @property {string} assignmentId
 * @property {string} assignmentTitle
 * @property {string} classroomName
 * @property {string} subjectName
 * @property {string} schoolName
 */

/**
 * @typedef {Object} DiscussionThreadSummary
 * @property {string} id
 * @property {string} discussionSpaceId
 * @property {string} title
 * @property {string} body
 * @property {string} status
 * @property {boolean} pinned
 * @property {boolean} locked
 * @property {number} postsCount
 * @property {string} lastPostAt
 * @property {Array<{ id: string, attachmentType: string, fileName: string, contentType: string, fileSize: number | null, fileUrl: string }>} attachments
 * @property {{ id: string, fullName: string, role: string }} creator
 */

/**
 * @typedef {DiscussionThreadSummary & {
 *   createdAt: string,
 *   updatedAt: string
 * }} DiscussionThreadDetail
 */

/**
 * @typedef {Object} DiscussionPost
 * @property {string} id
 * @property {string} discussionThreadId
 * @property {{ id: string, fullName: string, role: string }} author
 * @property {string} parentPostId
 * @property {string} body
 * @property {string} status
 * @property {string} editedAt
 * @property {string} deletedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} repliesCount
 * @property {Array<{ id: string, attachmentType: string, fileName: string, contentType: string, fileSize: number | null, fileUrl: string }>} attachments
 * @property {boolean} isHidden
 * @property {boolean} isDeleted
 */

/**
 * @typedef {Object} DiscussionPermissions
 * @property {boolean} canView
 * @property {boolean} canCreateThread
 * @property {boolean} canReply
 * @property {boolean} canModerate
 * @property {boolean} canHidePosts
 * @property {boolean} canEditOwnPost
 */

function toId(value, fallback) {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function toText(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

export function normalizeDiscussionRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'teacher' || normalized === 'admin') {
    return 'teacher';
  }
  return 'student';
}

function mapPerson(person, fallbackId, fallbackName) {
  return {
    id: toId(person?.id, fallbackId),
    fullName: toText(
      person?.full_name || person?.fullName || person?.name,
      fallbackName
    ),
    role: normalizeDiscussionRole(person?.role || person?.user_role),
  };
}

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

function toTimestamp(value) {
  const normalized = String(value || '').trim();
  return normalized || '';
}

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function mapDiscussionAttachment(attachment, index = 0) {
  return {
    id: toId(attachment?.id, `discussion-attachment-${index + 1}`),
    attachmentType: toText(
      attachment?.attachment_type || attachment?.attachmentType,
      'file'
    ),
    fileName: toText(attachment?.file_name || attachment?.fileName, 'Прилог'),
    contentType: toText(attachment?.content_type || attachment?.contentType, ''),
    fileSize:
      attachment?.file_size !== undefined && attachment?.file_size !== null
        ? toNumber(attachment.file_size, null)
        : attachment?.fileSize !== undefined && attachment?.fileSize !== null
          ? toNumber(attachment.fileSize, null)
          : null,
    fileUrl: toText(attachment?.file_url || attachment?.fileUrl, ''),
  };
}

export function buildAssignmentDiscussionScope({
  assignmentId,
  assignmentTitle,
  subjectName,
  classroomName,
  schoolName,
}) {
  return {
    scopeType: 'assignment',
    assignmentId: toId(assignmentId, ''),
    assignmentTitle: toText(assignmentTitle, 'Задача'),
    subjectName: toText(subjectName, ''),
    classroomName: toText(classroomName, ''),
    schoolName: toText(schoolName, ''),
  };
}

export function mapDiscussionSpace(space, scope = null) {
  const assignment = space?.assignment || {};
  const classroom = space?.classroom || {};
  const subject = space?.subject || {};
  const school = space?.school || {};

  return {
    id: toId(space?.id, `discussion-space-${scope?.assignmentId || 'assignment'}`),
    schoolId: toId(space?.school_id || school?.id, ''),
    spaceType: toText(space?.space_type, scope?.scopeType || 'assignment'),
    title: toText(space?.title, `Дискусија за ${scope?.assignmentTitle || 'задачата'}`),
    description: toText(
      space?.description,
      'Прашања, одговори и појаснувања поврзани со задачата.'
    ),
    status: toText(space?.status, 'active'),
    visibility: toText(space?.visibility, 'students_and_teachers'),
    assignmentId: toId(space?.assignment_id || assignment?.id, scope?.assignmentId || ''),
    assignmentTitle: toText(assignment?.title, scope?.assignmentTitle || 'Задача'),
    classroomName: toText(classroom?.name, scope?.classroomName || ''),
    subjectName: toText(subject?.name, scope?.subjectName || ''),
    schoolName: toText(school?.name, scope?.schoolName || ''),
  };
}

export function mapDiscussionSpaces(payload) {
  return extractList(payload, ['discussion_spaces', 'spaces']).map((space) =>
    mapDiscussionSpace(space)
  );
}

export function mapDiscussionThreadSummary(thread, index = 0) {
  return {
    id: toId(thread?.id, `discussion-thread-${index + 1}`),
    discussionSpaceId: toId(
      thread?.discussion_space_id || thread?.discussionSpaceId,
      ''
    ),
    title: toText(thread?.title, 'Нова тема'),
    body: toText(thread?.body, ''),
    status: toText(thread?.status, 'active'),
    pinned: Boolean(thread?.pinned),
    locked: Boolean(thread?.locked),
    postsCount: toNumber(thread?.posts_count ?? thread?.postsCount, 0),
    lastPostAt: toTimestamp(
      thread?.last_post_at || thread?.lastPostAt || thread?.updated_at || thread?.created_at
    ),
    attachments: Array.isArray(thread?.attachments)
      ? thread.attachments.map(mapDiscussionAttachment)
      : [],
    creator: mapPerson(thread?.creator, `creator-${index + 1}`, 'Корисник'),
  };
}

export function mapDiscussionThreadDetail(thread, index = 0) {
  return {
    ...mapDiscussionThreadSummary(thread, index),
    createdAt: toTimestamp(thread?.created_at || thread?.createdAt),
    updatedAt: toTimestamp(thread?.updated_at || thread?.updatedAt),
  };
}

export function mapDiscussionPost(post, index = 0) {
  const parentPostId = toId(
    post?.parent_post_id || post?.parentPostId,
    ''
  );
  const status = toText(post?.status, 'visible');
  const deletedAt = toTimestamp(post?.deleted_at || post?.deletedAt);

  return {
    id: toId(post?.id, `discussion-post-${index + 1}`),
    discussionThreadId: toId(
      post?.discussion_thread_id || post?.discussionThreadId,
      ''
    ),
    author: mapPerson(post?.author, `author-${index + 1}`, 'Корисник'),
    parentPostId,
    body: toText(post?.body, ''),
    status,
    editedAt: toTimestamp(post?.edited_at || post?.editedAt),
    deletedAt,
    createdAt: toTimestamp(post?.created_at || post?.createdAt),
    updatedAt: toTimestamp(post?.updated_at || post?.updatedAt),
    repliesCount: toNumber(post?.replies_count ?? post?.repliesCount, 0),
    attachments: Array.isArray(post?.attachments)
      ? post.attachments.map(mapDiscussionAttachment)
      : [],
    isHidden: status === 'hidden',
    isDeleted: status === 'deleted' || Boolean(deletedAt),
  };
}

export function sortDiscussionThreads(threads) {
  return [...threads].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return Number(right.pinned) - Number(left.pinned);
    }

    const leftTime = Date.parse(left.lastPostAt || left.updatedAt || left.createdAt || 0);
    const rightTime = Date.parse(right.lastPostAt || right.updatedAt || right.createdAt || 0);
    return rightTime - leftTime;
  });
}

export function sortDiscussionPosts(posts) {
  return [...posts].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || left.updatedAt || 0);
    const rightTime = Date.parse(right.createdAt || right.updatedAt || 0);
    return leftTime - rightTime;
  });
}

export function mapDiscussionThreads(payload) {
  return sortDiscussionThreads(
    extractList(payload, ['discussion_threads', 'threads']).map(mapDiscussionThreadSummary)
  );
}

export function mapDiscussionPosts(payload) {
  return sortDiscussionPosts(
    extractList(payload, ['discussion_posts', 'posts']).map(mapDiscussionPost)
  );
}

export function formatDiscussionDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Сега';
  }

  return parsed.toLocaleString('mk-MK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDiscussionPermissions({ role, space, thread }) {
  const normalizedRole = normalizeDiscussionRole(role);
  const isTeacher = normalizedRole === 'teacher';
  const spaceStatus = toText(space?.status, 'active');
  const threadStatus = toText(thread?.status, 'active');
  const visibility = toText(space?.visibility, 'students_and_teachers');
  const isReadOnly = visibility === 'read_only';
  const isTeachersOnly = visibility === 'teachers_only';
  const isArchived = spaceStatus === 'archived' || threadStatus === 'archived' || threadStatus === 'hidden';
  const isLocked = Boolean(thread?.locked);
  const canView = isTeacher || !isTeachersOnly;

  return {
    canView,
    canCreateThread: canView && !isArchived && !isReadOnly,
    canReply: canView && !isArchived && !isReadOnly && !isLocked,
    canModerate: isTeacher,
    canHidePosts: isTeacher,
    canEditOwnPost: !isArchived,
  };
}

export function groupDiscussionPosts(posts) {
  const orderedPosts = sortDiscussionPosts(posts);
  const topLevelPosts = [];
  const repliesByParentId = new Map();

  orderedPosts.forEach((post) => {
    if (post.parentPostId) {
      const existingReplies = repliesByParentId.get(post.parentPostId) || [];
      existingReplies.push(post);
      repliesByParentId.set(post.parentPostId, existingReplies);
      return;
    }

    topLevelPosts.push(post);
  });

  return topLevelPosts.map((post) => ({
    ...post,
    replies: sortDiscussionPosts(repliesByParentId.get(post.id) || []),
  }));
}
