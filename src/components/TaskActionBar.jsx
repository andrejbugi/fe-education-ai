function TaskActionBar({
  currentStepIndex,
  totalSteps,
  onCheckStep,
  onSaveProgress,
  onFinishTask,
  onNextStep,
  isCheckDisabled,
  isSaveDisabled,
  isNextDisabled,
  isSubmitDisabled,
}) {
  return (
    <section className="workspace-card action-card">
      <h2 className="section-title">Акции</h2>
      {totalSteps > 0 ? (
        <p className="item-meta">
          Чекор {Math.max(currentStepIndex + 1, 1)} од {totalSteps}
        </p>
      ) : null}
      <div className="workspace-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCheckStep}
          disabled={isCheckDisabled}
        >
          Провери
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onSaveProgress}
          disabled={isSaveDisabled}
        >
          Зачувај
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onNextStep}
          disabled={isNextDisabled}
        >
          Следен чекор
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onFinishTask}
          disabled={isSubmitDisabled}
        >
          Поднеси
        </button>
      </div>
    </section>
  );
}

export default TaskActionBar;
