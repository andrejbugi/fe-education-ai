import { useMemo, useState } from 'react';

const WEEKDAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const FULL_DAY_NAMES = [...WEEKDAY_NAMES, 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Пон',
  tuesday: 'Вто',
  wednesday: 'Сре',
  thursday: 'Чет',
  friday: 'Пет',
  saturday: 'Саб',
  sunday: 'Нед',
};

function startOfWeek(date) {
  const normalized = new Date(date);
  const dayIndex = normalized.getDay();
  const distanceFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  normalized.setHours(0, 0, 0, 0);
  normalized.setDate(normalized.getDate() - distanceFromMonday);
  return normalized;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDayOffset(dayName) {
  const index = FULL_DAY_NAMES.indexOf(String(dayName || '').toLowerCase());
  return index >= 0 ? index : 0;
}

function getDateKey(date) {
  const normalized = new Date(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWeekLabel(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();

  if (sameMonth) {
    return `${weekStart.toLocaleDateString('mk-MK', {
      day: 'numeric',
    })} - ${weekEnd.toLocaleDateString('mk-MK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  }

  return `${weekStart.toLocaleDateString('mk-MK', {
    day: 'numeric',
    month: 'short',
  })} - ${weekEnd.toLocaleDateString('mk-MK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function formatDayHeading(date, dayName) {
  return {
    shortLabel: DAY_LABELS[dayName] || dayName,
    dateLabel: date.toLocaleDateString('mk-MK', {
      day: 'numeric',
      month: 'short',
    }),
  };
}

function getRoomLabel(slot) {
  const roomName = String(slot?.display_room_name || '').trim();
  const roomLabel = String(slot?.display_room_label || '').trim();

  if (roomName && roomLabel && roomName !== roomLabel) {
    return `${roomName} · ${roomLabel}`;
  }

  return roomName || roomLabel || 'Без просторија';
}

function getSlotMeta(slot, viewer) {
  if (viewer === 'teacher') {
    return slot?.classroom?.name || 'Паралелка';
  }

  return slot?.teacher?.full_name || 'Наставник';
}

export function buildTodayScheduleAgendaItems(slots = [], viewer = 'student', date = new Date()) {
  const todayName = FULL_DAY_NAMES[(date.getDay() + 6) % 7];

  return slots
    .filter((slot) => String(slot?.day_of_week || '').toLowerCase() === todayName)
    .sort((left, right) => Number(left?.period_number || 0) - Number(right?.period_number || 0))
    .map((slot) => ({
      id: String(slot?.id || `${todayName}-${slot?.period_number}`),
      title: `${slot?.period_number}. ${slot?.subject?.name || 'Час'}`,
      detail: [getSlotMeta(slot, viewer), getRoomLabel(slot)].filter(Boolean).join(' · '),
    }));
}

function WeeklyScheduleCalendar({
  title = 'Неделен распоред',
  description = '',
  slots = [],
  viewer = 'student',
  emptyText = 'Нема часови за оваа недела.',
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const now = useMemo(() => new Date(), []);
  const todayKey = getDateKey(now);
  const hasWeekendSlots = useMemo(
    () =>
      slots.some((slot) => ['saturday', 'sunday'].includes(String(slot?.day_of_week || '').toLowerCase())),
    [slots]
  );
  const dayNames = hasWeekendSlots ? FULL_DAY_NAMES : WEEKDAY_NAMES;
  const weekDays = useMemo(
    () =>
      dayNames.map((dayName) => {
        const date = addDays(weekStart, getDayOffset(dayName));
        return {
          dayName,
          date,
          dateKey: getDateKey(date),
          ...formatDayHeading(date, dayName),
        };
      }),
    [dayNames, weekStart]
  );
  const maxPeriod = useMemo(() => {
    const highestPeriod = slots.reduce(
      (maximum, slot) => Math.max(maximum, Number(slot?.period_number || 0)),
      0
    );
    return Math.max(highestPeriod, 7);
  }, [slots]);
  const periods = useMemo(
    () => Array.from({ length: maxPeriod }, (_, index) => index + 1),
    [maxPeriod]
  );
  const slotMap = useMemo(() => {
    const nextMap = new Map();

    slots.forEach((slot) => {
      const dayName = String(slot?.day_of_week || '').toLowerCase();
      const periodNumber = Number(slot?.period_number || 0);
      const key = `${dayName}-${periodNumber}`;

      if (!nextMap.has(key)) {
        nextMap.set(key, []);
      }

      nextMap.get(key).push(slot);
    });

    return nextMap;
  }, [slots]);

  return (
    <section className="weekly-schedule-shell">
      <div className="weekly-schedule-header">
        <div>
          <p className="weekly-schedule-eyebrow">Недела</p>
          <h2>{title}</h2>
          {description ? <p className="weekly-schedule-description">{description}</p> : null}
        </div>
        <div className="weekly-schedule-actions">
          <button
            type="button"
            className="weekly-schedule-nav"
            onClick={() => setWeekStart((current) => addDays(current, -7))}
          >
            Претходна
          </button>
          <button
            type="button"
            className="weekly-schedule-nav weekly-schedule-nav-current"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Оваа недела
          </button>
          <button
            type="button"
            className="weekly-schedule-nav"
            onClick={() => setWeekStart((current) => addDays(current, 7))}
          >
            Следна
          </button>
        </div>
      </div>

      <div className="weekly-schedule-range">{formatWeekLabel(weekStart)}</div>

      {slots.length === 0 ? (
        <p className="empty-state weekly-schedule-empty">{emptyText}</p>
      ) : (
        <div className="weekly-schedule-scroll">
          <div
            className="weekly-schedule-grid"
            style={{
              gridTemplateColumns: `88px repeat(${weekDays.length}, minmax(180px, 1fr))`,
            }}
          >
            <div className="weekly-schedule-corner">Час</div>
            {weekDays.map((day) => (
              <div
                key={day.dayName}
                className={`weekly-schedule-day-head ${day.dateKey === todayKey ? 'is-today' : ''}`}
              >
                <strong>{day.shortLabel}</strong>
                <span>{day.dateLabel}</span>
              </div>
            ))}

            {periods.map((period) => (
              <FragmentRow
                key={period}
                period={period}
                weekDays={weekDays}
                slotMap={slotMap}
                todayKey={todayKey}
                viewer={viewer}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FragmentRow({ period, weekDays, slotMap, todayKey, viewer }) {
  return (
    <>
      <div className="weekly-schedule-period">
        <span>{period}</span>
        <small>час</small>
      </div>
      {weekDays.map((day) => {
        const entries = slotMap.get(`${day.dayName}-${period}`) || [];
        return (
          <div
            key={`${day.dayName}-${period}`}
            className={`weekly-schedule-cell ${day.dateKey === todayKey ? 'is-today' : ''}`}
          >
            {entries.length === 0 ? (
              <span className="weekly-schedule-cell-empty">-</span>
            ) : (
              <div className="weekly-schedule-slot-stack">
                {entries.map((slot) => (
                  <article key={slot.id || `${day.dayName}-${period}`} className="weekly-schedule-slot">
                    <strong>{slot?.subject?.name || 'Час'}</strong>
                    <p>{getSlotMeta(slot, viewer)}</p>
                    <span>{getRoomLabel(slot)}</span>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default WeeklyScheduleCalendar;
