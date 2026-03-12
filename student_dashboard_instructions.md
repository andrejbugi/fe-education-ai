# Student Dashboard Instructions

## Goal
Create a simple student dashboard UI for a Macedonian school platform.
The dashboard should feel clear, friendly, focused, and low-stress.
Use Macedonian for labels, sections, buttons, and navigation.

---

## General UI direction
- Clean modern React layout
- Productivity-oriented design
- Support light and dark mode
- Light blue can be used as the primary accent
- Avoid admin-panel feel
- Prioritize the most important student actions first

---

## Main purpose of the dashboard
When a student opens the dashboard, they should instantly understand:
1. What is next
2. What is due soon
3. What needs attention today
4. What is overdue

---

## Navigation
Top navbar or sidebar with Macedonian labels:
- Почетна
- Домашни
- Задачи
- Календар
- Известувања
- Профил

Also include:
- Logo area
- Theme switcher: Светла / Темна

---

## Dashboard layout structure

### 1. Hero section
Main top card:

**Следно за тебе**
- Show the next most important item
- Example: subject + homework title
- Show due date/time
- Primary button: **Продолжи**
- Secondary button: **Види детали**

This should be the most visually important block.

---

### 2. Quick stats row
Show 4 summary cards:
- **Денешни задачи**
- **Задоцнети**
- **Непрочитани известувања**
- **Оваа недела**

These should be compact cards below the hero section.

---

### 3. Main content grid
Use a 2-column responsive layout.

#### Left card
**Домашни задачи**
- List recent or urgent homework
- Each item should show:
  - Subject
  - Title
  - Due date
  - Status

Suggested statuses:
- Не е започнато
- Во тек
- Предадено
- Задоцнето

Suggested actions:
- Отвори
- Прикачи решение
- Предај

#### Right card
**Денес**
- Today’s classes
- Homework due today
- Quiz/test reminders
- Small daily reminders

---

### 4. Second content row
#### Left card
**Проекти и задачи**
- Larger assignments
- Multi-step work
- Progress bar if needed
- Teacher note preview

#### Right card
**Рокови**
- Upcoming deadlines
- Show next 5–7 important dates
- Add urgency markers if desired:
  - Денес
  - Утре
  - Наскоро
  - Задоцнето

---

### 5. Bottom content row
#### Left card
**Мој напредок**
- Завршени задачи
- Просек
- Weekly progress
- Keep it positive and motivating

#### Right card
**Известувања**
- New teacher comment
- New grade posted
- Schedule update
- New homework assigned

---

## Footer
Simple footer with:
- Помош
- Контакт
- Политика на приватност

---

## Suggested React component structure
- `StudentDashboardPage`
- `Navbar`
- `HeroNextCard`
- `QuickStatsRow`
- `StatCard`
- `HomeworkListCard`
- `TodayCard`
- `ProjectsCard`
- `DeadlinesCard`
- `ProgressCard`
- `AnnouncementsCard`
- `Footer`

---

## Suggested layout order
1. Navbar
2. Hero card
3. Quick stats row
4. Homework + Today
5. Projects + Deadlines
6. Progress + Announcements
7. Footer

---

## UX recommendations
- Keep spacing generous
- Use soft shadows and rounded cards
- Make the first action obvious
- Avoid too many colors
- Show only the most important items first
- Use badges for statuses
- Make the layout mobile-friendly
- Keep the dashboard calm and not overwhelming

---

## Example Macedonian section names
- Следно за тебе
- Денешни задачи
- Задоцнети
- Непрочитани известувања
- Домашни задачи
- Денес
- Проекти и задачи
- Рокови
- Мој напредок
- Известувања

---

## Notes for implementation
- Front end only for now
- Use mock data
- No API integration yet
- Design should be easy to later connect to Rails API backend

