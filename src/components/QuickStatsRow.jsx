import StatCard from './StatCard';

function QuickStatsRow({ stats }) {
  return (
    <section className="quick-stats-row" aria-label="Брзи статистики">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </section>
  );
}

export default QuickStatsRow;
