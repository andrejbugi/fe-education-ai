# Assignment Flow Pages (Frontend)

## Goal
The frontend should make the assignment process feel simple, clear, and structured for both students and teachers.

## Student pages

### 1. Login page
The user logs in with:
- е-пошта
- лозинка
- училиште

After login, route by role:
- student → student dashboard
- teacher → teacher dashboard

### 2. Student dashboard
This page shows:
- Следно за тебе
- Домашни задачи
- Рокови
- Известувања
- Мој напредок

Each assignment card should show:
- subject
- title
- due date
- status
- button: **Отвори**

### 3. Assignment details page
Before entering the workspace, the student should see:
- assignment title
- subject
- teacher
- deadline
- description
- resources / PDFs / links
- number of steps
- button: **Започни**

This page helps the student understand the task before solving it.

### 4. Student workspace page
This is the main solving page.

It should show:
- back button
- assignment title
- current step
- progress
- step content
- prompt
- example answer if available
- resource link if available
- answer input area
- buttons:
  - **Провери**
  - **Зачувај**
  - **Следен чекор**
  - **Поднеси**

This page should feel focused and distraction-free.

### 5. Submission result page
After submitting, show:
- **Успешно предадено**
- submission status
- summary of completed steps
- button: **Назад на почетна**

Optional:
- show if teacher review is still pending

## Teacher pages

### 6. Teacher dashboard
This page shows:
- classes
- recent submissions
- assignments to review
- announcements
- quick stats

Important section:
- **За прегледување**
- list of student submissions waiting for feedback

### 7. Teacher assignments page
Teacher can:
- create assignments
- edit assignments
- publish assignments
- view assignment list by classroom/subject

Each assignment should show:
- title
- classroom
- subject
- status
- due date
- submissions count

### 8. Submission review page
Teacher opens one student submission and sees:
- student name
- assignment title
- submitted answers by step
- step statuses
- teacher comment box
- grade input
- button: **Зачувај оценка**

Important:
This page reviews the **submission**, not just the assignment.

## Key frontend rule
The flow should be:

**Најава → Контролна табла → Детали за задача → Работен простор → Поднесување**
and for teachers:
**Контролна табла → Задачи / Поднесувања → Преглед на поднесување → Оценување и коментар**
