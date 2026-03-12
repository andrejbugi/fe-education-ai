function ProblemCard({ problem }) {
  return (
    <section className="card">
      <h2 className="card-title">Solve the equation:</h2>
      <p className="equation">{problem}</p>
    </section>
  );
}

export default ProblemCard;
