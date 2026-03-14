# Student Endpoints

Base path: `/api/v1/student`

These endpoints require student role in the active school.

## `GET /student/dashboard`
Returns dashboard data for the signed-in student.

Suggested response:
```json
{
  "student": {
    "id": 24,
    "full_name": "Елена Стојановска"
  },
  "stats": {
    "pending_assignments": 3,
    "completed_assignments": 9,
    "average_grade": 4.6,
    "unread_notifications": 2
  },
  "upcoming_items": [
    {
      "type": "assignment",
      "title": "Проект по информатика",
      "due_at": "2026-03-16T20:00:00Z"
    }
  ],
  "recent_activity": [
    {
      "id": 501,
      "action": "grade_posted",
      "label": "Објавена оценка по англиски",
      "created_at": "2026-03-13T10:15:00Z"
    }
  ]
}
```

Notes:
- The current frontend can render without this payload, but should use it when available.
- `stats.unread_notifications` should align with `GET /notifications`.

## `GET /student/assignments`
Returns assignments visible to the current student.

Supported response shapes:
```json
[
  {
    "id": 81,
    "title": "Дробки и децимали",
    "description": "Реши ги задачите 1-5",
    "assignment_type": "Домашна задача",
    "due_at": "2026-03-16T20:00:00Z",
    "subject": { "id": 2, "name": "Математика" },
    "submission_status": "in_progress"
  }
]
```

or

```json
{
  "assignments": [
    {
      "id": 81,
      "title": "Дробки и децимали"
    }
  ]
}
```

Frontend mapping notes:
- `subject.name` or `subject_name` is used for the subject label.
- `submission_status` is preferred over top-level `status` when both exist.

## `GET /student/assignments/:id`
Returns one assignment together with the current student's submission state.

Suggested response:
```json
{
  "id": 81,
  "title": "Дробки и децимали",
  "description": "Реши ги задачите 1-5",
  "assignment_type": "Домашна задача",
  "due_at": "2026-03-16T20:00:00Z",
  "subject": {
    "id": 2,
    "name": "Математика"
  },
  "steps": [
    {
      "id": 901,
      "position": 1,
      "prompt": "Пресметај 3/4 + 1/2",
      "step_type": "short_text"
    }
  ],
  "submission": {
    "id": 301,
    "status": "in_progress",
    "submitted_at": null,
    "answers": [
      {
        "assignment_step_id": 901,
        "answer_text": "5/4"
      }
    ]
  }
}
```

Access rules:
- Student can only load assignments assigned to one of their classrooms or directly to them.
- Return `404` if the assignment is not visible in the current school context.
