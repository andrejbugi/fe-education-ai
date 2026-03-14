# Assignments, Submissions, and Grades

Base path: `/api/v1`

This doc covers teacher assignment management and the student submission lifecycle.

## Teacher assignment endpoints

### `GET /assignments`
Returns assignments visible to the current teacher or admin.

Suggested response:
```json
[
  {
    "id": 81,
    "title": "Дробки и децимали",
    "status": "draft",
    "assignment_type": "Домашна задача",
    "due_at": "2026-03-16T20:00:00Z",
    "classroom": { "id": 4, "name": "7-A" },
    "subject": { "id": 2, "name": "Математика" },
    "submission_count": 12
  }
]
```

### `POST /assignments`
Creates a new assignment. Current frontend sends this shape:

```json
{
  "title": "Нова задача",
  "description": "Краток опис",
  "due_at": "2026-03-16",
  "assignment_type": "Домашна задача",
  "classroom_id": 4,
  "subject_id": 2,
  "max_points": 20
}
```

Success response:
```json
{
  "id": 81,
  "title": "Нова задача",
  "status": "draft",
  "classroom_id": 4,
  "subject_id": 2,
  "max_points": 20
}
```

Validation rules:
- `title`, `classroom_id`, and `subject_id` should be required
- `classroom_id` and `subject_id` must belong to the active school and current teacher scope
- `max_points` should be numeric when provided

### `GET /assignments/:id`
Returns one assignment with steps and current aggregates.

Suggested response:
```json
{
  "id": 81,
  "title": "Дробки и децимали",
  "description": "Реши ги задачите 1-5",
  "status": "published",
  "assignment_type": "Домашна задача",
  "due_at": "2026-03-16T20:00:00Z",
  "classroom": { "id": 4, "name": "7-A" },
  "subject": { "id": 2, "name": "Математика" },
  "steps": [
    {
      "id": 901,
      "position": 1,
      "prompt": "Пресметај 3/4 + 1/2",
      "step_type": "short_text",
      "points": 5
    }
  ]
}
```

### `PATCH /assignments/:id`
Updates assignment metadata while it is editable.

Request example:
```json
{
  "title": "Ажурирана задача",
  "description": "Нов опис",
  "due_at": "2026-03-17T20:00:00Z",
  "max_points": 25
}
```

### `POST /assignments/:id/publish`
Publishes a draft assignment and triggers student notifications.

Success response:
```json
{
  "id": 81,
  "status": "published",
  "published_at": "2026-03-14T09:30:00Z"
}
```

### `POST /assignments/:assignment_id/steps`
Adds a step to an existing assignment.

Request example:
```json
{
  "prompt": "Објасни го процесот",
  "step_type": "long_text",
  "position": 2,
  "points": 10
}
```

### `PATCH /assignments/:assignment_id/steps/:id`
Updates one assignment step.

Request example:
```json
{
  "prompt": "Објасни го решението",
  "points": 8
}
```

## Student submission endpoints

### `POST /assignments/:assignment_id/submissions`
Starts or returns the current student's submission record.

Suggested response:
```json
{
  "id": 301,
  "assignment_id": 81,
  "student_id": 24,
  "status": "in_progress",
  "started_at": "2026-03-14T08:10:00Z"
}
```

### `PATCH /submissions/:id`
Saves draft work for a submission.

Request example:
```json
{
  "status": "in_progress",
  "answers": [
    {
      "assignment_step_id": 901,
      "answer_text": "5/4"
    }
  ]
}
```

Supported answer fields can include:
- `assignment_step_id`
- `answer_text`
- `selected_option`
- `is_correct` when backend computes correctness internally later

### `POST /submissions/:id/submit`
Finalizes a student submission.

Success response:
```json
{
  "id": 301,
  "status": "submitted",
  "submitted_at": "2026-03-14T08:45:00Z"
}
```

Business rules:
- Reject duplicate final submit with `422` or make the action idempotent
- Late submissions may return `status: "late"`

## Grade endpoint

### `POST /submissions/:submission_id/grades`
Creates a grade record for a reviewed submission.

Request example:
```json
{
  "score": 18,
  "max_points": 20,
  "feedback": "Добро решено, внимавај на последниот чекор."
}
```

Success response:
```json
{
  "id": 71,
  "submission_id": 301,
  "score": 18,
  "max_points": 20,
  "feedback": "Добро решено, внимавај на последниот чекор.",
  "graded_at": "2026-03-14T09:05:00Z"
}
```
