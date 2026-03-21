function TaskSolveCard({
  task,
  inputValue,
  onInputChange,
  onHint,
  onAiTutorOpen,
  aiAssistancesUsed = 0,
  aiAssistancesMax = 3,
  feedback,
  isCompleted,
}) {
  const currentStep = task.currentStep || task.steps?.[0] || null;
  const currentStepAnswer = task.submission?.stepAnswers?.find(
    (stepAnswer) => String(stepAnswer.assignmentStepId) === String(currentStep?.id)
  );
  const currentStepStatusLabel =
    currentStepAnswer?.status === 'answered' && currentStep?.evaluationMode !== 'manual'
      ? 'Зачувано'
      : currentStepAnswer?.statusLabel;

  return (
    <section className="workspace-card solver-card">
      <h2 className="section-title">Твој одговор</h2>
      {currentStep?.content ? (
        <div className="task-detail-block">
          <h3 className="section-title">Задача за чекор</h3>
          <p className="item-title">{currentStep.content}</p>
        </div>
      ) : null}
      {currentStep?.evaluationModeLabel ? (
        <p className="item-meta">Проверка: {currentStep.evaluationModeLabel}</p>
      ) : null}
      {currentStepStatusLabel ? (
        <p className="item-meta">Статус на чекор: {currentStepStatusLabel}</p>
      ) : null}
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
        <button type="button" className="btn btn-secondary" onClick={onHint} disabled={isCompleted}>
          Помош
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onAiTutorOpen}
          disabled={isCompleted}
        >
          AI Tutor ({aiAssistancesUsed}/{aiAssistancesMax})
        </button>
      </div>
      <p className="item-meta">
        {currentStep?.evaluationMode && currentStep.evaluationMode !== 'manual'
          ? 'Потоа кликни „Провери чекор“ за автоматска проверка.'
          : 'Потоа кликни „Провери чекор“ за да го зачуваш одговорот.'}
      </p>
      {feedback ? (
        <p className={`solver-feedback feedback-${feedback.type}`}>
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}

export default TaskSolveCard;
