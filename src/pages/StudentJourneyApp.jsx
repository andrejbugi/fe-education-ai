import { useMemo, useState } from 'react';
import StudentDashboardPage from './StudentDashboardPage';
import StudentWorkspacePage from './StudentWorkspacePage';
import StudentCalendarPage from './StudentCalendarPage';
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

function nextTaskFromList(tasks) {
  return (
    tasks.find((task) => task.status === TASK_STATUS.IN_PROGRESS) ||
    tasks.find((task) => task.status === TASK_STATUS.NOT_STARTED) ||
    tasks.find((task) => task.status === TASK_STATUS.SKIPPED) ||
    null
  );
}

function StudentJourneyApp() {
  const [theme, setTheme] = useState('light');
  const [activePage, setActivePage] = useState('dashboard');
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [activeTaskId, setActiveTaskId] = useState(MOCK_TASKS[0].id);
  const [taskDrafts, setTaskDrafts] = useState(() =>
    Object.fromEntries(
      MOCK_TASKS.map((task) => [task.id, { answer: '', feedback: null }])
    )
  );

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) || tasks[0],
    [activeTaskId, tasks]
  );
  const nextTask = useMemo(() => nextTaskFromList(tasks), [tasks]);

  const completedCount = tasks.filter(
    (task) => task.status === TASK_STATUS.DONE
  ).length;
  const overdueCount = tasks.filter((task) => task.dueCategory === 'overdue').length;
  const unreadCount = 2;
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

  const navigateToTask = (taskId) => {
    setActiveTaskId(taskId);
    setActivePage('workspace');
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

  const handleNavigate = (target) => {
    if (target === 'calendar') {
      setActivePage('calendar');
      return;
    }
    setActivePage('dashboard');
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

  const setTaskInProgress = (taskId) => {
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

  if (activePage === 'workspace' && activeTask) {
    return (
      <StudentWorkspacePage
        theme={theme}
        onToggleTheme={() =>
          setTheme((currentTheme) =>
            currentTheme === 'light' ? 'dark' : 'light'
          )
        }
        tasks={tasks}
        activeTask={activeTask}
        onBackToDashboard={() => setActivePage('dashboard')}
        onCompleteTask={completeTask}
        onSkipTask={skipTask}
        onNextTask={(taskId) => {
          setActiveTaskId(taskId);
          setTaskInProgress(taskId);
        }}
        getNextTaskId={getNextTaskId}
        draft={taskDrafts[activeTask.id]}
        onDraftAnswerChange={(answer) => updateTaskAnswer(activeTask.id, answer)}
        onDraftFeedbackChange={(feedback) =>
          updateTaskFeedback(activeTask.id, feedback)
        }
      />
    );
  }

  if (activePage === 'calendar') {
    return (
      <StudentCalendarPage
        theme={theme}
        onToggleTheme={() =>
          setTheme((currentTheme) =>
            currentTheme === 'light' ? 'dark' : 'light'
          )
        }
        onNavigate={handleNavigate}
        tasks={tasks}
        onOpenTask={navigateToTask}
      />
    );
  }

  return (
    <StudentDashboardPage
      theme={theme}
      onToggleTheme={() =>
        setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
      }
      onNavigate={handleNavigate}
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
      onOpenTask={navigateToTask}
    />
  );
}

export default StudentJourneyApp;
