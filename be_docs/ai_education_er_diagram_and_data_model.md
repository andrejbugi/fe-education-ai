# AI Education Platform – Data Model Overview

## System Workflow

### 1. School Onboarding
A school starts using the platform.

Admin actions:
- Create school
- Add teachers
- Create classrooms
- Define subjects

Teachers and students log in using their email accounts.

Main tables involved:
- `schools`
- `users`
- `roles`
- `user_roles`
- `school_users`

### 2. Teacher Setup
Teachers configure their teaching structure.

They can:
- connect themselves to classrooms
- connect themselves to subjects
- assign students to classrooms

Main tables:
- `teacher_profiles`
- `student_profiles`
- `classrooms`
- `classroom_users`
- `teacher_classrooms`
- `subjects`
- `teacher_subjects`
- `homeroom_assignments`

### 3. Student Access
Students log into the system from:
- school computers
- home devices

Students can see:
- dashboard
- assignments
- calendar
- grades
- comments
- notifications

Tables used:
- `users`
- `student_profiles`
- `activity_logs`
- `notifications`
- `student_performance_snapshots`

### 4. Assignments & Homework
Teachers create learning tasks.

These may include:
- homework
- quizzes
- projects
- exercises

Assignments may include multiple steps.

Tables:
- `assignments`
- `assignment_steps`

Assignments can be scheduled and assigned to:
- a classroom
- a subject
- specific students

### 5. Student Submission Workflow
Students work on assignments inside the workspace.

They:
- open assignment
- solve steps
- submit answers

Tables:
- `submissions`
- `submission_step_answers`

### 6. Teacher Review & Feedback
Teachers evaluate the student work.

They can:
- grade assignments
- leave comments
- track progress

Tables:
- `grades`
- `comments`

`comments` should be polymorphic and can belong to:
- assignments
- submissions
- grades
- announcements
- calendar events

### 7. Calendar & Scheduling
Teachers schedule events such as:
- assignment deadlines
- quizzes
- projects
- school activities

Tables:
- `calendar_events`
- `event_participants`

These appear in the student dashboard calendar.

### 8. Activity Tracking
The system tracks student activity for dashboards.

Examples:
- submitted homework
- completed quiz
- new grade received
- teacher comment

Tables:
- `activity_logs`

### 9. AI Learning Workspace
Students may work inside an AI-assisted workspace.

This allows:
- solving problems step by step
- practice exercises
- AI tutoring

Tables:
- `ai_sessions`
- `ai_messages`

---

# Complete Table List

- `users`
- `roles`
- `user_roles`
- `schools`
- `school_users`
- `teacher_profiles`
- `student_profiles`
- `classrooms`
- `classroom_users`
- `teacher_classrooms`
- `subjects`
- `teacher_subjects`
- `homeroom_assignments`
- `assignments`
- `assignment_steps`
- `submissions`
- `submission_step_answers`
- `grades`
- `attendance_records`
- `announcements`
- `calendar_events`
- `event_participants`
- `comments`
- `activity_logs`
- `student_performance_snapshots`
- `ai_sessions`
- `ai_messages`
- `notifications`

---

# ER Diagram Structure (Simplified)

## Core user structure

```text
schools
  └── school_users
        └── users
              ├── user_roles
              │     └── roles
              ├── teacher_profiles
              └── student_profiles
```

## School / class / teacher / student structure

```text
schools
  └── classrooms
        ├── classroom_users
        │     └── users (students)
        ├── teacher_classrooms
        │     └── users (teachers)
        └── homeroom_assignments
              └── users (teachers)

subjects
  └── teacher_subjects
        └── users (teachers)
```

## Learning flow

```text
subjects
  └── assignments
        └── assignment_steps

assignments
  └── submissions
        ├── users (students)
        └── submission_step_answers

submissions
  └── grades
```

## Communication / collaboration

```text
announcements
calendar_events
  └── event_participants

comments (polymorphic)
  ├── assignments
  ├── submissions
  ├── grades
  ├── announcements
  └── calendar_events

notifications
activity_logs
```

## AI workspace

```text
users
  └── ai_sessions
        └── ai_messages
```

---

# Important Table Relations (Short)

- One `school` has many `users` through `school_users`.
- One `user` can have one or more roles through `user_roles`.
- A `user` can be a teacher, student, or admin.
- One `school` has many `classrooms`.
- A `classroom` has many students through `classroom_users`.
- A `classroom` has many teachers through `teacher_classrooms`.
- A teacher can teach many `subjects` through `teacher_subjects`.
- One `subject` has many `assignments`.
- One `assignment` has many `assignment_steps`.
- One `assignment` has many `submissions`.
- One `submission` has many `submission_step_answers`.
- One `submission` can have one or more `grades`.
- `comments` should be reusable across multiple models.
- `calendar_events` can be linked to many users through `event_participants`.
- One `user` has many `notifications`, `activity_logs`, and `ai_sessions`.
- One `ai_session` has many `ai_messages`.

---

# Most Critical Relations To Get Right Early

These are the ones that matter most for the first backend version:

1. `users` ↔ `roles` ↔ `user_roles`
2. `schools` ↔ `school_users` ↔ `users`
3. `classrooms` ↔ `classroom_users` ↔ `users`
4. `classrooms` ↔ `teacher_classrooms` ↔ `users`
5. `subjects` ↔ `assignments` ↔ `assignment_steps`
6. `assignments` ↔ `submissions` ↔ `submission_step_answers`
7. `submissions` ↔ `grades`
8. polymorphic `comments`
9. `calendar_events` ↔ `event_participants`

These will define most of the app behavior for MVP.

