import { useEffect, useMemo, useState } from 'react';

function AiTutorSidebar({
  isOpen,
  onClose,
  onSendMessage,
  currentStep,
  session,
  loading,
  error,
  maxAssistances = 3,
}) {
  const [draftMessage, setDraftMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDraftMessage('');
      setIsSending(false);
      setLocalError('');
    }
  }, [isOpen]);

  const usedAssistances = useMemo(
    () =>
      (session?.messages || []).filter(
        (message) => message.role === 'user' && message.messageType === 'question'
      ).length,
    [session]
  );
  const remainingAssistances = Math.max(maxAssistances - usedAssistances, 0);
  const limitReached = remainingAssistances === 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draftMessage.trim() || isSending || limitReached) {
      return;
    }

    setIsSending(true);
    setLocalError('');
    try {
      await onSendMessage?.(draftMessage.trim());
      setDraftMessage('');
    } catch (sendError) {
      setLocalError(sendError.message || 'Нешто тргна наопаку. Обиди се повторно.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-tutor-shell">
      <button
        type="button"
        className="ai-tutor-backdrop"
        onClick={onClose}
        aria-label="Затвори AI Tutor"
      />
      <aside className="ai-tutor-sidebar" aria-label="AI Tutor">
        <div className="ai-tutor-header">
          <div>
            <p className="auth-eyebrow">AI Tutor</p>
            <h2 className="section-title">Помош за тековниот чекор</h2>
            {currentStep?.title ? (
              <p className="item-meta">Чекор: {currentStep.title}</p>
            ) : null}
          </div>
          <button type="button" className="btn btn-ghost ai-tutor-close" onClick={onClose}>
            Затвори
          </button>
        </div>

        <div className="ai-tutor-counter">
          <strong>AI помош:</strong> {usedAssistances}/{maxAssistances}
        </div>

        <div className="ai-tutor-body">
          {loading ? <p className="item-meta">Се вчитува AI tutor...</p> : null}
          {!loading && session?.messages?.length ? (
            <div className="ai-message-list">
              {session.messages.map((message) => (
                <article
                  key={message.id}
                  className={`ai-message-item ai-role-${message.role || 'assistant'}`}
                >
                  <strong>
                    {message.role === 'user' ? 'Ти' : 'AI Tutor'}
                  </strong>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
          ) : null}
          {!loading && !session?.messages?.length ? (
            <div className="ai-tutor-empty">
              <p className="item-meta">
                Постави конкретно прашање за чекорот и AI tutor ќе ти даде насока без да го реши
                целиот одговор наместо тебе.
              </p>
            </div>
          ) : null}
          {error ? <p className="auth-error">{error}</p> : null}
          {localError ? <p className="auth-error">{localError}</p> : null}
          {limitReached ? (
            <p className="feedback-info ai-tutor-limit">
              Го достигна лимитот од {maxAssistances} AI помоши за оваа задача.
            </p>
          ) : null}
        </div>

        <form className="ai-tutor-form" onSubmit={handleSubmit}>
          <label>
            Прашање за AI tutor
            <textarea
              rows={4}
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder="На пример: Како да почнам со овој чекор?"
              disabled={loading || isSending || limitReached}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || isSending || limitReached || !draftMessage.trim()}
          >
            {isSending ? 'Се испраќа...' : 'Испрати прашање'}
          </button>
        </form>
      </aside>
    </div>
  );
}

export default AiTutorSidebar;
