import { render } from '@testing-library/react';
import StudentCalendarPage from './StudentCalendarPage';

test('student calendar page renders weekly schedule slots and today agenda', () => {
  render(
    <StudentCalendarPage
      theme="light"
      onToggleTheme={jest.fn()}
      onNavigate={jest.fn()}
      onLogout={jest.fn()}
      profile={{
        school: 'ОУ Браќа Миладиновци',
        fullName: 'Мила Стојанова',
        className: '6-А',
        initials: 'МС',
      }}
      tasks={[
        {
          id: 'a1',
          subject: 'Математика',
          title: 'Домашна',
          dueText: 'Утре',
        },
      ]}
      onOpenTask={jest.fn()}
      scheduleSlots={[
        {
          id: 11,
          day_of_week: 'monday',
          period_number: 1,
          display_room_name: 'Кабинет 12',
          display_room_label: 'A-12',
          subject: { id: 2, name: 'Историја' },
          teacher: { id: 7, full_name: 'Јана Петрова' },
          classroom: { id: 3, name: '6-А' },
        },
      ]}
    />
  );

  expect(document.body).toHaveTextContent('Неделен распоред');
  expect(document.body).toHaveTextContent('Историја');
  expect(document.body).toHaveTextContent('Јана Петрова');
  expect(document.body).toHaveTextContent('Претстојни рокови');
});
