const WEEK_DAYS = ['Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб', 'Нед'];

const CALENDAR_DAYS = [
  { day: 10, event: '' },
  { day: 11, event: '' },
  { day: 12, event: 'Домашна математика' },
  { day: 13, event: '' },
  { day: 14, event: 'Квиз англиски' },
  { day: 15, event: '' },
  { day: 16, event: '' },
  { day: 17, event: '' },
  { day: 18, event: 'Проект информатика' },
  { day: 19, event: '' },
  { day: 20, event: '' },
  { day: 21, event: '' },
  { day: 22, event: '' },
  { day: 23, event: '' },
];

function CalendarMockView() {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Календар</h2>
      <div className="calendar-weekdays">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {CALENDAR_DAYS.map((item) => (
          <article
            key={item.day}
            className={`calendar-cell ${item.day === 12 ? 'today' : ''}`}
          >
            <p>{item.day}</p>
            {item.event ? <small>{item.event}</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default CalendarMockView;
