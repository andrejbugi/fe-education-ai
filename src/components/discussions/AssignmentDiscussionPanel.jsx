import { useEffect, useMemo, useState } from 'react';
import { getAssignmentDiscussionService } from '../../discussions/discussionService';
import {
  buildAssignmentDiscussionScope,
  formatDiscussionDateTime,
  getDiscussionPermissions,
  groupDiscussionPosts,
} from '../../discussions/mappers';

const EMPTY_THREAD_FORM = {
  title: '',
  body: '',
};

const EMPTY_REPLY_FORM = {
  parentPostId: '',
  body: '',
};

function buildFallbackErrorMessage(providerMode) {
  if (providerMode === 'api') {
    return 'Дискусиите сè уште не се поврзани со серверот. Оваа секција е подготвена за backend интеграција.';
  }

  return 'Не успеавме да ја вчитаме дискусијата за оваа задача.';
}

function updateThreadInList(threads, nextThread) {
  return threads.map((thread) => (thread.id === nextThread.id ? { ...thread, ...nextThread } : thread));
}

function AssignmentDiscussionPanel({
  assignmentId,
  assignmentTitle,
  subjectName,
  classroomName,
  schoolName,
  role = 'student',
  actor = null,
  discussionService = null,
  className = '',
}) {
  const resolvedService = useMemo(
    () => discussionService || getAssignmentDiscussionService(),
    [discussionService]
  );
  const providerMode = resolvedService?.mode || 'api';
  const discussionScope = useMemo(
    () =>
      buildAssignmentDiscussionScope({
        assignmentId,
        assignmentTitle,
        subjectName,
        classroomName,
        schoolName,
      }),
    [assignmentId, assignmentTitle, subjectName, classroomName, schoolName]
  );
  const [space, setSpace] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [threadForm, setThreadForm] = useState(EMPTY_THREAD_FORM);
  const [replyForm, setReplyForm] = useState(EMPTY_REPLY_FORM);
  const [submittingThread, setSubmittingThread] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [threadActionLoading, setThreadActionLoading] = useState('');
  const [postActionLoadingId, setPostActionLoadingId] = useState('');

  const permissions = useMemo(
    () => getDiscussionPermissions({ role, space, thread: selectedThread }),
    [role, space, selectedThread]
  );
  const groupedPosts = useMemo(() => groupDiscussionPosts(posts), [posts]);

  useEffect(() => {
    let isMounted = true;

    async function loadBoard() {
      setLoadingBoard(true);
      setError('');

      try {
        const resolvedSpace = await resolvedService.resolveAssignmentSpace(discussionScope);
        if (!isMounted) {
          return;
        }

        setSpace(resolvedSpace);

        if (!resolvedSpace) {
          setThreads([]);
          setSelectedThreadId('');
          setSelectedThread(null);
          setPosts([]);
          return;
        }

        const nextThreads = await resolvedService.listThreads(resolvedSpace.id);
        if (!isMounted) {
          return;
        }

        setThreads(nextThreads);
        setSelectedThreadId((currentThreadId) => {
          if (currentThreadId && nextThreads.some((thread) => thread.id === currentThreadId)) {
            return currentThreadId;
          }
          return nextThreads[0]?.id || '';
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || buildFallbackErrorMessage(providerMode));
          setSpace(null);
          setThreads([]);
          setSelectedThreadId('');
          setSelectedThread(null);
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoadingBoard(false);
        }
      }
    }

    loadBoard();

    return () => {
      isMounted = false;
    };
  }, [resolvedService, discussionScope, providerMode]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThread(null);
      setPosts([]);
      setReplyForm(EMPTY_REPLY_FORM);
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

  const refreshThreads = async (nextSelectedThreadId = selectedThreadId) => {
    if (!space?.id) {
      return [];
    }

    const nextThreads = await resolvedService.listThreads(space.id);
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
    if (!space?.id || !threadForm.title.trim() || !threadForm.body.trim()) {
      return;
    }

    setSubmittingThread(true);
    setError('');

    try {
      const nextThread = await resolvedService.createThread(space.id, {
        ...threadForm,
        actor,
      });
      await refreshThreads(nextThread?.id);
      setShowNewThreadForm(false);
      setThreadForm(EMPTY_THREAD_FORM);
    } catch (submissionError) {
      setError(submissionError?.message || 'Не успеавме да ја зачуваме темата.');
    } finally {
      setSubmittingThread(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedThread?.id || !replyForm.body.trim()) {
      return;
    }

    setSubmittingReply(true);
    setError('');

    try {
      await resolvedService.createPost(selectedThread.id, {
        body: replyForm.body,
        parentPostId: replyForm.parentPostId || '',
        actor,
      });
      await refreshThreads(selectedThread.id);
      await refreshSelectedThread(selectedThread.id);
      setReplyForm(EMPTY_REPLY_FORM);
    } catch (submissionError) {
      setError(submissionError?.message || 'Не успеавме да го зачуваме одговорот.');
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
      setError(actionError?.message || 'Не успеавме да ја ажурираме објавата.');
    } finally {
      setPostActionLoadingId('');
    }
  };

  return (
    <section className={`discussion-panel ${className}`.trim()}>
      <div className="discussion-panel-header">
        <div>
          <h2 className="section-title">Дискусија</h2>
          <p className="item-meta">
            Прашања, појаснувања и одговори поврзани со оваа задача.
          </p>
        </div>
        <div className="discussion-panel-badges">
          {providerMode === 'mock' ? (
            <span className="discussion-provider-badge">Mock преглед</span>
          ) : null}
          {space?.visibility === 'read_only' ? (
            <span className="discussion-provider-badge">Само читање</span>
          ) : null}
        </div>
      </div>

      {loadingBoard ? <p className="empty-state">Се вчитува дискусијата...</p> : null}
      {!loadingBoard && error ? <p className="auth-error">{error}</p> : null}
      {!loadingBoard && !error && !permissions.canView ? (
        <p className="empty-state">Оваа дискусија не е достапна за твојата улога.</p>
      ) : null}

      {!loadingBoard && !error && permissions.canView ? (
        !space?.id ? (
          <div className="discussion-empty-box">
            <p className="section-title">Дискусијата е во подготовка</p>
            <p className="empty-state">
              Просторот за оваа задача ќе се појави штом backend интеграцијата биде достапна.
            </p>
          </div>
        ) : (
          <>
          <div className="discussion-panel-actions">
            <div className="discussion-space-meta">
              <span>{space?.title || 'Дискусија за задачата'}</span>
              {space?.subjectName || space?.classroomName ? (
                <span>
                  {[space?.subjectName, space?.classroomName].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </div>
            {permissions.canCreateThread ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNewThreadForm((currentValue) => !currentValue)}
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
              <div className="discussion-composer-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submittingThread || !threadForm.title.trim() || !threadForm.body.trim()}
                  onClick={handleCreateThread}
                >
                  {submittingThread ? 'Се зачувува...' : 'Постави тема'}
                </button>
              </div>
            </div>
          ) : null}

          <div className="discussion-layout">
            <aside className="discussion-thread-list" aria-label="Листа на теми">
              {threads.length === 0 ? (
                <div className="discussion-empty-box">
                  <p className="section-title">Нема објави</p>
                  <p className="empty-state">Биди прв што ќе постави прашање.</p>
                </div>
              ) : (
                threads.map((thread) => (
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
                      <span>{thread.postsCount} објави</span>
                      <span>{formatDiscussionDateTime(thread.lastPostAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </aside>

            <div className="discussion-thread-detail">
              {!selectedThreadId ? (
                <div className="discussion-empty-box">
                  <p className="section-title">Одбери тема</p>
                  <p className="empty-state">Од левата страна избери тема за да ја прегледаш дискусијата.</p>
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
                      <p className="hero-eyebrow">Прашања и одговори</p>
                      <h3 className="section-title">{selectedThread.title}</h3>
                      {selectedThread.body ? (
                        <p className="item-meta">{selectedThread.body}</p>
                      ) : null}
                      <p className="item-meta">
                        Од {selectedThread.creator.fullName} · {formatDiscussionDateTime(selectedThread.createdAt || selectedThread.lastPostAt)}
                      </p>
                    </div>
                    {permissions.canModerate ? (
                      <div className="discussion-moderation-actions">
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() =>
                            handleThreadAction(selectedThread.pinned ? 'unpinThread' : 'pinThread')
                          }
                          disabled={threadActionLoading === 'pinThread' || threadActionLoading === 'unpinThread'}
                        >
                          {selectedThread.pinned ? 'Откачи' : 'Прикачи на врв'}
                        </button>
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() =>
                            handleThreadAction(selectedThread.locked ? 'unlockThread' : 'lockThread')
                          }
                          disabled={threadActionLoading === 'lockThread' || threadActionLoading === 'unlockThread'}
                        >
                          {selectedThread.locked ? 'Отклучи тема' : 'Заклучи тема'}
                        </button>
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() => handleThreadAction('archiveThread')}
                          disabled={threadActionLoading === 'archiveThread' || selectedThread.status === 'archived'}
                        >
                          Архивирај
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="discussion-post-list">
                    {groupedPosts.length === 0 ? (
                      <div className="discussion-empty-box">
                        <p className="section-title">Нема објави</p>
                        <p className="empty-state">Оваа тема сè уште нема одговори.</p>
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
                            {post.isHidden ? 'Оваа објава е сокриена.' : post.body}
                          </p>
                          {permissions.canReply && !post.isHidden ? (
                            <div className="discussion-post-actions">
                              <button
                                type="button"
                                className="inline-action"
                                onClick={() =>
                                  setReplyForm({
                                    parentPostId:
                                      replyForm.parentPostId === post.id ? '' : post.id,
                                    body: '',
                                  })
                                }
                              >
                                {replyForm.parentPostId === post.id ? 'Откажи одговор' : 'Одговори'}
                              </button>
                              {permissions.canHidePosts ? (
                                <button
                                  type="button"
                                  className="inline-action"
                                  onClick={() => handlePostAction('hidePost', post.id)}
                                  disabled={postActionLoadingId === `hidePost:${post.id}`}
                                >
                                  Сокриј објава
                                </button>
                              ) : null}
                            </div>
                          ) : permissions.canHidePosts ? (
                            <div className="discussion-post-actions">
                              <button
                                type="button"
                                className="inline-action"
                                onClick={() => handlePostAction('unhidePost', post.id)}
                                disabled={postActionLoadingId === `unhidePost:${post.id}`}
                              >
                                Прикажи објава
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
                                    {reply.isHidden ? 'Оваа објава е сокриена.' : reply.body}
                                  </p>
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
                                        {reply.isHidden ? 'Прикажи објава' : 'Сокриј објава'}
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

                  <div className="discussion-composer">
                    <label className="discussion-field">
                      {replyForm.parentPostId ? 'Одговор' : 'Нова објава'}
                      <textarea
                        rows={4}
                        value={replyForm.body}
                        onChange={(event) =>
                          setReplyForm((currentForm) => ({
                            ...currentForm,
                            body: event.target.value,
                          }))
                        }
                        disabled={!permissions.canReply}
                        placeholder={
                          permissions.canReply
                            ? 'Напиши прашање или одговор.'
                            : selectedThread.locked
                              ? 'Темата е заклучена.'
                              : 'Оваа тема е само за читање.'
                        }
                      />
                    </label>
                    {!permissions.canReply ? (
                      <p className="empty-state">
                        {selectedThread.locked
                          ? 'Темата е заклучена и не прифаќа нови одговори.'
                          : 'Во моментов не можеш да објавуваш во оваа тема.'}
                      </p>
                    ) : null}
                    <div className="discussion-composer-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleReplySubmit}
                        disabled={!permissions.canReply || submittingReply || !replyForm.body.trim()}
                      >
                        {submittingReply ? 'Се испраќа...' : replyForm.parentPostId ? 'Испрати одговор' : 'Постави прашање'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          </>
        )
      ) : null}
    </section>
  );
}

export default AssignmentDiscussionPanel;
