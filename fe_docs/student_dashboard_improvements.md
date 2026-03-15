# Student Dashboard / Workspace Improvement Notes

## Goal
Improve the current student front-end prototype so it feels more like a real product workflow, even **without a backend**.

The student should be able to:
- open the dashboard
- click into a task/workspace
- move through multiple tasks
- understand what happens after finishing, skipping, or continuing work
- open a separate calendar page

---

## 1. Make the workspace functional from the dashboard

### Current issue
Only the dashboard is visible/openable.

### Improvement
Clicking a homework/task card from the dashboard should open a **student workspace view**.

### Expected behavior
- Student clicks a task from **Домашни задачи** or **Следно за тебе**
- App transitions to the workspace screen
- Workspace shows the selected assignment content
- This should work with **mock/local data only**, no backend required yet

### Suggested implementation idea
Use local React state or mock routes for now:
- Dashboard page
- Workspace page
- Calendar page

Example flow:
- `/` → dashboard
- `/workspace/:id` → assignment workspace
- `/calendar` → calendar page

---

## 2. Keep the workspace simpler than the main dashboard

### Recommendation
The workspace should **not** show the full main navigation like the dashboard.

The workspace should feel focused and distraction-free.

### Keep only minimal elements
Suggested top area in workspace:
- back button: **Назад**
- assignment title
- progress indicator
- optional theme toggle

### Avoid in workspace
Do not show full navbar items such as:
- Почетна
- Домашни
- Задачи
- Календар
- Известувања
- Профил

Reason:
The workspace should feel like a focused solving area, not a browsing page.

---

## 3. Add multiple mock tasks to simulate a real workflow

### Why
Right now a single screen is not enough to understand the student experience.

We should add several mock assignments/tasks so we can test transitions.

### Suggested sample tasks
Add 3–5 mock tasks such as:
- Математика – Реши равенка
- Физика – Избери точен одговор
- Македонски – Прочитај текст и одговори
- Историја – Кратко прашање
- Англиски – Пополни зборови

### Each mock task should have
- id
- subject
- title
- type
- short instructions
- status
- optional difficulty

Example statuses:
- не е започнато
- во тек
- завршено
- прескокнато

---

## 4. Simulate task progression

### Goal
Let the prototype demonstrate what happens after a student interacts with tasks.

### Recommended actions inside workspace
Add buttons such as:
- **Провери чекор**
- **Следна задача**
- **Прескокни**
- **Назад до контролна табла**

### Workflow ideas
#### If task is finished
- mark task as **завршено**
- automatically offer the next task
- optionally show a small success state:
  - **Задачата е завршена**
  - button: **Продолжи на следна задача**

#### If task is skipped
- mark task as **прескокнато**
- allow moving to the next available task
- dashboard should later show skipped tasks separately or with a distinct status badge

#### If task is in progress
- preserve a mock progress state
- allow returning later

---

## 5. Show sequence / progression clearly

### Recommended UI element
Inside the workspace, add a small task flow sidebar or top progress strip.

Example:
- Задача 1 of 4
- progress bar
- list of task states:
  - 1. Завршено
  - 2. Тековна
  - 3. Не е започнато
  - 4. Прескокнато

This helps visualize how the student moves through work.

---

## 6. Add a calendar page

### New page needed
Create a dedicated **Календар** page.

### Purpose
Show the student upcoming deadlines and school-related planning in a simple visual way.

### Suggested content
- monthly or weekly calendar view
- assignment deadlines
- quiz/test reminders
- project due dates
- highlighted today state

### Minimal MVP for now
Even without real calendar logic, the page can use mock events such as:
- Домашна по математика – Утре
- Квиз по англиски – Петок
- Проект по информатика – Следен вторник

### Useful extra section
On the calendar page also show:
- **Претстојни рокови**
- **Денешни активности**

---

## 7. Recommended front-end structure

### Suggested pages
- **Dashboard page** (`Контролна табла` / `Почетна`)
- **Workspace page** (`Работен простор`)
- **Calendar page** (`Календар`)

### Suggested component groups
#### Dashboard
- `StudentNavbar`
- `NextTaskCard`
- `StatsCards`
- `HomeworkList`
- `ProjectsList`
- `DeadlinesCard`
- `NotificationsCard`

#### Workspace
- `WorkspaceHeader`
- `TaskStepper` or `TaskProgress`
- `TaskCard`
- `TaskActionBar`
- `SuccessState`

#### Calendar
- `CalendarHeader`
- `CalendarGrid` or `CalendarMockView`
- `UpcomingDeadlines`
- `TodayAgenda`

---

## 8. UX recommendations

### Dashboard
- Keep it informative
- Let student quickly choose what to do next

### Workspace
- Keep it quiet and focused
- Minimize distractions
- Use larger content area
- Use clear next/skip/finish actions

### Calendar
- Keep it simple and readable
- Emphasize deadlines, not complexity

---

## 9. Important prototype objective
This phase is not only about visuals.
It should also demonstrate:
- navigation flow
- assignment transition flow
- how a student finishes one task and goes to another
- how skipped items appear
- how the workspace experience differs from the dashboard

This will make the prototype much more realistic before connecting the backend.

---

## 10. Recommended next implementation scope
Implement the following next:
1. Clickable task cards from dashboard to workspace
2. Mock workspace with 3–5 tasks
3. Next / skip / finish task behavior
4. Separate simplified workspace layout
5. Calendar page with mock events
6. Status updates reflected back on the dashboard

---

## 11. Suggested Macedonian labels
Use Macedonian labels in the UI, for example:
- Почетна
- Домашни задачи
- Задачи
- Календар
- Известувања
- Следно за тебе
- Денес
- Рокови
- Мој напредок
- Работен простор
- Следна задача
- Прескокни
- Провери чекор
- Завршено
- Во тек
- Не е започнато
- Прескокнато

---

## 12. Final recommendation
The key improvement is this:

**The prototype should behave like a mini student journey, not just a static dashboard.**

That means:
- student enters dashboard
- student opens a task
- student works in a focused workspace
- student finishes or skips
- system moves them forward
- dashboard and calendar help them understand what is next

