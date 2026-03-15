import { TASK_STATUS_LABEL } from '../data/mockTasks';

function TaskCard({ task }) {
  const statusClass = `status-${task.status.replace('_', '-')}`;
  const requiredSteps = Array.isArray(task.steps)
    ? task.steps.filter((step) => step.required).length
    : 0;
  const currentStepIndex =
    Array.isArray(task.steps) && task.currentStep
      ? task.steps.findIndex((step) => String(step.id) === String(task.currentStep.id))
      : -1;

  return (
    <section className="workspace-card task-card">
      <div className="task-card-top">
        <p className="item-subject">{task.subject}</p>
        <span className={`status-badge ${statusClass}`}>
          {TASK_STATUS_LABEL[task.status]}
        </span>
      </div>
      <h2 className="section-title">{task.title}</h2>
      <p className="item-meta">Тип: {task.type}</p>
      {task.teacherName ? <p className="item-meta">Наставник: {task.teacherName}</p> : null}
      {task.classroomName ? <p className="item-meta">Клас: {task.classroomName}</p> : null}
      <p className="item-meta">Тежина: {task.difficulty}</p>
      {Array.isArray(task.steps) && task.steps.length > 0 ? (
        <p className="item-meta">
          Чекори: {task.steps.length} · Задолжителни: {requiredSteps}
        </p>
      ) : null}
      {task.resources?.length ? (
        <p className="item-meta">Материјали: {task.resources.length}</p>
      ) : null}
      {task.maxPoints ? <p className="item-meta">Макс. поени: {task.maxPoints}</p> : null}
      {task.readingPassage?.length ? (
        <div className="reading-block">
          <h3>Текст за читање</h3>
          {task.readingPassage.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      <p className="task-instructions">{task.instructions}</p>
      {task.contentBlocks?.length ? (
        <p className="item-meta">Структурирана содржина: {task.contentBlocks.length} блока</p>
      ) : null}
      {task.currentStep?.prompt ? (
        <p className="item-meta">
          Тековен чекор: {currentStepIndex + 1 > 0 ? `${currentStepIndex + 1}. ` : ''}
          {task.currentStep.prompt}
        </p>
      ) : null}
      <p className="item-meta">Рок: {task.dueText}</p>
      {task.submission?.statusLabel ? (
        <p className="item-meta">Предавање: {task.submission.statusLabel}</p>
      ) : null}
    </section>
  );
}

export default TaskCard;
