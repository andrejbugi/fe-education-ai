function SuccessState({ message, onContinue, hasNextTask }) {
  return (
    <section className="workspace-card success-card">
      <h2 className="section-title">Статус</h2>
      <p>{message}</p>
      <button type="button" className="btn btn-primary" onClick={onContinue}>
        {hasNextTask ? 'Продолжи на следна задача' : 'Назад на контролна табла'}
      </button>
    </section>
  );
}

export default SuccessState;
