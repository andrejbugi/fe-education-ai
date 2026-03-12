Here is a clean **`.md` file content** you can use.

---

# AI Education Platform – Data Model Overview

## System Workflow

### 1. School Onboarding

A school starts using the platform.

Admin actions:

* Create school
* Add teachers
* Create classrooms
* Define subjects

Teachers and students will log in using their email accounts.

Main tables involved:

* `schools`
* `users`
* `roles`
* `user_roles`
* `school_users`

---

### 2. Teacher Setup

Teachers configure their teaching structure.

They can:

* connect themselves to classrooms
* connect themselves to subjects
* assign students to classrooms

Main tables:

* `teacher_profiles`
* `student_profiles`
* `classrooms`
* `classroom_users`
* `teacher_classrooms`
* `subjects`
* `teacher_subjects`
* `homeroom_assignments`

Relations (simplified):

```
school
 └── classrooms
       ├── teacher_classrooms
       └── classroom_users (students)

teachers
 └── teacher_subjects
       └── subjects
```

---

### 3. Student Access

Students log into the system from:

* school computers
* home devices

Students can see:

* dashboard
* assignments
* calendar
* grades
* comments
* notifications

Tables used:

* `users`
* `student_profiles`
* `activity_logs`
* `notifications`
* `student_performance_snapshots`

---

### 4. Assignments & Homework

Teachers create learning tasks.

These may include:

* homework
* quizzes
* projects
* exercises

Assignments may include multiple steps.

Tables:

* `assignments`
* `assignment_steps`

Relations:

```
subjects
   └── assignments
          └── assignment_steps
```

Assignments can be scheduled and assigned to:

* a classroom
* a subject
* specific students.

---

### 5. Student Submission Workflow

Students work on assignments inside the workspace.

They:

* open assignment
* solve steps
* submit answers

Tables:

* `submissions`
* `submission_step_answers`

Relations:

```
assignments
   └── submissions
          └── submission_step_answers
```

---

### 6. Teacher Review & Feedback

Teachers evaluate the student work.

They can:

* grade assignments
* leave comments
* track progress

Tables:

* `grades`
* `comments`

`comments` is polymorphic and can belong to:

* assignments
* submissions
* grades
* announcements
* calendar events

---

### 7. Calendar & Scheduling

Teachers schedule events such as:

* assignment deadlines
* quizzes
* projects
* school activities

Tables:

* `calendar_events`
* `event_participants`

Relations:

```
calendar_events
   └── event_participants
         ├── students
         └── teachers
```

These appear in the student dashboard calendar.

---

### 8. Activity Tracking

The system tracks student activity for dashboards.

Examples:

* submitted homework
* completed quiz
* new grade received
* teacher comment

Tables:

* `activity_logs`

This powers the **"Последни активности"** section.

---

### 9. AI Learning Workspace

Students may work inside an AI-assisted workspace.

This allows:

* solving problems step by step
* practice exercises
* AI tutoring

Tables:

* `ai_sessions`
* `ai_messages`

Relations:

```
users
 └── ai_sessions
       └── ai_messages
```

---

# Complete Table List

```
users
roles
user_roles

schools
school_users

teacher_profiles
student_profiles

classrooms
classroom_users
teacher_classrooms

subjects
teacher_subjects
homeroom_assignments

assignments
assignment_steps

submissions
submission_step_answers

grades

attendance_records

announcements

calendar_events
event_participants

comments

activity_logs

student_performance_snapshots

ai_sessions
ai_messages

notifications
```

---