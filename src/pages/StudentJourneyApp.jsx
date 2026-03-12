import { useEffect, useMemo, useRef, useState } from 'react';
import StudentDashboardPage from './StudentDashboardPage';
import StudentWorkspacePage from './StudentWorkspacePage';
import StudentCalendarPage from './StudentCalendarPage';
import StudentProfilePage from './StudentProfilePage';
import OnboardingPage from './OnboardingPage';
import LoginPage from './LoginPage';
import TaskDetailsPage from './TaskDetailsPage';
import TaskCompletionPage from './TaskCompletionPage';
import StudentNotificationsPage from './StudentNotificationsPage';
import { MOCK_TASKS, TASK_STATUS } from '../data/mockTasks';

const PROJECTS = [
  {
    title: 'Проект по информатика',
    note: 'Додади валидација на формата и кратка документација.',
    progress: 72,
  },
  {
    title: 'Истражување по биологија',
    note: 'Собери уште 2 извори и додади заклучок.',
    progress: 45,
  },
];

const TODAY_ITEMS = [
  '08:00 - Математика',
  'Домашна по биологија до 20:00',
  'Потсетник: подготви се за квиз по историја',
  'Провери коментар од наставник по англиски',
];

const ANNOUNCEMENTS = [
  'Нов коментар од наставник по математика',
  'Објавена оценка по англиски',
  'Промена во распоред за среда',
  'Нова домашна задача по историја',
];

const NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Нова домашна задача',
    detail: 'Додадена е домашна по математика.',
    time: 'Пред 10 мин.',
  },
  {
    id: 'n2',
    title: 'Коментар од наставник',
    detail: 'Провери ја забелешката за англиски.',
    time: 'Пред 1 час',
  },
  {
    id: 'n3',
    title: 'Објавена оценка',
    detail: 'Историја: 5',
    time: 'Вчера',
  },
  {
    id: 'n4',
    title: 'Потсетник за рок',
    detail: 'Рокот за проект по информатика е утре.',
    time: 'Вчера',
  },
];

const THEME_STORAGE_KEY = 'student-app-theme';
const SCHOOL_STORAGE_KEY = 'student-app-school';
const LOGGED_IN_STORAGE_KEY = 'student-app-logged-in';
const DEFAULT_SCHOOL = 'ОУ Гоце Делчев';
const SCHOOL_OPTIONS = [
  'ОУ Гоце Делчев',
  'ОУ Браќа Миладиновци',
  'ОУ Кочо Рацин',
  'Гимназија Никола Карев',
];

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function nextTaskFromList(tasks) {
  return (
    tasks.find((task) => task.status === TASK_STATUS.IN_PROGRESS) ||
    tasks.find((task) => task.status === TASK_STATUS.NOT_STARTED) ||
    tasks.find((task) => task.status === TASK_STATUS.SKIPPED) ||
    null
  );
}

function getInitialLoggedIn() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(LOGGED_IN_STORAGE_KEY) === 'true';
}

function normalizeDashboardNavTarget(target) {
  if (target === 'calendar' || target === 'profile' || target === 'notifications') {
    return target;
  }
  return 'dashboard';
}

function StudentJourneyApp() {
  const transitionTimeoutRef = useRef(null);

  const [theme, setTheme] = useState(getInitialTheme);
  const [loggedIn, setLoggedIn] = useState(getInitialLoggedIn);
  const [authStep, setAuthStep] = useState('onboarding');
  const [selectedRole, setSelectedRole] = useState('student');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [selectedSchool, setSelectedSchool] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SCHOOL;
    }
    return window.localStorage.getItem(SCHOOL_STORAGE_KEY) || DEFAULT_SCHOOL;
  });

  const [activePage, setActivePage] = useState('dashboard');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [activeTaskId, setActiveTaskId] = useState(MOCK_TASKS[0].id);
  const [completionContext, setCompletionContext] = useState(null);
  const [taskDrafts, setTaskDrafts] = useState(() =>
    Object.fromEntries(
      MOCK_TASKS.map((task) => [task.id, { answer: '', feedback: null }])
    )
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(LOGGED_IN_STORAGE_KEY, String(loggedIn));
  }, [loggedIn]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(SCHOOL_STORAGE_KEY, selectedSchool);
  }, [selectedSchool]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) || tasks[0],
    [activeTaskId, tasks]
  );
  const nextTask = useMemo(() => nextTaskFromList(tasks), [tasks]);

  const completedCount = tasks.filter(
    (task) => task.status === TASK_STATUS.DONE
  ).length;
  const overdueCount = tasks.filter((task) => task.dueCategory === 'overdue').length;
  const unreadCount = NOTIFICATIONS.length;
  const todayCount = tasks.filter((task) => task.dueCategory === 'today').length;
  const weeklyCount = tasks.length;
  const weeklyProgress = Math.round((completedCount / tasks.length) * 100);

  const quickStats = [
    { label: 'Денешни задачи', value: todayCount },
    { label: 'Задоцнети', value: overdueCount },
    { label: 'Непрочитани известувања', value: unreadCount },
    { label: 'Оваа недела', value: weeklyCount },
  ];

  const deadlines = tasks.map((task) => ({
    title: `${task.title} - ${task.subject}`,
    when: task.dueText,
    urgency:
      task.dueCategory === 'today'
        ? 'Денес'
        : task.dueCategory === 'tomorrow'
          ? 'Утре'
          : task.dueCategory === 'overdue'
            ? 'Задоцнето'
            : 'Наскоро',
  }));

  const transitionToPage = (nextPage) => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    setIsLoadingPage(true);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setActivePage(nextPage);
      setIsLoadingPage(false);
    }, 280);
  };

  const markTaskAsInProgressIfNeeded = (taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId &&
        (task.status === TASK_STATUS.NOT_STARTED ||
          task.status === TASK_STATUS.SKIPPED)
          ? { ...task, status: TASK_STATUS.IN_PROGRESS }
          : task
      )
    );
  };

  const openTaskDetails = (taskId) => {
    setActiveTaskId(taskId);
    transitionToPage('task-details');
  };

  const openWorkspace = (taskId) => {
    setActiveTaskId(taskId);
    markTaskAsInProgressIfNeeded(taskId);
    transitionToPage('workspace');
  };

  const handleNavigate = (target) => {
    transitionToPage(normalizeDashboardNavTarget(target));
  };

  const getNextTaskId = (fromTaskId) => {
    const currentIndex = tasks.findIndex((task) => task.id === fromTaskId);
    if (currentIndex === -1) {
      return null;
    }
    const nextTaskItem = tasks
      .slice(currentIndex + 1)
      .find(
        (task) =>
          task.status === TASK_STATUS.NOT_STARTED ||
          task.status === TASK_STATUS.IN_PROGRESS ||
          task.status === TASK_STATUS.SKIPPED
      );
    return nextTaskItem ? nextTaskItem.id : null;
  };

  const completeTask = (taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, status: TASK_STATUS.DONE } : task
      )
    );
  };

  const skipTask = (taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, status: TASK_STATUS.SKIPPED } : task
      )
    );
  };

  const updateTaskAnswer = (taskId, answer) => {
    setTaskDrafts((previous) => ({
      ...previous,
      [taskId]: {
        ...previous[taskId],
        answer,
      },
    }));
  };

  const updateTaskFeedback = (taskId, feedback) => {
    setTaskDrafts((previous) => ({
      ...previous,
      [taskId]: {
        ...previous[taskId],
        feedback,
      },
    }));
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const withLoadingOverlay = (content) => (
    <>
      {content}
      {isLoadingPage ? (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-spinner" />
          <p>Се вчитува...</p>
        </div>
      ) : null}
    </>
  );

  const handleAuthSubmit = () => {
    setLoggedIn(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setAuthStep('onboarding');
    setActivePage('dashboard');
    setAuthForm({ email: '', password: '' });
  };

  if (!loggedIn) {
    if (authStep === 'onboarding') {
      return withLoadingOverlay(
        <OnboardingPage
          theme={theme}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          onContinue={() => setAuthStep('login')}
        />
      );
    }

    if (authStep === 'login') {
      return withLoadingOverlay(
        <LoginPage
          theme={theme}
          role={selectedRole}
          email={authForm.email}
          password={authForm.password}
          selectedSchool={selectedSchool}
          schoolOptions={SCHOOL_OPTIONS}
          onEmailChange={(email) =>
            setAuthForm((previous) => ({ ...previous, email }))
          }
          onPasswordChange={(password) =>
            setAuthForm((previous) => ({ ...previous, password }))
          }
          onSelectSchool={setSelectedSchool}
          onSubmit={handleAuthSubmit}
          onBack={() => setAuthStep('onboarding')}
        />
      );
    }

    return withLoadingOverlay(
      <OnboardingPage
        theme={theme}
        selectedRole={selectedRole}
        onSelectRole={setSelectedRole}
        onContinue={() => setAuthStep('login')}
      />
    );
  }

  if (activePage === 'workspace' && activeTask) {
    return withLoadingOverlay(
      <StudentWorkspacePage
        theme={theme}
        onToggleTheme={toggleTheme}
        tasks={tasks}
        activeTask={activeTask}
        onBackToDashboard={() => transitionToPage('dashboard')}
        onCompleteTask={completeTask}
        onSkipTask={skipTask}
        onNextTask={openWorkspace}
        getNextTaskId={getNextTaskId}
        draft={taskDrafts[activeTask.id]}
        onDraftAnswerChange={(answer) => updateTaskAnswer(activeTask.id, answer)}
        onDraftFeedbackChange={(feedback) =>
          updateTaskFeedback(activeTask.id, feedback)
        }
        onTaskCompleted={(taskId, nextTaskId) => {
          setCompletionContext({ taskId, nextTaskId });
          transitionToPage('completion');
        }}
      />
    );
  }

  if (activePage === 'task-details' && activeTask) {
    return withLoadingOverlay(
      <TaskDetailsPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        task={activeTask}
        onStartTask={() => openWorkspace(activeTask.id)}
        onBack={() => transitionToPage('dashboard')}
      />
    );
  }

  if (activePage === 'completion' && completionContext) {
    return withLoadingOverlay(
      <TaskCompletionPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        task={tasks.find((item) => item.id === completionContext.taskId) || activeTask}
        hasNextTask={Boolean(completionContext.nextTaskId)}
        onNextTask={() => {
          if (completionContext.nextTaskId) {
            openWorkspace(completionContext.nextTaskId);
            return;
          }
          transitionToPage('dashboard');
        }}
        onBackHome={() => transitionToPage('dashboard')}
      />
    );
  }

  if (activePage === 'calendar') {
    return withLoadingOverlay(
      <StudentCalendarPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        tasks={tasks}
        onOpenTask={openTaskDetails}
      />
    );
  }

  if (activePage === 'notifications') {
    return withLoadingOverlay(
      <StudentNotificationsPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        notifications={NOTIFICATIONS}
      />
    );
  }

  if (activePage === 'profile') {
    return withLoadingOverlay(
      <StudentProfilePage
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        completedCount={completedCount}
        activeCount={
          tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS).length
        }
        overdueCount={overdueCount}
        totalTaskCount={tasks.length}
      />
    );
  }

  return withLoadingOverlay(
    <StudentDashboardPage
      theme={theme}
      onToggleTheme={toggleTheme}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      nextTask={nextTask}
      quickStats={quickStats}
      tasks={tasks}
      todayItems={TODAY_ITEMS}
      projects={PROJECTS}
      deadlines={deadlines}
      announcements={ANNOUNCEMENTS}
      completedCount={completedCount}
      weeklyProgress={weeklyProgress}
      average={4.6}
      onOpenTask={openTaskDetails}
    />
  );
}

export default StudentJourneyApp;
