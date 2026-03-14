# Teacher View + Role Split Instructions

## Goal
Improve the front-end prototype so the app supports two different user experiences:

1. `Ученик`
2. `Наставник`

The login flow should decide which view to show.
This is still front-end only, with mock data and mock role logic.

---

## 1. Add role-based front-end flow

### Required behavior
After login, the app should determine whether the user is:

- `student`
- `teacher`

Then route them to the correct area of the app.

### Expected logic for now
Use mock login logic only.

Example:
- one mock user logs in as student
- one mock user logs in as teacher

This can be based on:
- selected role in login form
- mock email pattern
- hardcoded mock user object

Simple is fine for now.

---

## 2. Separate structure for student and teacher areas

Ask the implementation to separate files and folders clearly so the project is easier to scale later.

### Recommended structure idea
Use a structure similar to:

- `src/pages/student/...`
- `src/pages/teacher/...`
- `src/components/student/...`
- `src/components/teacher/...`
- `src/layouts/student/...`
- `src/layouts/teacher/...`

Shared items can go into:
- `src/components/shared/...`
- `src/hooks/...`
- `src/data/...`
- `src/utils/...`

The goal is to keep student and teacher views clearly separated.

---

## 3. Login flow update

### Login screen
The login screen should now include role awareness.

Suggested fields:
- `Е-пошта`
- `Лозинка`
- `Училиште`
- `Улога`

Possible role selector:
- `Ученик`
- `Наставник`

### Expected behavior
- user selects school
- user selects role
- on submit, app opens the correct dashboard
- chosen school can remain stored in localStorage
- chosen theme can remain stored in localStorage
- optional: chosen role can also be stored in localStorage for demo purposes

---

## 4. Teacher dashboard concept

The teacher dashboard should be different from the student dashboard.

### Main purpose
Teacher should be able to:
- view classes
- view students
- monitor assignments
- track progress
- create assignments (UI only for now)
- manage school/class activity overview

This should feel more organizational and monitoring-focused.

---

## 5. Teacher dashboard sections

## A. Top overview cards
Show quick summary cards like:

- `Мои класови`
- `Вкупно ученици`
- `Активни задачи`
- `Непрегледани предавања`
- `Оваа недела`

These are for visibility only for now.

---

## B. Main teacher hero section
A top panel like:

### `Наставничка контролна табла`
Show summary text such as:
- how many active classes
- how many assignments are currently active
- how many submissions need review

Possible action buttons:
- `Нова задача`
- `Преглед на класови`
- `Види активности`

`Нова задача` should only open a reference UI/modal/page for now, no backend functionality.

---

## C. Classes section
Add a section:

### `Мои класови`

Each class card can show:
- class name
- subject
- number of students
- active assignments
- average completion
- button: `Отвори клас`

Example mock classes:
- `IX-2 Математика`
- `VIII-1 Информатика`
- `VII-3 Природни науки`

This should be one of the most important parts of the teacher dashboard.

---

## D. Students monitoring section
Add a section:

### `Следење на ученици`

Possible views:
- recent activity table
- list of students needing attention
- students with overdue assignments
- top-performing students
- absent/inactive indicators if desired as mock data

Possible columns:
- Име
- Клас
- Последна активност
- Активни задачи
- Статус

This should help teacher quickly see what is happening.

---

## E. Assignments section
Add a section:

### `Задачи и домашни`

Teacher should be able to see:
- active assignments
- draft/future assignments (mock only if desired)
- completed assignments
- submissions pending review

Each assignment card can show:
- title
- class
- due date
- completion rate
- number submitted
- number pending

Buttons:
- `Види детали`
- `Прегледај`
- `Измени`
- `Нова задача`

Important:
For now these are visual/demo actions only.

---

## F. Assignment creation reference UI
Teacher should have a visible way to create a new assignment, but without real backend behavior yet.

### Add a reference page or modal:
`Креирај задача`

Suggested fields:
- Наслов
- Предмет
- Клас
- Опис
- Рок
- Тип
- Прикачен материјал (mock upload UI)
- Поени / тежина (optional)

Suggested task types:
- Домашна задача
- Проект
- Квиз
- Тест
- Вежба

This should only demonstrate the future functionality.

---

## G. Calendar / teaching schedule section
Teacher should also have a calendar-related view.

### Dashboard block
`Календар`
- upcoming deadlines
- planned assignments
- class activities
- reminders

### Separate page
Also allow a teacher calendar page later, similar to the student one but focused on:
- assignment due dates
- review dates
- class events
- school schedule items

---

## H. Recent activity / notifications
Add a section:

### `Последни активности`

Examples:
- 5 ученици ја предадоа задачата по математика
- Нова задача е креирана за IX-2
- 2 задачи се со рок денес
- Ученици доцнат со предавање

This makes the teacher dashboard feel active and useful.

---

## 6. Recommended teacher navigation

Suggested teacher nav:

- `Почетна`
- `Класови`
- `Ученици`
- `Задачи`
- `Календар`
- `Известувања`
- `Профил`

This should be different from the student navigation.

---

## 7. Teacher page ideas

The app does not need to fully implement all pages now, but it should be structured for them.

### Suggested teacher pages
- Teacher Dashboard
- Classes page
- Students page
- Assignments page
- Assignment details page
- Create assignment page/modal
- Calendar page
- Profile page

You can implement the dashboard first, but structure the project to support these pages.

---

## 8. UX direction for teacher view

The teacher UI should feel:
- organized
- practical
- overview-focused
- less playful than student view
- still modern and clean

### Important differences from student view
Student view:
- personal
- focused on tasks
- simple progression

Teacher view:
- overview of many students/classes
- management and monitoring
- assignment organization

---

## 9. Mock data requirements

Use mock data for:
- schools
- teachers
- classes
- students
- assignments
- submissions
- completion rates

### Example teacher mock info
- Име: `Наставник Елена Стојанова`
- Предмет: `Математика`
- Училиште: selected from login
- Класови: `IX-2`, `VIII-1`, `VII-3`

### Example dashboard metrics
- Мои класови: 3
- Вкупно ученици: 82
- Активни задачи: 6
- Непрегледани предавања: 14

---

## 10. Routing expectations

The front-end should now support a basic route split like:

### Student routes
- `/student/dashboard`
- `/student/workspace`
- `/student/calendar`
- `/student/profile`

### Teacher routes
- `/teacher/dashboard`
- `/teacher/classes`
- `/teacher/students`
- `/teacher/assignments`
- `/teacher/calendar`
- `/teacher/profile`

The exact route names can vary, but the separation should be clear.

---

## 11. Theme and persistence
Keep the existing theme behavior improvement:
- dark/light mode should persist using localStorage
- school selection can persist
- role can persist for demo convenience

This should work across both student and teacher views.

---

## 12. What to implement now
For now, prioritize:

1. role-aware login flow
2. separate student and teacher structure
3. teacher dashboard
4. visible teacher navigation
5. reference UI for creating assignments
6. teacher class/student monitoring cards and tables

No backend functionality is needed yet.

---

## 13. Main implementation intent
This is for prototype/demo quality front-end.

The result should show:
- student and teacher are clearly different experiences
- login decides which dashboard opens
- teacher can see classes, students, and assignments
- teacher can see a visible “create assignment” flow
- structure is ready for future backend integration