const SCHOOLS = [
  'ОУ Гоце Делчев',
  'ОУ Браќа Миладиновци',
  'ОУ Кочо Рацин',
  'Гимназија Никола Карев',
];

function SchoolSelectionPage({
  theme,
  selectedSchool,
  onSelectSchool,
  onContinue,
  onBack,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onContinue();
  };

  return (
    <main className={`auth-root theme-${theme}`}>
      <section className="auth-card">
        <button type="button" className="back-link" onClick={onBack}>
          Назад
        </button>
        <p className="auth-eyebrow">Поставување</p>
        <h1>Одбери училиште</h1>
        <p className="auth-help">Овој чекор е достапен за наставничкиот демо-тек.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Училиште
            <select
              value={selectedSchool}
              onChange={(event) => onSelectSchool(event.target.value)}
            >
              {SCHOOLS.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-primary auth-submit">
            Продолжи
          </button>
        </form>
      </section>
    </main>
  );
}

export default SchoolSelectionPage;
