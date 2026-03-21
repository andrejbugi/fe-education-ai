export const QUIZ_GAMES_WINDOW = {
  availableFrom: '00:00',
  availableUntil: '23:59',
};

const DAILY_QUIZ_BANK = [
  {
    key: 'skopje-capital',
    category: 'geography',
    body: 'Кој град е главен град на Македонија?',
    answerOptions: ['Битола', 'Скопје', 'Охрид', 'Куманово'],
    correctAnswer: 'Скопје',
    explanation: 'Скопје е главен град и најголем град во Македонија.',
  },
  {
    key: 'samoil-period',
    category: 'history',
    body: 'Во кој век владеел Цар Самоил?',
    answerOptions: ['8 век', '10 и почеток на 11 век', '13 век', '15 век'],
    correctAnswer: '10 и почеток на 11 век',
    explanation: 'Цар Самоил владеел кон крајот на 10 век и почетокот на 11 век.',
  },
  {
    key: 'ohrid-lake',
    category: 'geography',
    body: 'На кое езеро се наоѓа градот Охрид?',
    answerOptions: ['Дојранско Езеро', 'Охридско Езеро', 'Преспанско Езеро', 'Тиквешко Езеро'],
    correctAnswer: 'Охридско Езеро',
    explanation: 'Охрид е град на брегот на Охридското Езеро.',
  },
  {
    key: 'krusevo-manifest',
    category: 'history',
    body: 'Со кое историско востание е поврзан Крушевскиот манифест?',
    answerOptions: ['Разловечко востание', 'Илинденско востание', 'Карпошово востание', 'Прилепско востание'],
    correctAnswer: 'Илинденско востание',
    explanation: 'Крушевскиот манифест е поврзан со Илинденското востание од 1903 година.',
  },
  {
    key: 'pelister-location',
    category: 'geography',
    body: 'Во близина на кој град се наоѓа Пелистер?',
    answerOptions: ['Струмица', 'Битола', 'Штип', 'Кичево'],
    correctAnswer: 'Битола',
    explanation: 'Пелистер е планина и национален парк во близина на Битола.',
  },
  {
    key: 'goce-delcev',
    category: 'history',
    body: 'Кој револуционер е поврзан со ВМРО и борбата за слобода на Македонија?',
    answerOptions: ['Гоце Делчев', 'Марко Цепенков', 'Коста Рацин', 'Кузман Шапкарев'],
    correctAnswer: 'Гоце Делчев',
    explanation: 'Гоце Делчев е една од најзначајните личности во македонското револуционерно движење.',
  },
];

const LEARNING_GAMES = [
  {
    gameKey: 'basic_math_speed',
    title: 'Брза математика',
    description: 'Решавај кратки математички задачи во 5 брзи рунди.',
    accent: 'math',
    iconKey: 'math',
    icon: '123',
    difficulty: 'Лесно',
    isImplemented: true,
    metadata: {
      category: 'math',
      difficulty: 'easy',
      route_slug: 'basic-math-speed',
      coming_soon: false,
    },
  },
  {
    gameKey: 'geometry_shapes',
    title: 'Геометрија',
    description: 'Препознај форми, агли и просторни односи.',
    accent: 'geometry',
    iconKey: 'shapes',
    icon: '[]',
    difficulty: 'Средно',
    isImplemented: true,
    metadata: {
      category: 'geometry',
      difficulty: 'medium',
      route_slug: 'geometry-shapes',
      coming_soon: false,
    },
  },
  {
    gameKey: 'logic_patterns',
    title: 'Логички шеми',
    description: 'Погоди го следниот чекор во низа и вежбај логика.',
    accent: 'logic',
    iconKey: 'patterns',
    icon: '<>',
    difficulty: 'Средно',
    isImplemented: true,
    metadata: {
      category: 'logic',
      difficulty: 'medium',
      route_slug: 'logic-patterns',
      coming_soon: false,
    },
  },
  {
    gameKey: 'memory_pairs',
    title: 'Меморија',
    description: 'Поврзи парови и тренирај внимание и концентрација.',
    accent: 'memory',
    iconKey: 'memory',
    icon: 'OO',
    difficulty: 'Лесно',
    isImplemented: true,
    metadata: {
      category: 'logic',
      difficulty: 'easy',
      route_slug: 'memory-pairs',
      coming_soon: false,
    },
  },
];

function toMinutes(timeValue) {
  const [hours, minutes] = String(timeValue || '00:00')
    .split(':')
    .map((part) => Number(part));

  return (hours || 0) * 60 + (minutes || 0);
}

function hashDateKey(dateKey) {
  return Array.from(String(dateKey || '')).reduce(
    (sum, character, index) => sum + character.charCodeAt(0) * (index + 1),
    0
  );
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatQuizCategoryLabel(category) {
  if (category === 'history') {
    return 'Историја';
  }

  return 'Географија';
}

export function formatGameDifficultyLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'easy') {
    return 'Лесно';
  }
  if (normalized === 'medium') {
    return 'Средно';
  }
  if (normalized === 'hard') {
    return 'Тешко';
  }

  return value || 'Нема';
}

export function formatGameCategoryLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'math') {
    return 'Математика';
  }
  if (normalized === 'geometry') {
    return 'Геометрија';
  }
  if (normalized === 'logic') {
    return 'Логика';
  }
  if (normalized === 'memory') {
    return 'Меморија';
  }

  return value || 'Игра';
}

export function getGameIconGlyph(iconKey, fallbackIcon = '::') {
  const normalized = String(iconKey || '').trim().toLowerCase();

  if (normalized === 'math') {
    return '123';
  }
  if (normalized === 'shapes') {
    return '[]';
  }
  if (normalized === 'memory') {
    return 'OO';
  }
  if (normalized === 'patterns') {
    return '<>';
  }

  return fallbackIcon;
}

export function getDailyQuizAvailability() {
  return {
    availableNow: true,
    availableFrom: '00:00',
    availableUntil: '23:59',
    statusLabel: 'Достапно цел ден',
    helperText: 'Квизот е достапен во текот на целиот ден.',
  };
}

export function getLearningGamesAvailability(date = new Date()) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const availableFromMinutes = toMinutes(QUIZ_GAMES_WINDOW.availableFrom);
  const availableUntilMinutes = toMinutes(QUIZ_GAMES_WINDOW.availableUntil);
  const availableNow =
    currentMinutes >= availableFromMinutes && currentMinutes < availableUntilMinutes;

  return {
    availableNow,
    availableFrom: QUIZ_GAMES_WINDOW.availableFrom,
    availableUntil: QUIZ_GAMES_WINDOW.availableUntil,
    statusLabel: availableNow ? 'Достапно цел ден' : 'Сега е затворено',
    helperText: availableNow
      ? 'Игри се достапни во текот на целиот ден.'
      : `Достапно од ${QUIZ_GAMES_WINDOW.availableFrom} до ${QUIZ_GAMES_WINDOW.availableUntil}`,
  };
}

export function getDailyQuizForDate(date = new Date()) {
  const dateKey = getLocalDateKey(date);
  const question = DAILY_QUIZ_BANK[hashDateKey(dateKey) % DAILY_QUIZ_BANK.length];

  return {
    id: `${dateKey}-${question.key}`,
    date: dateKey,
    title: 'Квиз на денот',
    rewardXp: 1,
    ...question,
  };
}

export function getLearningGamesCatalog(date = new Date()) {
  const availability = getLearningGamesAvailability(date);

  return LEARNING_GAMES.map((game, index) => ({
    ...game,
    position: index + 1,
    isEnabled: true,
    routeSlug: game.metadata?.route_slug || '',
    category: game.metadata?.category || game.accent || 'logic',
    comingSoon: Boolean(game.metadata?.coming_soon),
    statusLabel: game.metadata?.coming_soon
      ? 'Наскоро'
      : game.isImplemented
        ? availability.availableNow
          ? 'Достапно'
          : 'Затворено'
        : 'Наскоро',
  }));
}
