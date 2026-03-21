import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearningGamesPage from './LearningGamesPage';

test('learning games page uses backend card metadata and shows coming soon treatment', async () => {
  render(
    <LearningGamesPage
      theme="light"
      onToggleTheme={jest.fn()}
      onNavigate={jest.fn()}
      onLogout={jest.fn()}
      profile={{
        school: 'ОУ Браќа Миладиновци',
        fullName: 'Марија Стојанова',
        className: '7-A',
        initials: 'МС',
      }}
      availability={{
        availableNow: true,
        availableFrom: '00:00',
        availableUntil: '23:59',
        statusLabel: 'Достапно цел ден',
        helperText: 'Игри се достапни во текот на целиот ден.',
      }}
      games={[
        {
          gameKey: 'geometry_shapes',
          title: 'Геометрија',
          description: 'Препознај форми, агли и основни геометриски односи.',
          icon: '[]',
          statusLabel: 'Наскоро',
          difficulty: 'Лесно',
          category: 'geometry',
          routeSlug: 'geometry-shapes',
          comingSoon: true,
          isImplemented: false,
        },
        {
          gameKey: 'basic_math_speed',
          title: 'Брза математика',
          description: 'Решавај кратки математички задачи со брзо темпо.',
          icon: '123',
          statusLabel: 'Наскоро',
          difficulty: 'Лесно',
          category: 'math',
          routeSlug: 'basic-math-speed',
          comingSoon: true,
          isImplemented: false,
        },
      ]}
    />
  );

  expect(screen.getByText(/Игри се достапни во текот на целиот ден/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Наскоро/i).length).toBeGreaterThan(0);
  expect(screen.getByText('/geometry-shapes')).toBeInTheDocument();

  expect(
    screen.getByText(/Оваа игра е означена како „Наскоро“ во backend конфигурацијата/i)
  ).toBeInTheDocument();
  expect(screen.getByText(/Планиран slug: \/learning-games\/geometry-shapes/i)).toBeInTheDocument();
});

test('learning games page opens the geometry gameplay when geometry is implemented', async () => {
  render(
    <LearningGamesPage
      theme="light"
      onToggleTheme={jest.fn()}
      onNavigate={jest.fn()}
      onLogout={jest.fn()}
      profile={{
        school: 'ОУ Браќа Миладиновци',
        fullName: 'Марија Стојанова',
        className: '7-A',
        initials: 'МС',
      }}
      availability={{
        availableNow: true,
        availableFrom: '00:00',
        availableUntil: '23:59',
        statusLabel: 'Достапно цел ден',
        helperText: 'Игри се достапни во текот на целиот ден.',
      }}
      games={[
        {
          gameKey: 'geometry_shapes',
          title: 'Геометрија',
          description: 'Препознај форми, агли и основни геометриски односи.',
          icon: '[]',
          statusLabel: 'Достапно',
          difficulty: 'Средно',
          category: 'geometry',
          routeSlug: 'geometry-shapes',
          comingSoon: false,
          isImplemented: true,
          accent: 'geometry',
        },
        {
          gameKey: 'basic_math_speed',
          title: 'Брза математика',
          description: 'Решавај кратки математички задачи со брзо темпо.',
          icon: '123',
          statusLabel: 'Достапно',
          difficulty: 'Лесно',
          category: 'math',
          routeSlug: 'basic-math-speed',
          comingSoon: false,
          isImplemented: true,
          accent: 'math',
        },
      ]}
    />
  );

  expect(screen.getByText(/Геометрија совпаѓање/i)).toBeInTheDocument();
  expect(screen.getByText(/Поврзи го секој термин со неговата точна дефиниција/i)).toBeInTheDocument();
  expect(screen.getByText(/Совпаѓања 0\/6/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Триаголник/i }));
  await userEvent.click(screen.getByRole('button', { name: /Форма со 3 страни и 3 агли/i }));

  expect(screen.getByText(/„Триаголник“ е успешно поврзано/i)).toBeInTheDocument();
  expect(screen.getByText(/Совпаѓања 1\/6/i)).toBeInTheDocument();
});
