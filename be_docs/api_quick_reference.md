# API Quick Reference

Base path: `/api/v1`

All protected endpoints require:
- `Authorization: Bearer <jwt>`
- `X-School-Id: <school_id>` for school-scoped data unless noted otherwise

## Auth
- `POST /auth/login` - sign in with email/password and optional `school_id`
- `DELETE /auth/logout` - client-side/stateless logout
- `GET /auth/me` - current user and available schools

## Schools and profile
- `GET /schools` - schools visible to current user
- `GET /schools/:id` - one school with classrooms and subjects
- `GET /profile` - current profile summary
- `PATCH /profile` - update current profile fields

## Teacher area
- `GET /teacher/dashboard` - teacher stats, review queue, upcoming events
- `GET /teacher/classrooms` - classrooms assigned to current teacher
- `GET /teacher/classrooms/:id` - one classroom with roster and assignment context
- `GET /teacher/subjects` - subjects assigned to current teacher
- `GET /teacher/students/:id` - one student in teacher scope

## Assignments
- `GET /assignments` - teacher/admin assignment list
- `POST /assignments` - create assignment draft
- `GET /assignments/:id` - assignment details with steps and context
- `PATCH /assignments/:id` - update assignment fields
- `POST /assignments/:id/publish` - publish draft assignment
- `POST /assignments/:assignment_id/steps` - create assignment step
- `PATCH /assignments/:assignment_id/steps/:id` - update assignment step

## Submissions and grades
- `POST /assignments/:assignment_id/submissions` - start student submission
- `PATCH /submissions/:id` - save draft answers/status
- `POST /submissions/:id/submit` - finalize submission
- `POST /submissions/:submission_id/grades` - grade a submission

## Comments
- `POST /comments` - create polymorphic comment
- `GET /comments?commentable_type=Submission&commentable_id=123` - list comments for resource

## Calendar
- `GET /calendar/events` - school calendar events
- `POST /calendar/events` - create event
- `PATCH /calendar/events/:id` - update event

## Notifications
- `GET /notifications` - paged or flat notification feed
- `POST /notifications/:id/mark_as_read` - mark one notification read

## Student area
- `GET /student/dashboard` - student dashboard summary
- `GET /student/assignments` - assignments for current student
- `GET /student/assignments/:id` - one assignment with submission state
