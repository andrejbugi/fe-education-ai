import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProblemCard from '../components/ProblemCard';
import TutorPromptCard from '../components/TutorPromptCard';
import StepInputCard from '../components/StepInputCard';
import FeedbackBox from '../components/FeedbackBox';
import StepHistory from '../components/StepHistory';

const STEP_FLOW = [
  {
    id: 1,
    expected: '3x = 15',
    prompt: 'Think about isolating x. What should be the first step?',
    hint: 'Subtract 5 from both sides first.',
    success: 'Correct. You subtracted 5 from both sides.',
  },
  {
    id: 2,
    expected: 'x = 5',
    prompt: 'Good. Now divide both sides by 3.',
    hint: 'From 3x = 15, divide both sides by 3.',
    success: 'Correct. You divided both sides by 3.',
  },
];

function normalizeValue(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function StudentWorkspace() {
  const [problem] = useState('3x + 5 = 20');
  const [theme, setTheme] = useState('light');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState([]);
  const [hasCheckedCurrentStep, setHasCheckedCurrentStep] = useState(false);
  const [feedback, setFeedback] = useState({ type: 'neutral', message: '' });
  const [stepInput, setStepInput] = useState('');
  const totalSteps = STEP_FLOW.length;
  const isCompleted = currentStepIndex >= totalSteps;
  const activeStep = isCompleted ? null : STEP_FLOW[currentStepIndex];
  const solvedCount = steps.filter((step) => step.status === 'correct').length;

  const tutorPrompt = useMemo(() => {
    if (isCompleted) {
      if (solvedCount === totalSteps) {
        return 'Great work. You completed every step correctly.';
      }
      return 'Session complete. Review the history and retry for full accuracy.';
    }
    return activeStep.prompt;
  }, [activeStep, isCompleted, solvedCount, totalSteps]);

  const handleCheckStep = (event) => {
    event.preventDefault();
    if (isCompleted || !activeStep) {
      return;
    }

    if (!stepInput.trim()) {
      setFeedback({
        type: 'warning',
        message: 'Please enter your next step before checking.',
      });
      return;
    }

    if (normalizeValue(stepInput) === normalizeValue(activeStep.expected)) {
      setSteps((previousSteps) => [
        ...previousSteps,
        { stepNumber: activeStep.id, text: activeStep.expected, status: 'correct' },
      ]);
      setFeedback({
        type: 'success',
        message: activeStep.success,
      });
      setCurrentStepIndex((previousIndex) => previousIndex + 1);
      setHasCheckedCurrentStep(false);
      setStepInput('');
      return;
    }

    setHasCheckedCurrentStep(true);
    setFeedback({
      type: 'error',
      message: `Not quite. Hint: ${activeStep.hint}`,
    });
  };

  const handleHint = () => {
    if (isCompleted || !activeStep) {
      setFeedback({
        type: 'info',
        message: 'Review your steps or start a new attempt.',
      });
      return;
    }

    setFeedback({
      type: 'info',
      message: `Hint: ${activeStep.hint}`,
    });
  };

  const handleSkip = () => {
    if (isCompleted || !activeStep || hasCheckedCurrentStep) {
      return;
    }

    setSteps((previousSteps) => [
      ...previousSteps,
      {
        stepNumber: activeStep.id,
        text: `Step ${activeStep.id} skipped`,
        status: 'skipped',
      },
    ]);
    setFeedback({
      type: 'info',
      message: 'Step skipped. Try the next step when you are ready.',
    });
    setCurrentStepIndex((previousIndex) => previousIndex + 1);
    setHasCheckedCurrentStep(false);
    setStepInput('');
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setSteps([]);
    setHasCheckedCurrentStep(false);
    setStepInput('');
    setFeedback({
      type: 'neutral',
      message: 'New attempt started. Solve step by step.',
    });
  };

  const handleReview = () => {
    setFeedback({
      type: 'info',
      message: 'Review complete. Compare each step with the expected transformation.',
    });
  };

  const currentStepDisplay = isCompleted ? totalSteps : currentStepIndex + 1;

  return (
    <div className={`theme-root theme-${theme}`}>
      <Navbar
        theme={theme}
        onToggleTheme={() =>
          setTheme((previousTheme) =>
            previousTheme === 'light' ? 'dark' : 'light'
          )
        }
      />
      <main className="app-shell">
        <div className="workspace">
          <Header
            subject="Math"
            topic="Linear Equations"
            currentStep={currentStepDisplay}
            totalSteps={totalSteps}
            isCompleted={isCompleted}
          />
          <ProblemCard problem={problem} />
          <TutorPromptCard prompt={tutorPrompt} />
          <StepInputCard
            stepInput={stepInput}
            onStepInputChange={(event) => setStepInput(event.target.value)}
            onCheckStep={handleCheckStep}
            onHint={handleHint}
            onSkip={handleSkip}
            isSkipDisabled={isCompleted || hasCheckedCurrentStep}
            isInputDisabled={isCompleted}
          />
          {isCompleted ? (
            <section
              className={`card completion-card ${solvedCount === totalSteps ? 'success' : 'info'}`}
            >
              <h2 className="card-title">
                {solvedCount === totalSteps
                  ? 'Great work! You solved the equation.'
                  : 'Exercise complete'}
              </h2>
              <p>
                {solvedCount === totalSteps
                  ? 'You completed each step correctly.'
                  : 'Some steps were skipped. Review and try again to solve every step.'}
              </p>
              <div className="completion-actions">
                <button type="button" className="btn primary-btn" onClick={handleReset}>
                  Try another problem
                </button>
                <button type="button" className="btn secondary-btn" onClick={handleReview}>
                  Review steps
                </button>
              </div>
            </section>
          ) : null}
          <FeedbackBox feedback={feedback} />
          <StepHistory steps={steps} totalSteps={totalSteps} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default StudentWorkspace;
