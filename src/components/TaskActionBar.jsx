function TaskActionBar({
  onCheckStep,
  onFinishTask,
  onNextTask,
  onSkipTask,
  onBackToDashboard,
  isFinalTask,
  isCheckDisabled,
}) {
  return (
    <section className="workspace-card action-card">
      <h2 className="section-title">Акции</h2>
      <div className="workspace-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCheckStep}
          disabled={isCheckDisabled}
        >
          Провери чекор
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onFinishTask}
          disabled={isCheckDisabled}
        >
          Заврши задача
        </button>
        <button type="button" className="btn btn-secondary" onClick={onNextTask}>
          {isFinalTask ? 'Заврши и назад' : 'Следна задача'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSkipTask}>
          Прескокни
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBackToDashboard}>
          Назад до контролна табла
        </button>
      </div>
    </section>
  );
}

export default TaskActionBar;
