import { useMemo, useState } from 'react';
import WorkspaceHeader from '../components/WorkspaceHeader';
import TaskProgress from '../components/TaskProgress';
import TaskCard from '../components/TaskCard';
import TaskSolveCard from '../components/TaskSolveCard';
import TaskActionBar from '../components/TaskActionBar';
import AiTutorSidebar from '../components/AiTutorSidebar';
import { TASK_STATUS } from '../data/mockTasks';

function isReadOnlySubmissionStatus(status) {
  return ['submitted', 'reviewed', 'late', 'completed'].includes(
    String(status || '')
      .trim()
      .toLowerCase()
  );
}

function StudentWorkspacePage({
  theme,
  onToggleTheme,
  tasks,
  activeTask,
  onBackToDetails,
  onBackToDashboard,
  onCompleteTask,
  onSkipTask,
  onNextTask,
  onGoToNextStep,
  onSelectStep,
  getNextTaskId,
  draft,
  onDraftAnswerChange,
  onDraftFeedbackChange,
  onTaskCompleted,
  onSaveStepAnswer,
  onSubmitAssignment,
  aiTutor,
  onOpenAiTutor,
  onCloseAiTutor,
  onSendAiTutorMessage,
}) {
  const nextTaskId = useMemo(() => getNextTaskId(activeTask.id), [
    activeTask.id,
    getNextTaskId,
  ]);
  const isFinalTask = !nextTaskId;
  const isCompleted =
    activeTask.status === TASK_STATUS.DONE ||
    isReadOnlySubmissionStatus(activeTask.submission?.status) ||
    Boolean(activeTask.submission?.submittedAt);
  const readOnlyMessage =
    activeTask.submission?.status === 'late' || activeTask.submission?.late
      ? 'Оваа задача е предадена со доцнење и е заклучена за измени.'
      : isReadOnlySubmissionStatus(activeTask.submission?.status) || activeTask.submission?.submittedAt
        ? 'Оваа задача е веќе предадена и е заклучена за измени.'
        : 'Оваа задача е веќе завршена.';
  const currentFeedback = draft?.feedback || null;
  const totalSteps = Array.isArray(activeTask.steps) ? activeTask.steps.length : 0;
  const currentStep = activeTask.currentStep || activeTask.steps?.[0] || null;
  const currentStepIndex =
    Array.isArray(activeTask.steps) && currentStep
      ? activeTask.steps.findIndex((step) => String(step.id) === String(currentStep.id))
      : -1;
  const isLastStep = currentStepIndex < 0 || currentStepIndex === totalSteps - 1;
  const currentStepAnswer = activeTask.submission?.stepAnswers?.find(
    (stepAnswer) => String(stepAnswer.assignmentStepId) === String(currentStep?.id)
  );
  const currentAnswer =
    draft?.stepId === currentStep?.id ? draft?.answer || '' : currentStepAnswer?.answerText || '';
  const usesBackendChecking = Boolean(onSaveStepAnswer && currentStep?.id);
  const isManualEvaluation = currentStep?.evaluationMode === 'manual';
  const aiAssistancesUsed =
    aiTutor?.session?.messages?.filter(
      (message) => message.role === 'user' && message.messageType === 'question'
    ).length || 0;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveCurrentStep = async ({ showCheckMessage }) => {
    if (isCompleted) {
      onDraftFeedbackChange({
        type: 'info',
        message: readOnlyMessage,
      });
      return null;
    }

    if (!currentAnswer.trim()) {
      onDraftFeedbackChange({
        type: 'warning',
        message: 'Внеси одговор пред да продолжиш.',
      });
      return null;
    }

    if (usesBackendChecking) {
      setIsSubmitting(true);
      try {
        const result = await onSaveStepAnswer(activeTask, currentAnswer);
        const stepStatus = result?.stepAnswer?.status;
        if (!showCheckMessage) {
          onDraftFeedbackChange({
            type: stepStatus === 'incorrect' ? 'error' : 'success',
            message:
              stepStatus === 'correct'
                ? 'Одговорот е зачуван. Чекорот е точен.'
                : stepStatus === 'incorrect'
                  ? 'Одговорот е зачуван. Провери го резултатот пред да продолжиш.'
                  : isManualEvaluation
                    ? 'Одговорот е зачуван. Чекорот чека преглед од наставник.'
                    : 'Одговорот е зачуван.',
          });
        } else if (stepStatus === 'correct') {
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
        } else if (isManualEvaluation) {
          onDraftFeedbackChange({
            type: 'success',
            message: 'Одговорот е зачуван. Чекорот треба да го прегледа наставник.',
          });
        } else {
          onDraftFeedbackChange({
            type: 'info',
            message: 'Одговорот е зачуван. Автоматската проверка не врати резултат.',
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
      return true;
    }

    const canAutoCheck =
      Array.isArray(activeTask.expectedAnswers) && activeTask.expectedAnswers.length > 0;

    if (!canAutoCheck) {
      onDraftFeedbackChange({
        type: 'success',
        message: showCheckMessage
          ? 'Одговорот е зачуван. Оваа задача нема автоматска проверка.'
          : 'Одговорот е зачуван.',
      });
      return true;
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
      return false;
    }

    onCompleteTask(activeTask.id);
    onDraftFeedbackChange({
      type: 'success',
      message: 'Точно. Задачата е означена како завршена.',
    });
    return true;
  };

  const handleCheckStep = async () => {
    await saveCurrentStep({ showCheckMessage: true });
  };

  const handleSaveProgress = async () => {
    await saveCurrentStep({ showCheckMessage: false });
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
    if (!isLastStep) {
      onGoToNextStep?.();
      return;
    }
    onDraftFeedbackChange({
      type: 'info',
      message: 'Го достигна последниот чекор. Поднеси ја задачата кога ќе бидеш подготвен/а.',
    });
  };

  const handleFinishTask = async () => {
    if (isCompleted) {
      onDraftFeedbackChange({
        type: 'info',
        message: readOnlyMessage,
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
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onBack={onBackToDetails || onBackToDashboard}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <div className="workspace-grid">
          <TaskProgress
            steps={activeTask.steps}
            currentStepId={currentStep?.id}
            submission={activeTask.submission}
            onSelectStep={onSelectStep}
          />
          <TaskCard task={activeTask} />
        </div>

        <TaskSolveCard
          task={activeTask}
          inputValue={currentAnswer}
          onInputChange={onDraftAnswerChange}
          onHint={handleHint}
          onAiTutorOpen={() => onOpenAiTutor?.(activeTask)}
          aiAssistancesUsed={aiAssistancesUsed}
          aiAssistancesMax={3}
          feedback={currentFeedback}
          isCompleted={isCompleted}
        />

        <TaskActionBar
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onCheckStep={handleCheckStep}
          onSaveProgress={handleSaveProgress}
          onFinishTask={handleFinishTask}
          onNextStep={handleNext}
          isCheckDisabled={isCompleted || isSubmitting}
          isSaveDisabled={isCompleted || isSubmitting}
          isNextDisabled={isCompleted || isSubmitting || isLastStep}
          isSubmitDisabled={isCompleted || isSubmitting}
        />
      </main>
      <AiTutorSidebar
        isOpen={Boolean(aiTutor?.open)}
        onClose={() => onCloseAiTutor?.(activeTask.id)}
        onSendMessage={(message) => onSendAiTutorMessage?.(activeTask, message)}
        currentStep={currentStep}
        session={aiTutor?.session || null}
        loading={Boolean(aiTutor?.loading)}
        error={aiTutor?.error || ''}
        maxAssistances={3}
      />
    </div>
  );
}

export default StudentWorkspacePage;
