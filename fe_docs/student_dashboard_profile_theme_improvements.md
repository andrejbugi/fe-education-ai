# Student Dashboard Improvements – Profile + Theme Persistence

## Goal
Improve the current student app prototype by adding:
1. a **Profile page**
2. student **performance visuals**
3. persistent **dark/light mode** using `localStorage`

This is still front-end only for now, with mock data.

---

## 1. Add Profile Page

Create a new page:

- `Профил`

This page should feel personal, simple, and useful for the student.

### Suggested sections on profile page

#### A. Student info card
Show:
- Име и презиме
- Одделение / клас
- Училиште
- Е-пошта
- Профилна слика (mock avatar for now)

Optional:
- ID / ученички број
- Наставник / класен раководител

---

#### B. Performance summary
Add a section:

- `Перформанси`
- `Мој напредок`

Show small summary cards like:
- Просечна оценка
- Завршени задачи
- Активни задачи
- Доцнења
- Присуство (optional mock)
- Освоени поени / streak (optional gamification preview)

---

#### C. Performance visuals
Add simple visuals/charts/cards for the prototype.

Examples:
- bar chart for results by subject
- line chart for weekly progress
- circular progress for completed assignments
- small subject cards with status

Suggested Macedonian labels:
- `Успех по предмети`
- `Неделен напредок`
- `Завршени задачи`
- `Активност`

Possible subjects for mock data:
- Математика
- Македонски јазик
- Англиски јазик
- Историја
- Биологија
- Информатика

---

#### D. Recent activity
Section:
- `Последни активности`

Examples:
- Предадена домашна по математика
- Завршен квиз по англиски
- Нов коментар од наставник
- Добиена оценка по историја

This helps the profile feel alive.

---

#### E. Student preferences
Section:
- `Поставки`

Can include:
- Светла тема / Темна тема
- Јазик (placeholder if needed)
- Известувања (mock toggle)
- Прикажи напредок / цели (optional mock settings)

---

## 2. Theme improvement – persist dark/light mode

### Current issue
Dark/light mode should not reset on refresh.

### Required improvement
Store selected theme in `localStorage`.

### Expected behavior
- when student changes theme, save it in `localStorage`
- on app load, read the saved theme from `localStorage`
- apply theme immediately
- if there is no saved theme yet, use default theme
- optional: fallback to system preference only on first load

### Example keys
Use a simple key like:
- `theme`
or
- `student-app-theme`

Possible values:
- `light`
- `dark`

---

## 3. Navigation update

Add `Профил` to navigation.

Suggested nav:
- Почетна
- Домашни
- Задачи
- Календар
- Известувања
- Профил

Profile should open like the other pages in the front-end prototype.

---

## 4. UX recommendations for profile page

### Style
- keep the same modern student UI style
- support both light and dark mode nicely
- keep charts/cards clean, not too heavy
- make it feel motivational, not stressful

### Good approach
- top section: avatar + name + class
- second row: performance cards
- third row: charts
- fourth row: recent activity + settings

---

## 5. Mock data requirements

Use mock student data so the page looks realistic.

### Example mock values
- Име: Андреј Костов
- Клас: IX-2
- Просек: 4.6
- Завршени задачи: 18
- Активни задачи: 4
- Доцнења: 1

### Example subject performance
- Математика: 92
- Македонски јазик: 84
- Англиски јазик: 95
- Историја: 76
- Биологија: 88
- Информатика: 97

---

## 6. Visual prototype expectations

This should still work without backend.

Need:
- clickable `Профил` page
- mock charts / visuals
- theme toggle that really persists after refresh
- polished front-end-only experience

---

## 7. Implementation intent
This change is for prototype/demo quality:
- show how a student can navigate to profile
- show performance visually
- make the app feel more real
- improve theme UX so it behaves like a real app

---

## 8. Optional nice additions
If easy to add:
- achievement badges
- weekly goal card
- “most improved subject”
- motivational message like:
  - `Одлична работа оваа недела`
  - `Продолжи со добриот напредок`

But keep it simple and not overloaded.