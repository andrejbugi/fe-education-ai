import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/apiClient';
import {
  formatDiscussionDateTime,
  getDiscussionPermissions,
  groupDiscussionPosts,
  mapDiscussionPost,
  mapDiscussionPosts,
  mapDiscussionSpaces,
  mapDiscussionThreadDetail,
  mapDiscussionThreads,
} from '../../discussions/mappers';
import {
  DiscussionAttachmentList,
  DiscussionSelectedFiles,
  getSelectedDiscussionFileKey,
  mergeSelectedDiscussionFiles,
} from './DiscussionAttachments';

const EMPTY_THREAD_FORM = {
  title: '',
  body: '',
};

const EMPTY_COMMENT_BODY = '';
const EMPTY_FILE_SELECTION = [];

function removeSelectedFile(files, fileKey) {
  return (files || []).filter((file) => getSelectedDiscussionFileKey(file) !== fileKey);
}

function hasContentOrFiles(body, files) {
  return Boolean(String(body || '').trim()) || (Array.isArray(files) && files.length > 0);
}

const defaultDiscussionService = {
  mode: 'api',

  async listSpaces(filters = {}) {
    const response = await api.discussionSpaces(filters);
    return mapDiscussionSpaces(response);
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

function buildFallbackErrorMessage(providerMode) {
  if (providerMode === 'api') {
    return 'Не успеавме да ги вчитаме дискусиите. Обиди се повторно.';
  }

  return 'Не успеавме да ја подготвиме листата со дискусии.';
}

function updateThreadInList(threads, nextThread) {
  return threads.map((thread) => (thread.id === nextThread.id ? { ...thread, ...nextThread } : thread));
}

function formatCommentCount(count) {
  const normalizedCount = Number(count) || 0;
  return `${normalizedCount} ${normalizedCount === 1 ? 'коментар' : 'коментари'}`;
}

function getSpaceTypeLabel(spaceType) {
  if (spaceType === 'assignment') {
    return 'Задача';
  }
  if (spaceType === 'classroom') {
    return 'Клас';
  }
  if (spaceType === 'subject') {
    return 'Предмет';
  }
  if (spaceType === 'school') {
    return 'Училиште';
  }
  return 'Дискусија';
}

function getSpaceMeta(space) {
  return [
    space?.assignmentTitle,
    space?.subjectName,
    space?.classroomName,
    space?.schoolName,
  ]
    .filter(Boolean)
    .join(' · ');
}

function DiscussionsHub({
  role = 'student',
  actor = null,
  discussionService = null,
  className = '',
}) {
  const resolvedService = useMemo(
    () => discussionService || defaultDiscussionService,
    [discussionService]
  );
  const providerMode = resolvedService?.mode || 'api';
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [threadForm, setThreadForm] = useState(EMPTY_THREAD_FORM);
  const [threadFiles, setThreadFiles] = useState(EMPTY_FILE_SELECTION);
  const [newCommentBody, setNewCommentBody] = useState(EMPTY_COMMENT_BODY);
  const [newCommentFiles, setNewCommentFiles] = useState(EMPTY_FILE_SELECTION);
  const [activeReplyParentId, setActiveReplyParentId] = useState('');
  const [replyDraftBody, setReplyDraftBody] = useState(EMPTY_COMMENT_BODY);
  const [replyFiles, setReplyFiles] = useState(EMPTY_FILE_SELECTION);
  const [submittingThread, setSubmittingThread] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [threadActionLoading, setThreadActionLoading] = useState('');
  const [postActionLoadingId, setPostActionLoadingId] = useState('');

  const selectedSpace = useMemo(
    () => spaces.find((space) => space.id === selectedSpaceId) || null,
    [spaces, selectedSpaceId]
  );
  const permissions = useMemo(
    () => getDiscussionPermissions({ role, space: selectedSpace, thread: selectedThread }),
    [role, selectedSpace, selectedThread]
  );
  const groupedPosts = useMemo(() => groupDiscussionPosts(posts), [posts]);

  useEffect(() => {
    let isMounted = true;

    async function loadSpaces() {
      setLoadingSpaces(true);
      setError('');

      try {
        const nextSpaces = await resolvedService.listSpaces({ status: 'active' });
        if (!isMounted) {
          return;
        }

        setSpaces(nextSpaces);
        setSelectedSpaceId((currentValue) => {
          if (currentValue && nextSpaces.some((space) => space.id === currentValue)) {
            return currentValue;
          }
          return nextSpaces[0]?.id || '';
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || buildFallbackErrorMessage(providerMode));
          setSpaces([]);
          setSelectedSpaceId('');
        }
      } finally {
        if (isMounted) {
          setLoadingSpaces(false);
        }
      }
    }

    loadSpaces();

    return () => {
      isMounted = false;
    };
  }, [resolvedService, providerMode]);

  useEffect(() => {
    if (!selectedSpaceId) {
      setThreads([]);
      setSelectedThreadId('');
      setSelectedThread(null);
      setPosts([]);
      setShowNewThreadForm(false);
      setThreadForm(EMPTY_THREAD_FORM);
      setThreadFiles(EMPTY_FILE_SELECTION);
      setNewCommentBody(EMPTY_COMMENT_BODY);
      setNewCommentFiles(EMPTY_FILE_SELECTION);
      setActiveReplyParentId('');
      setReplyDraftBody(EMPTY_COMMENT_BODY);
      setReplyFiles(EMPTY_FILE_SELECTION);
      return;
    }

    let isMounted = true;

    async function loadThreads() {
      setLoadingThreads(true);
      setError('');

      try {
        const nextThreads = await resolvedService.listThreads(selectedSpaceId);
        if (!isMounted) {
          return;
        }

        setThreads(nextThreads);
        setSelectedThreadId((currentValue) => {
          if (currentValue && nextThreads.some((thread) => thread.id === currentValue)) {
            return currentValue;
          }
          return nextThreads[0]?.id || '';
        });
        setSelectedThread(null);
        setPosts([]);
        setNewCommentBody(EMPTY_COMMENT_BODY);
        setNewCommentFiles(EMPTY_FILE_SELECTION);
        setActiveReplyParentId('');
        setReplyDraftBody(EMPTY_COMMENT_BODY);
        setReplyFiles(EMPTY_FILE_SELECTION);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || buildFallbackErrorMessage(providerMode));
          setThreads([]);
          setSelectedThreadId('');
          setSelectedThread(null);
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoadingThreads(false);
        }
      }
    }

    loadThreads();

    return () => {
      isMounted = false;
    };
  }, [selectedSpaceId, resolvedService, providerMode]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThread(null);
      setPosts([]);
      setNewCommentBody(EMPTY_COMMENT_BODY);
      setNewCommentFiles(EMPTY_FILE_SELECTION);
      setActiveReplyParentId('');
      setReplyDraftBody(EMPTY_COMMENT_BODY);
      setReplyFiles(EMPTY_FILE_SELECTION);
      return;
    }

    let isMounted = true;
    setLoadingThread(true);
    setError('');

    Promise.all([
      resolvedService.getThread(selectedThreadId),
      resolvedService.listPosts(selectedThreadId),
    ])
      .then(([nextThread, nextPosts]) => {
        if (!isMounted) {
          return;
        }

        setSelectedThread(nextThread);
        setThreads((currentThreads) =>
          nextThread ? updateThreadInList(currentThreads, nextThread) : currentThreads
        );
        setPosts(nextPosts);
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError?.message || buildFallbackErrorMessage(providerMode));
          setSelectedThread(null);
          setPosts([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingThread(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedThreadId, resolvedService, providerMode]);

  const refreshSpaces = async () => {
    const nextSpaces = await resolvedService.listSpaces({ status: 'active' });
    setSpaces(nextSpaces);
    return nextSpaces;
  };

  const refreshThreads = async (nextSelectedThreadId = selectedThreadId) => {
    if (!selectedSpaceId) {
      return [];
    }

    const nextThreads = await resolvedService.listThreads(selectedSpaceId);
    setThreads(nextThreads);
    setSelectedThreadId(nextSelectedThreadId || nextThreads[0]?.id || '');
    return nextThreads;
  };

  const refreshSelectedThread = async (threadId = selectedThreadId) => {
    if (!threadId) {
      setSelectedThread(null);
      setPosts([]);
      return;
    }

    const [nextThread, nextPosts] = await Promise.all([
      resolvedService.getThread(threadId),
      resolvedService.listPosts(threadId),
    ]);
    setSelectedThread(nextThread);
    setThreads((currentThreads) =>
      nextThread ? updateThreadInList(currentThreads, nextThread) : currentThreads
    );
    setPosts(nextPosts);
  };

  const handleCreateThread = async () => {
    if (
      !selectedSpace?.id ||
      !threadForm.title.trim() ||
      !hasContentOrFiles(threadForm.body, threadFiles)
    ) {
      return;
    }

    setSubmittingThread(true);
    setError('');

    try {
      const nextThread = await resolvedService.createThread(selectedSpace.id, {
        ...threadForm,
        files: threadFiles,
        actor,
      });
      await refreshSpaces();
      await refreshThreads(nextThread?.id);
      setShowNewThreadForm(false);
      setThreadForm(EMPTY_THREAD_FORM);
      setThreadFiles(EMPTY_FILE_SELECTION);
    } catch (submissionError) {
      setError(submissionError?.message || 'Не успеавме да ја зачуваме темата.');
    } finally {
      setSubmittingThread(false);
    }
  };

  const handleCommentSubmit = async (parentPostId = '') => {
    const normalizedParentPostId = String(parentPostId || '').trim();
    const nextBody = normalizedParentPostId ? replyDraftBody : newCommentBody;
    const nextFiles = normalizedParentPostId ? replyFiles : newCommentFiles;

    if (!selectedThread?.id || !hasContentOrFiles(nextBody, nextFiles)) {
      return;
    }

    setSubmittingReply(true);
    setError('');

    try {
      await resolvedService.createPost(selectedThread.id, {
        body: nextBody,
        parentPostId: normalizedParentPostId,
        files: nextFiles,
        actor,
      });
      await refreshThreads(selectedThread.id);
      await refreshSelectedThread(selectedThread.id);
      if (normalizedParentPostId) {
        setActiveReplyParentId('');
        setReplyDraftBody(EMPTY_COMMENT_BODY);
        setReplyFiles(EMPTY_FILE_SELECTION);
      } else {
        setNewCommentBody(EMPTY_COMMENT_BODY);
        setNewCommentFiles(EMPTY_FILE_SELECTION);
      }
    } catch (submissionError) {
      setError(submissionError?.message || 'Не успеавме да го зачуваме коментарот.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleThreadAction = async (actionName) => {
    if (!selectedThread?.id || typeof resolvedService?.[actionName] !== 'function') {
      return;
    }

    setThreadActionLoading(actionName);
    setError('');

    try {
      await resolvedService[actionName](selectedThread.id);
      await refreshThreads(selectedThread.id);
      await refreshSelectedThread(selectedThread.id);
    } catch (actionError) {
      setError(actionError?.message || 'Не успеавме да ја ажурираме темата.');
    } finally {
      setThreadActionLoading('');
    }
  };

  const handlePostAction = async (actionName, postId) => {
    if (!postId || typeof resolvedService?.[actionName] !== 'function') {
      return;
    }

    setPostActionLoadingId(`${actionName}:${postId}`);
    setError('');

    try {
      await resolvedService[actionName](postId);
      await refreshSelectedThread(selectedThread?.id || selectedThreadId);
    } catch (actionError) {
      setError(actionError?.message || 'Не успеавме да го ажурираме коментарот.');
    } finally {
      setPostActionLoadingId('');
    }
  };

  const handleFileAppend = (setter) => (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (nextFiles.length === 0) {
      return;
    }

    setter((currentFiles) => mergeSelectedDiscussionFiles(currentFiles, nextFiles));
    event.target.value = '';
  };

  return (
    <section className={`discussion-hub ${className}`.trim()}>
      <div className="discussion-hub-header">
        <div>
          <p className="hero-eyebrow">Дискусии</p>
          <h1 className="section-title">Сите достапни дискусии</h1>
          <p className="item-meta">
            Прегледај ги просториите за дискусија и отвори тема или коментар каде што имаш пристап.
          </p>
        </div>
      </div>

      {loadingSpaces ? <p className="empty-state">Се вчитуваат дискусиите...</p> : null}
      {!loadingSpaces && error ? <p className="auth-error">{error}</p> : null}

      {!loadingSpaces && !error && spaces.length === 0 ? (
        <div className="discussion-empty-box">
          <p className="section-title">Нема достапни дискусии</p>
          <p className="empty-state">Штом се појават активни простории, ќе ги видиш тука.</p>
        </div>
      ) : null}

      {!loadingSpaces && !error && spaces.length > 0 ? (
        <div className="discussion-hub-layout">
          <aside className="discussion-space-list" aria-label="Листа на дискусии">
            {spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                className={`discussion-space-item ${selectedSpaceId === space.id ? 'is-active' : ''}`}
                onClick={() => setSelectedSpaceId(space.id)}
              >
                <div className="discussion-space-head">
                  <strong>{space.title}</strong>
                  <span className="discussion-chip">{getSpaceTypeLabel(space.spaceType)}</span>
                </div>
                {space.description ? <p>{space.description}</p> : null}
                {getSpaceMeta(space) ? (
                  <div className="discussion-thread-meta">
                    <span>{getSpaceMeta(space)}</span>
                    <span>{space.visibility === 'read_only' ? 'Само читање' : 'Активно'}</span>
                  </div>
                ) : null}
              </button>
            ))}
          </aside>

          <div className="discussion-hub-main">
            {!selectedSpace ? (
              <div className="discussion-empty-box">
                <p className="section-title">Одбери дискусија</p>
                <p className="empty-state">Избери простор од левата страна за да ги видиш темите.</p>
              </div>
            ) : (
              <>
                <div className="discussion-panel-actions">
                  <div className="discussion-space-meta">
                    <span>{selectedSpace.title}</span>
                    {getSpaceMeta(selectedSpace) ? <span>{getSpaceMeta(selectedSpace)}</span> : null}
                  </div>
                  {permissions.canCreateThread ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setShowNewThreadForm((currentValue) => {
                          if (currentValue) {
                            setThreadForm(EMPTY_THREAD_FORM);
                            setThreadFiles(EMPTY_FILE_SELECTION);
                          }
                          return !currentValue;
                        })
                      }
                    >
                      {showNewThreadForm ? 'Откажи нова тема' : 'Нова тема'}
                    </button>
                  ) : null}
                </div>

                {showNewThreadForm ? (
                  <div className="discussion-composer">
                    <label className="discussion-field">
                      Наслов
                      <input
                        type="text"
                        value={threadForm.title}
                        onChange={(event) =>
                          setThreadForm((currentForm) => ({
                            ...currentForm,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Наслов на темата"
                      />
                    </label>
                    <label className="discussion-field">
                      Опис
                      <textarea
                        rows={4}
                        value={threadForm.body}
                        onChange={(event) =>
                          setThreadForm((currentForm) => ({
                            ...currentForm,
                            body: event.target.value,
                          }))
                        }
                        placeholder="Опиши го прашањето или темата."
                      />
                    </label>
                    <div className="discussion-composer-actions discussion-composer-actions-start">
                      <label className="btn btn-ghost chat-file-picker">
                        <input type="file" multiple onChange={handleFileAppend(setThreadFiles)} />
                        Додај прилози
                      </label>
                    </div>
                    <DiscussionSelectedFiles
                      files={threadFiles}
                      onRemove={(fileKey) =>
                        setThreadFiles((currentFiles) =>
                          removeSelectedFile(currentFiles, fileKey)
                        )
                      }
                    />
                    <div className="discussion-composer-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={
                          submittingThread ||
                          !threadForm.title.trim() ||
                          !hasContentOrFiles(threadForm.body, threadFiles)
                        }
                        onClick={handleCreateThread}
                      >
                        {submittingThread ? 'Се зачувува...' : 'Постави тема'}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="discussion-layout">
                  <aside className="discussion-thread-list" aria-label="Листа на теми">
                    {loadingThreads ? <p className="empty-state">Се вчитуваат темите...</p> : null}
                    {!loadingThreads && threads.length === 0 ? (
                      <div className="discussion-empty-box">
                        <p className="section-title">Нема теми</p>
                        <p className="empty-state">Отвори прва тема во оваа дискусија.</p>
                      </div>
                    ) : null}
                    {!loadingThreads
                      ? threads.map((thread) => (
                          <button
                            key={thread.id}
                            type="button"
                            className={`discussion-thread-item ${selectedThreadId === thread.id ? 'is-active' : ''}`}
                            onClick={() => setSelectedThreadId(thread.id)}
                          >
                            <div className="discussion-thread-head">
                              <strong>{thread.title}</strong>
                              <div className="discussion-thread-badges">
                                {thread.pinned ? <span className="discussion-chip">Прикачена</span> : null}
                                {thread.locked ? <span className="discussion-chip">Заклучена</span> : null}
                                {thread.status === 'archived' ? (
                                  <span className="discussion-chip">Архивирана</span>
                                ) : null}
                              </div>
                            </div>
                            {thread.body ? <p>{thread.body}</p> : null}
                            <div className="discussion-thread-meta">
                              <span>{formatCommentCount(thread.postsCount)}</span>
                              <span>{formatDiscussionDateTime(thread.lastPostAt)}</span>
                            </div>
                          </button>
                        ))
                      : null}
                  </aside>

                  <div className="discussion-thread-detail">
                    {!selectedThreadId ? (
                      <div className="discussion-empty-box">
                        <p className="section-title">Одбери тема</p>
                        <p className="empty-state">Одбери тема за да ги видиш коментарите.</p>
                      </div>
                    ) : loadingThread ? (
                      <p className="empty-state">Се вчитува темата...</p>
                    ) : !selectedThread ? (
                      <div className="discussion-empty-box">
                        <p className="section-title">Темата не е достапна</p>
                        <p className="empty-state">Освежи ја листата или избери друга тема.</p>
                      </div>
                    ) : (
                      <>
                        <div className="discussion-detail-header">
                          <div>
                            <p className="hero-eyebrow">{getSpaceTypeLabel(selectedSpace.spaceType)}</p>
                            <h3 className="section-title">{selectedThread.title}</h3>
                            {selectedThread.body ? <p className="item-meta">{selectedThread.body}</p> : null}
                            <DiscussionAttachmentList attachments={selectedThread.attachments} />
                            <p className="item-meta">
                              Од {selectedThread.creator.fullName} ·{' '}
                              {formatDiscussionDateTime(selectedThread.createdAt || selectedThread.lastPostAt)}
                            </p>
                          </div>
                          {permissions.canModerate ? (
                            <div className="discussion-moderation-actions">
                              <button
                                type="button"
                                className="inline-action"
                                onClick={() =>
                                  handleThreadAction(
                                    selectedThread.pinned ? 'unpinThread' : 'pinThread'
                                  )
                                }
                                disabled={
                                  threadActionLoading === 'pinThread' ||
                                  threadActionLoading === 'unpinThread'
                                }
                              >
                                {selectedThread.pinned ? 'Откачи' : 'Прикачи на врв'}
                              </button>
                              <button
                                type="button"
                                className="inline-action"
                                onClick={() =>
                                  handleThreadAction(
                                    selectedThread.locked ? 'unlockThread' : 'lockThread'
                                  )
                                }
                                disabled={
                                  threadActionLoading === 'lockThread' ||
                                  threadActionLoading === 'unlockThread'
                                }
                              >
                                {selectedThread.locked ? 'Отклучи тема' : 'Заклучи тема'}
                              </button>
                              <button
                                type="button"
                                className="inline-action"
                                onClick={() => handleThreadAction('archiveThread')}
                                disabled={
                                  threadActionLoading === 'archiveThread' ||
                                  selectedThread.status === 'archived'
                                }
                              >
                                Архивирај
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div className="discussion-post-list">
                          {groupedPosts.length === 0 ? (
                            <div className="discussion-empty-box">
                              <p className="section-title">Нема коментари</p>
                              <p className="empty-state">Оваа тема сè уште нема коментари.</p>
                            </div>
                          ) : (
                            groupedPosts.map((post) => (
                              <article key={post.id} className="discussion-post-card">
                                <div className="discussion-post-header">
                                  <div>
                                    <strong>{post.author.fullName}</strong>
                                    {post.author.role === 'teacher' ? (
                                      <span className="discussion-author-badge">Наставник</span>
                                    ) : null}
                                  </div>
                                  <span>{formatDiscussionDateTime(post.createdAt)}</span>
                                </div>
                                <p className="discussion-post-body">
                                  {post.isHidden ? 'Овој коментар е сокриен.' : post.body}
                                </p>
                                <DiscussionAttachmentList attachments={post.attachments} />
                                {permissions.canReply && !post.isHidden ? (
                                  <div className="discussion-post-actions">
                                    <button
                                      type="button"
                                      className="inline-action"
                                      onClick={() => {
                                        if (activeReplyParentId === post.id) {
                                          setActiveReplyParentId('');
                                          setReplyDraftBody(EMPTY_COMMENT_BODY);
                                          setReplyFiles(EMPTY_FILE_SELECTION);
                                          return;
                                        }

                                        setActiveReplyParentId(post.id);
                                        setReplyDraftBody(EMPTY_COMMENT_BODY);
                                        setReplyFiles(EMPTY_FILE_SELECTION);
                                      }}
                                    >
                                      {activeReplyParentId === post.id ? 'Откажи' : 'Коментирај'}
                                    </button>
                                    {permissions.canHidePosts ? (
                                      <button
                                        type="button"
                                        className="inline-action"
                                        onClick={() => handlePostAction('hidePost', post.id)}
                                        disabled={postActionLoadingId === `hidePost:${post.id}`}
                                      >
                                        Сокриј коментар
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                                {permissions.canReply &&
                                !post.isHidden &&
                                activeReplyParentId === post.id ? (
                                  <div className="discussion-inline-composer">
                                    <div className="discussion-field">
                                      <textarea
                                        aria-label="Одговор на коментар"
                                        rows={3}
                                        value={replyDraftBody}
                                        onChange={(event) => setReplyDraftBody(event.target.value)}
                                        disabled={!permissions.canReply}
                                        placeholder="Напиши одговор на овој коментар."
                                      />
                                    </div>
                                    <div className="discussion-composer-actions discussion-composer-actions-start">
                                      <label className="btn btn-ghost chat-file-picker">
                                        <input
                                          type="file"
                                          multiple
                                          onChange={handleFileAppend(setReplyFiles)}
                                        />
                                        Додај прилози
                                      </label>
                                    </div>
                                    <DiscussionSelectedFiles
                                      files={replyFiles}
                                      onRemove={(fileKey) =>
                                        setReplyFiles((currentFiles) =>
                                          removeSelectedFile(currentFiles, fileKey)
                                        )
                                      }
                                    />
                                    <div className="discussion-composer-actions">
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => handleCommentSubmit(post.id)}
                                        disabled={
                                          !permissions.canReply ||
                                          submittingReply ||
                                          !hasContentOrFiles(replyDraftBody, replyFiles)
                                        }
                                      >
                                        {submittingReply ? 'Се испраќа...' : 'Коментирај'}
                                      </button>
                                    </div>
                                  </div>
                                ) : permissions.canHidePosts ? (
                                  <div className="discussion-post-actions">
                                    <button
                                      type="button"
                                      className="inline-action"
                                      onClick={() => handlePostAction('unhidePost', post.id)}
                                      disabled={postActionLoadingId === `unhidePost:${post.id}`}
                                    >
                                      Прикажи коментар
                                    </button>
                                  </div>
                                ) : null}
                                {post.replies?.length > 0 ? (
                                  <div className="discussion-replies">
                                    {post.replies.map((reply) => (
                                      <div key={reply.id} className="discussion-reply-card">
                                        <div className="discussion-post-header">
                                          <div>
                                            <strong>{reply.author.fullName}</strong>
                                            {reply.author.role === 'teacher' ? (
                                              <span className="discussion-author-badge">Наставник</span>
                                            ) : null}
                                          </div>
                                          <span>{formatDiscussionDateTime(reply.createdAt)}</span>
                                        </div>
                                        <p className="discussion-post-body">
                                          {reply.isHidden ? 'Овој коментар е сокриен.' : reply.body}
                                        </p>
                                        <DiscussionAttachmentList attachments={reply.attachments} />
                                        {permissions.canHidePosts ? (
                                          <div className="discussion-post-actions">
                                            <button
                                              type="button"
                                              className="inline-action"
                                              onClick={() =>
                                                handlePostAction(
                                                  reply.isHidden ? 'unhidePost' : 'hidePost',
                                                  reply.id
                                                )
                                              }
                                              disabled={
                                                postActionLoadingId === `hidePost:${reply.id}` ||
                                                postActionLoadingId === `unhidePost:${reply.id}`
                                              }
                                            >
                                              {reply.isHidden ? 'Прикажи коментар' : 'Сокриј коментар'}
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </article>
                            ))
                          )}
                        </div>

                        <div className="discussion-composer discussion-comment-composer">
                          <div className="discussion-field">
                            <textarea
                              aria-label="Нов коментар"
                              rows={4}
                              value={newCommentBody}
                              onChange={(event) => setNewCommentBody(event.target.value)}
                              disabled={!permissions.canReply}
                              placeholder={
                                permissions.canReply
                                  ? 'Напиши нов коментар.'
                                  : selectedThread.locked
                                    ? 'Темата е заклучена.'
                                    : 'Оваа тема е само за читање.'
                              }
                            />
                          </div>
                          <div className="discussion-composer-actions discussion-composer-actions-start">
                            <label className="btn btn-ghost chat-file-picker">
                              <input
                                type="file"
                                multiple
                                onChange={handleFileAppend(setNewCommentFiles)}
                              />
                              Додај прилози
                            </label>
                          </div>
                          <DiscussionSelectedFiles
                            files={newCommentFiles}
                            onRemove={(fileKey) =>
                              setNewCommentFiles((currentFiles) =>
                                removeSelectedFile(currentFiles, fileKey)
                              )
                            }
                          />
                          {!permissions.canReply ? (
                            <p className="empty-state">
                              {selectedThread.locked
                                ? 'Темата е заклучена и не прифаќа нови одговори.'
                                : 'Во моментов не можеш да коментираш во оваа тема.'}
                            </p>
                          ) : null}
                          <div className="discussion-composer-actions">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleCommentSubmit()}
                              disabled={
                                !permissions.canReply ||
                                submittingReply ||
                                !hasContentOrFiles(newCommentBody, newCommentFiles)
                              }
                            >
                              {submittingReply ? 'Се испраќа...' : 'Коментирај'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default DiscussionsHub;
