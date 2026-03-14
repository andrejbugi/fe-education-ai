function TaskSolveCard({
  task,
  inputValue,
  onInputChange,
  onHint,
  feedback,
  isCompleted,
  aiSession,
  aiMessages = [],
}) {
  const currentStep = task.currentStep || task.steps?.[0] || null;

  return (
    <section className="workspace-card solver-card">
      <h2 className="section-title">Твој одговор</h2>
      {currentStep?.prompt ? (
        <p className="item-meta">Поттик: {currentStep.prompt}</p>
      ) : null}
      {currentStep?.exampleAnswer ? (
        <p className="item-meta">Пример одговор: {currentStep.exampleAnswer}</p>
      ) : null}
      {currentStep?.resourceUrl ? (
        <a
          className="inline-action assignment-link"
          href={currentStep.resourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Отвори ресурс за чекор
        </a>
      ) : null}
      {currentStep?.contentBlocks?.length ? (
        <div className="task-detail-block">
          <h3 className="section-title">Содржина на чекор</h3>
          {currentStep.contentBlocks.map((block, index) => (
            <p key={`${currentStep.id}-block-${index}`} className="item-meta">
              {block.text || block.content || ''}
            </p>
          ))}
        </div>
      ) : null}
      <textarea
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder={task.placeholder || 'Внеси одговор'}
        rows={3}
        disabled={isCompleted}
      />
      <div className="solver-actions">
        <button type="button" className="btn btn-secondary" onClick={onHint}>
          Помош
        </button>
      </div>
      <p className="item-meta">Потоа кликни „Провери чекор“ подолу.</p>
      {feedback ? (
        <p className={`solver-feedback feedback-${feedback.type}`}>
          {feedback.message}
        </p>
      ) : null}
      {aiSession ? (
        <div className="task-detail-block">
          <h3 className="section-title">AI сесија</h3>
          <p className="item-meta">
            {aiSession.title} · {aiSession.statusLabel || aiSession.status}
          </p>
          {aiMessages.length > 0 ? (
            <ul className="list-reset ai-message-list">
              {aiMessages.slice(-4).map((message) => (
                <li key={message.id} className={`ai-message-item ai-role-${message.role}`}>
                  <strong>{message.roleLabel}</strong>
                  <p>{message.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="item-meta">Нема зачувани AI пораки за оваа сесија.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default TaskSolveCard;
