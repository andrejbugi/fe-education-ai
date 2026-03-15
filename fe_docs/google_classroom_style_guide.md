# Google Classroom–Inspired Styling Guide

## Goal
Use a **Google Classroom–inspired** design direction for the React frontend, while keeping it aligned with the current backend/API structure and the already-defined student/teacher flows.

This is a **styling and design guide only**.
It does **not** change endpoints, roles, data model, or business logic.

---

## Core Design Direction
Build the UI around these qualities:
- calm and school-friendly
- simple and familiar
- card-based layout
- soft spacing and rounded surfaces
- strong readability over decoration
- clear teacher/student separation
- fast scanning of tasks, announcements, deadlines, and progress

Do **not** try to fully copy Google Classroom.
Use it as visual inspiration for:
- page hierarchy
- stream/classwork layout
- assignment composer layout
- clean top navigation
- large class header banner
- soft card containers

---

## General Visual Style

### Overall feel
The product should look:
- modern but not corporate
- structured but not heavy
- friendly for Macedonian schools
- suitable for both younger students and teachers

### Layout principles
Use:
- a light background for default theme
- white or near-white cards
- one strong accent color
- subtle borders and shadows
- large horizontal spacing
- consistent vertical rhythm

Recommended base styling:
- page background: very light gray / soft neutral
- cards: white
- border radius: medium to large
- shadows: subtle only
- dividers: very soft gray

---

## Theme and Color Direction
Use the existing product direction from the current student UI work:
- support **Светла** and **Темна** theme
- keep the light theme calm and productive
- dark theme should use navy/slate surfaces with soft contrast

### Accent strategy
Use one main accent family across the app.
A good direction is:
- primary accent: blue / indigo for the main product identity
- secondary accent: rose/pink only if used very lightly for special highlights

Because the current project already leans toward soft blue productivity styling, keep that as the default brand direction instead of making the entire product pink.

Suggested usage:
- primary buttons
- active tab underline
- badges
- progress highlights
- focus states
- links

Avoid too many bright colors on one page.

---

## Typography
Typography should be simple and highly readable.

Use a clean sans-serif UI style with:
- strong page title
- medium section titles
- smaller muted metadata
- clear button labels

Suggested hierarchy:
- page/class title: bold, large
- section headers: semibold
- card titles: medium to semibold
- metadata: smaller and muted
- helper text: subtle gray

Important:
- keep line lengths short in cards
- avoid dense paragraphs
- use more spacing instead of more text

---

## Top Navigation
Use a clean top navigation bar inspired by classroom products.

### Structure
Left:
- hamburger/menu icon if needed
- product logo/name
- current class or workspace title when relevant

Center:
- page tabs when on class pages

Right:
- theme switcher
- notifications
- profile/avatar
- school switcher when needed for multi-school users

### Navigation style
Tabs should feel similar to a classroom app:
- simple text tabs
- active tab shown by color + underline
- lots of white space
- no heavy boxed tab style

Use Macedonian labels where applicable, for example:
- **Поток**
- **Задачи**
- **Луѓе**
- **Оценки**
- **Календар**
- **Известувања**

Keep hover states soft and minimal.

---

## Class Header / Hero Banner
One of the strongest Google Classroom-inspired elements is the class header banner.
Use this pattern in teacher and class pages.

### Banner content
The top class banner should contain:
- classroom name
- subject or grade label
- optional school/class code
- optional quick actions

### Banner styling
Use:
- large rounded banner card
- strong but controlled background color or gradient
- optional illustration/pattern, but keep it subtle
- white text over the banner
- generous padding

The banner should make the page immediately feel like a class space.

Do not overload it with too many controls.
Keep the controls below or beside the banner where possible.

---

## Main Page Composition
For class pages, use a 2-column layout similar to classroom tools.

### Left narrow column
Use for small summary cards such as:
- upcoming work
- deadlines
- quick class info
- small filters

### Right main column
Use for the core feed or content:
- announcements stream
- classwork list
- assignment groups/topics
- cards for materials and tasks

This matches the current platform needs well because we already have:
- announcements
- assignments
- calendar/deadlines
- notifications
- dashboard summaries

---

## Stream / Announcement Styling
The stream area should look like a clean communication feed.

### Composer card
For teacher announcement creation, use a wide rounded card with:
- teacher avatar/icon
- placeholder text
- class/audience selector row
- attachment row if needed
- clear primary action button

The composer should feel lightweight, not like a full admin form.

### Announcement cards
Each announcement card should include:
- author name
- date/time
- title or first line
- body text preview
- optional priority badge
- optional classroom/subject badge

Styling:
- white card
- soft border
- moderate padding
- very clear spacing between header and body
- comments/actions only if needed

For priority badges, use restrained colors:
- normal: neutral
- important: amber/orange accent
- urgent: red accent used carefully

This aligns well with the current announcements model and dashboard feed support.

---

## Classwork / Assignment List Styling
The classwork page should be structured, easy to scan, and topic-oriented.

### Create button
Use a prominent rounded primary button at the top-left area, similar to a classroom content action.
Examples:
- **Креирај**
- **Нова задача**
- **Ново известување**

### Grouping
Assignments and materials should be grouped visually under topic/section headers.
This fits the current assignment structure and future topic grouping well.

### Assignment cards
Each assignment row/card should show:
- title
- subject/classroom context if needed
- due date
- status badge
- small metadata line
- optional type icon

Suggested status badges:
- **Нацрт**
- **Објавено**
- **Закажано**
- **Затворено**
- **Архивирано**

Student-facing statuses can use:
- **Не е започнато**
- **Во тек**
- **Предадено**
- **Прегледано**
- **Задоцнето**

Keep these badges compact and pill-shaped.

---

## Assignment Details Design
The assignment details page should feel like a focused classroom task page.

### Header block
Show:
- assignment title
- due date
- subject
- teacher
- points if used
- status

### Body layout
Render the page in stacked content sections:
1. summary/description
2. rich content blocks
3. resources/materials
4. steps/tasks
5. submission area

This matches the current backend shape where assignments can include:
- `description`
- `content_json`
- `resources`
- rich `steps`
- submission state

### Resource styling
Assignment-level resources should be displayed as neat attachment cards/list items.
Each item can show:
- icon by resource type
- title
- short description
- required badge if needed
- open/download action

Supported visual resource types should clearly differ:
- PDF
- file
- image
- video
- link
- embed
- text block

---

## Step / Workspace Design
The student workspace should remain simpler and more focused than the dashboard.
This is already consistent with the current student flow guidance.

### Workspace layout
Top area:
- back button (**Назад**)
- assignment title
- step/progress indicator
- optional theme toggle

Main area:
- one main task card
- prompt/help area
- answer input area
- feedback state
- navigation actions

### Styling behavior
Use:
- wide reading area
- fewer distractions
- clear current step emphasis
- visible progress state
- generous spacing around inputs

### Step cards
Each step should visually separate:
- title
- content
- prompt
- optional example answer
- optional step resource
- answer area
- check/retry state

For `evaluation_mode` presentation:
- `manual` -> subtle neutral badge like **Потребен преглед**
- auto-checked modes -> subtle accent badge like **Автоматска проверка**

Do not expose any teacher-only answer key data in the UI.

---

## Teacher Creation Modal / Form Styling
The teacher create/edit experience should visually resemble a clean classroom composer, not a heavy CMS screen.

### Design approach
Use a large modal or sheet with:
- strong title at top
- compact meta row
- simple field grouping
- attachments/resources area
- clear primary submit button

### Field styling
Inputs should be:
- wide
- lightly bordered
- comfortable for longer text
- grouped with clear labels

Important sections:
- title
- instructions/description
- due date
- points
- topic/group
- resources
- steps

This works with the current richer assignment model that supports:
- `content_json`
- `teacher_notes`
- `resources`
- step `prompt`
- `example_answer`
- `resource_url`
- `evaluation_mode`

---

## Dashboard Styling
The teacher and student dashboards should both follow the same visual system, but differ in emphasis.

### Student dashboard
Prioritize:
- **Следно за тебе**
- deadlines
- homework list
- notifications
- progress
- AI resume card if present

### Teacher dashboard
Prioritize:
- my classes
- upcoming review/grading work
- announcements feed
- homerooms
- attendance shortcuts
- recent assignments

### Card style
For both dashboards:
- white cards
- soft shadows
- compact metadata rows
- strong section headings
- limited content per card
- obvious primary action

---

## Calendar and Deadline Styling
Calendar UI should stay visually lightweight.

Use:
- clear month/week structure
- soft selection states
- small event pills/dots
- side panel for upcoming deadlines

Important deadline states should stand out, but not aggressively.
Suggested labels:
- **Денес**
- **Утре**
- **Наскоро**
- **Задоцнето**

---

## Iconography
Use simple, familiar icons only.
Prefer outline icons with consistent stroke width.

Good categories:
- assignment
- calendar
- people
- grade/book
- announcement/message
- attachment/file
- AI/help

Do not mix many icon styles.

---

## Spacing and Surface Rules
Keep spacing consistent everywhere.

Recommended visual rhythm:
- large space between page sections
- medium space inside cards
- small space between metadata items

Surface rules:
- avoid nested heavy borders
- cards inside cards only when needed
- use light separators instead of many boxes

This is important because the product includes many content types already:
- dashboard cards
- announcements
- assignments
- resources
- step content
- notifications
- performance blocks

---

## Responsive Behavior
On smaller screens:
- collapse class tabs cleanly
- stack 2-column layouts into 1 column
- keep composer/actions full-width
- move side summary cards below main content
- keep teacher forms scrollable and usable

Do not make the mobile UI overcrowded.

---

## Design Constraints to Respect
To stay aligned with current sources and backend behavior:

- keep **student** and **teacher** views clearly separated
- keep **school context** ready for selector/header usage
- support current domains visually: assignments, submissions, grades, comments, calendar, notifications, announcements, AI sessions
- reflect current assignment richness visually: resources, content blocks, prompts, example answers, step states
- do not design screens that assume unsupported teacher grading detail behavior beyond documented endpoints
- do not rely on exposing `answer_keys` in student views
- keep labels and visible UI copy in **Macedonian**

---

## Recommended Macedonian Labels
Use Macedonian in visible UI fields, buttons, and tabs.
Examples:

Navigation / tabs:
- **Поток**
- **Задачи**
- **Луѓе**
- **Оценки**
- **Календар**
- **Известувања**

Teacher actions:
- **Креирај**
- **Нова задача**
- **Ново известување**
- **Објави**
- **Зачувај**
- **Закажи**

Student actions:
- **Продолжи**
- **Види детали**
- **Предај**
- **Провери чекор**
- **Прескокни**
- **Назад**

Statuses:
- **Нацрт**
- **Објавено**
- **Закажано**
- **Во тек**
- **Предадено**
- **Прегледано**
- **Задоцнето**

---

## Final Recommendation
The best direction is:

Use a **Google Classroom–inspired visual system** with:
- large class banner
- clean top tabs
- announcement stream cards
- organized classwork sections
- soft rounded cards
- focused assignment/workspace pages
- simple, familiar teacher creation forms

But keep it adapted to **our existing platform structure**, especially:
- role-based routing
- school-based context
- richer assignment resources/content
- step-based student workspace
- announcements, calendar, notifications, and AI session support

This should make the platform feel familiar, trustworthy, and school-ready without breaking alignment with the current backend and frontend scope.
