function FeedbackBox({ feedback }) {
  const message =
    feedback.message || 'Submit a step to receive immediate tutor feedback.';
  const type = feedback.type || 'neutral';

  return (
    <section className={`card feedback-box ${type}`}>
      <h2 className="card-title">Feedback</h2>
      <p>{message}</p>
    </section>
  );
}

export default FeedbackBox;
