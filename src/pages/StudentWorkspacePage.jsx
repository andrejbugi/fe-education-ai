import { useMemo, useState } from 'react';
import WorkspaceHeader from '../components/WorkspaceHeader';
import TaskProgress from '../components/TaskProgress';
import TaskCard from '../components/TaskCard';
import TaskSolveCard from '../components/TaskSolveCard';
import TaskActionBar from '../components/TaskActionBar';
import { TASK_STATUS } from '../data/mockTasks';

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
  onSaveStepAnswer,
  onSubmitAssignment,
}) {
  const currentIndex = tasks.findIndex((task) => task.id === activeTask.id) + 1;
  const nextTaskId = useMemo(() => getNextTaskId(activeTask.id), [
    activeTask.id,
    getNextTaskId,
  ]);
  const isFinalTask = !nextTaskId;
  const isCompleted = activeTask.status === TASK_STATUS.DONE;
  const currentFeedback = draft?.feedback || null;
  const currentStep = activeTask.currentStep || activeTask.steps?.[0] || null;
  const currentStepAnswer = activeTask.submission?.stepAnswers?.find(
    (stepAnswer) => String(stepAnswer.assignmentStepId) === String(currentStep?.id)
  );
  const currentAnswer =
    draft?.stepId === currentStep?.id ? draft?.answer || '' : currentStepAnswer?.answerText || '';
  const usesBackendChecking = Boolean(onSaveStepAnswer && currentStep?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
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

    if (usesBackendChecking) {
      setIsSubmitting(true);
      try {
        const result = await onSaveStepAnswer(activeTask, currentAnswer);
        const stepStatus = result?.stepAnswer?.status;
        if (stepStatus === 'correct') {
          onDraftFeedbackChange({
            type: 'success',
            message: 'Точно. Чекорот е автоматски проверен.',
          });
        } else if (stepStatus === 'incorrect') {
          onDraftFeedbackChange({
            type: 'error',
            message: activeTask.hint
              ? `Неточно. Помош: ${activeTask.hint}`
              : 'Неточно. Обиди се повторно.',
          });
        } else {
          onDraftFeedbackChange({
            type: 'success',
            message: 'Одговорот е зачуван. Чекорот треба да го прегледа наставник.',
          });
        }
      } catch (error) {
        onDraftFeedbackChange({
          type: 'error',
          message: error.message || 'Нешто тргна наопаку. Обиди се повторно.',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const canAutoCheck =
      Array.isArray(activeTask.expectedAnswers) && activeTask.expectedAnswers.length > 0;

    if (!canAutoCheck) {
      onDraftFeedbackChange({
        type: 'success',
        message: 'Одговорот е зачуван. Оваа задача нема автоматска проверка.',
      });
      return;
    }

    const normalizeAnswer = (value) =>
      value.trim().toLowerCase().replace(/\s+/g, ' ');

    const isCorrect = activeTask.expectedAnswers.some(
      (answer) => normalizeAnswer(answer) === normalizeAnswer(currentAnswer)
    );

    if (!isCorrect) {
      onDraftFeedbackChange({
        type: 'error',
        message: activeTask.hint
          ? `Неточно. Помош: ${activeTask.hint}`
          : 'Неточно. Обиди се повторно.',
      });
      return;
    }

    onCompleteTask(activeTask.id);
    onDraftFeedbackChange({
      type: 'success',
      message: 'Точно. Задачата е означена како завршена.',
    });
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

  const handleFinishTask = async () => {
    if (isCompleted) {
      onDraftFeedbackChange({
        type: 'info',
        message: 'Оваа задача е веќе завршена.',
      });
      return;
    }

    const shouldFinish = window.confirm(
      'Дали си сигурен/на дека сакаш да ја завршиш задачата?'
    );

    if (!shouldFinish) {
      return;
    }

    if (usesBackendChecking && onSubmitAssignment) {
      setIsSubmitting(true);
      try {
        if (currentAnswer.trim() && currentAnswer !== currentStepAnswer?.answerText) {
          await onSaveStepAnswer(activeTask, currentAnswer);
        } else if (!activeTask.submission?.id && currentAnswer.trim()) {
          await onSaveStepAnswer(activeTask, currentAnswer);
        }
        await onSubmitAssignment(activeTask);
        onDraftFeedbackChange({
          type: 'success',
          message: 'Задачата е успешно предадена.',
        });
        onTaskCompleted(activeTask.id, nextTaskId);
      } catch (error) {
        onDraftFeedbackChange({
          type: 'error',
          message: error.message || 'Нешто тргна наопаку. Обиди се повторно.',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    onCompleteTask(activeTask.id);
    onDraftFeedbackChange({
      type: 'success',
      message: 'Задачата е означена како завршена.',
    });
    onTaskCompleted(activeTask.id, nextTaskId);
  };

  const handleHint = () => {
    onDraftFeedbackChange({
      type: 'info',
      message: activeTask.hint
        ? `Помош: ${activeTask.hint}`
        : 'Нема автоматска помош за оваа задача.',
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
          onFinishTask={handleFinishTask}
          onNextTask={handleNext}
          onSkipTask={handleSkip}
          onBackToDashboard={onBackToDashboard}
          isFinalTask={isFinalTask}
          isCheckDisabled={isCompleted || isSubmitting}
        />
      </main>
    </div>
  );
}

export default StudentWorkspacePage;
