# UI Improvement Notes for Student AI Learning App

## Goals
Improve the current student UI so it feels more polished, more focused, and more realistic for school usage.

---

## Theme / Visual Direction

### 1. Add theme switcher
Support both:
- **Light mode**
- **Dark mode**

Recommended default:
- keep the current **light blue** family for light mode because it feels calm and productive
- add a **darker blue / slate dark theme** for better contrast and more modern feel

### Suggested idea
- Light mode: soft blue background, white cards, blue accents
- Dark mode: dark navy/slate background, slightly lighter cards, soft blue highlight color

### UI behavior
- Add a theme toggle in the navbar
- Save the selected theme in local state for now
- Optional later: persist in localStorage

---

## Learning Flow Improvements

### 2. Better step progression
Current issue:
- the UI shows step progression visually, but the solving flow should behave more strictly

Improve it like this:
- when the student enters a **correct step**, automatically move to the **next step**
- update:
  - tutor prompt
  - progress indicator
  - expected answer
  - feedback
- once the last valid step is passed, show a final success state

### Example flow
Problem:
`3x + 5 = 20`

Step 1 expected:
`3x = 15`

Step 2 expected:
`x = 5`

Flow:
- student enters `3x = 15`
- app validates
- if correct -> store in history and move to step 2
- tutor prompt changes to something like:
  `Good. Now divide both sides by 3.`
- if student enters `x = 5`
- app validates
- show completion message

---

## Step Rules

### 3. Do not allow skipping after validation state
Current issue:
- the student can skip in a way that makes the flow unclear

Improve rule set:
- a student **cannot skip** a step after it has already been answered correctly
- a student **cannot skip** a step after a failed check if the UX would become inconsistent
- skipping should only be allowed if the current step is still untouched

### Recommended behavior
For the active step:
- **Check Step** → validates input
- **Hint** → gives help
- **Skip** → only available if no answer has been checked yet for this step

After a check:
- disable or hide **Skip**
- keep **Hint** available
- keep **Check Step** available for retry if wrong

---

## Navbar

### 4. Add a simple navbar
Add a top navbar for better product structure.

Suggested navbar items:
- App name / logo
- Subject or workspace title
- Theme toggle
- Student profile placeholder

### Example structure
- Left: `EduAI`
- Center or left: `Student Workspace`
- Right:
  - theme toggle
  - profile/avatar placeholder

Keep it minimal and clean.

---

## Footer

### 5. Add a simple footer
Add a footer to make the page feel complete.

Suggested content:
- `EduAI Learning Assistant`
- `Safe guided learning for students`
- optional small links placeholders:
  - Help
  - Privacy
  - About

Keep footer subtle and small.

---

## Suggested Component Updates

### Existing components to improve
- `Header`
- `ProblemCard`
- `TutorPromptCard`
- `StepInputCard`
- `FeedbackBox`
- `StepHistory`

### New components to add
- `Navbar`
- `Footer`
- `ThemeToggle`

---

## Suggested State Improvements

Use state that better matches the step flow.

Example idea:

```js
problem: "3x + 5 = 20"
steps: [
  { id: 1, expected: "3x = 15", status: "done" },
  { id: 2, expected: "x = 5", status: "active" }
]
currentStepIndex: 1
inputValue: ""
feedback: ""
theme: "light"
```

Useful statuses:
- `pending`
- `active`
- `correct`
- `wrong`
- `skipped`

---

## UX Notes

### 6. General UX polish
Improve:
- darker contrast in text
- stronger hierarchy for headings
- better spacing between cards
- clearer disabled button state
- more polished success / error / hint colors
- smoother hover and transition states

### 7. Completion state
After all steps are solved:
- show success card:
  - `Great work! You solved the equation.`
- disable input
- allow optional:
  - `Try another problem`
  - `Review steps`

---

## Recommended MVP changes now
For the next iteration, implement only these:

1. Add **light/dark theme toggle**
2. Keep light blue as the base for light mode
3. Add **navbar**
4. Add **footer**
5. Make **correct answer move automatically to next step**
6. Restrict **Skip** so it is only allowed before validation
7. Update prompts dynamically per step

---

## Notes for implementation
This is still **frontend only**.
Do not connect API yet.

Focus on:
- cleaner UI
- realistic learning flow
- better structure
- darker theme support
