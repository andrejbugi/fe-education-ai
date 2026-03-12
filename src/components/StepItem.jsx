function StepItem({ index, text, status }) {
  const isCorrect = status === 'correct';

  return (
    <li className="step-item">
      <span>
        {index}. {text}
      </span>
      <span className={`step-mark ${isCorrect ? 'success' : 'skipped'}`}>
        {isCorrect ? '✓' : '↷'}
      </span>
    </li>
  );
}

export default StepItem;
