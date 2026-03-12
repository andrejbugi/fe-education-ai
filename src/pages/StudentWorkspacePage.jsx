import { useMemo } from 'react';
import WorkspaceHeader from '../components/WorkspaceHeader';
import TaskProgress from '../components/TaskProgress';
import TaskCard from '../components/TaskCard';
import TaskSolveCard from '../components/TaskSolveCard';
import TaskActionBar from '../components/TaskActionBar';
import { TASK_STATUS } from '../data/mockTasks';

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function StudentWorkspacePage({
  theme,
  onToggleTheme,
  tasks,
  activeTask,
  onBackToDashboard,
  onCompleteTask,
  onSkipTask,
  onNextTask,
  getNextTaskId,
  draft,
  onDraftAnswerChange,
  onDraftFeedbackChange,
  onTaskCompleted,
}) {
  const currentIndex = tasks.findIndex((task) => task.id === activeTask.id) + 1;
  const nextTaskId = useMemo(() => getNextTaskId(activeTask.id), [
    activeTask.id,
    getNextTaskId,
  ]);
  const isFinalTask = !nextTaskId;
  const isCompleted = activeTask.status === TASK_STATUS.DONE;
  const currentFeedback = draft?.feedback || null;
  const currentAnswer = draft?.answer || '';

  const handleComplete = () => {
    if (isCompleted) {
      onDraftFeedbackChange({
        type: 'info',
        message: 'Оваа задача е веќе завршена.',
      });
      return;
    }

    if (!currentAnswer.trim()) {
      onDraftFeedbackChange({
        type: 'warning',
        message: 'Внеси одговор пред проверка.',
      });
      return;
    }

    const isCorrect = activeTask.expectedAnswers.some(
      (answer) => normalizeAnswer(answer) === normalizeAnswer(currentAnswer)
    );

    if (!isCorrect) {
      onDraftFeedbackChange({
        type: 'error',
        message: `Неточно. Помош: ${activeTask.hint}`,
      });
      return;
    }

    onCompleteTask(activeTask.id);
    onDraftFeedbackChange({
      type: 'success',
      message: 'Точно. Задачата е означена како завршена.',
    });
    onTaskCompleted(activeTask.id, nextTaskId);
  };

  const handleSkip = () => {
    onSkipTask(activeTask.id);
    onDraftFeedbackChange({
      type: 'info',
      message: 'Задачата е прескокната.',
    });
    if (nextTaskId) {
      onNextTask(nextTaskId);
      return;
    }
    onBackToDashboard();
  };

  const handleNext = () => {
    if (nextTaskId) {
      onNextTask(nextTaskId);
      return;
    }
    onBackToDashboard();
  };

  const handleHint = () => {
    onDraftFeedbackChange({
      type: 'info',
      message: `Помош: ${activeTask.hint}`,
    });
  };

  return (
    <div className={`workspace-root theme-${theme}`}>
      <main className="workspace-main">
        <WorkspaceHeader
          title={activeTask.title}
          currentIndex={currentIndex}
          total={tasks.length}
          onBack={onBackToDashboard}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <div className="workspace-grid">
          <TaskProgress tasks={tasks} activeTaskId={activeTask.id} />
          <TaskCard task={activeTask} />
        </div>

        <TaskSolveCard
          task={activeTask}
          inputValue={currentAnswer}
          onInputChange={onDraftAnswerChange}
          onHint={handleHint}
          feedback={currentFeedback}
          isCompleted={isCompleted}
        />

        <TaskActionBar
          onCheckStep={handleComplete}
          onNextTask={handleNext}
          onSkipTask={handleSkip}
          onBackToDashboard={onBackToDashboard}
          isFinalTask={isFinalTask}
          isCheckDisabled={isCompleted}
        />
      </main>
    </div>
  );
}

export default StudentWorkspacePage;
