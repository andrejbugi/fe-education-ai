function TaskSolveCard({
  task,
  inputValue,
  onInputChange,
  onHint,
  feedback,
  isCompleted,
}) {
  return (
    <section className="workspace-card solver-card">
      <h2 className="section-title">Твој одговор</h2>
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
    </section>
  );
}

export default TaskSolveCard;
