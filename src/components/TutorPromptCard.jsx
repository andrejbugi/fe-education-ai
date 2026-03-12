function TutorPromptCard({ prompt }) {
  return (
    <section className="card tutor-card">
      <h2 className="card-title">Tutor</h2>
      <p className="tutor-prompt">{prompt}</p>
    </section>
  );
}

export default TutorPromptCard;
