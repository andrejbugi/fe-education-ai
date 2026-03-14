# Teacher Endpoints

Base path: `/api/v1/teacher`

These endpoints require teacher or admin role in the active school.

## `GET /teacher/dashboard`
Returns dashboard metrics and teacher-specific work queues.

Typical response:
```json
{
  "teacher": {
    "id": 8,
    "full_name": "Ана Трајковска",
    "email": "email122@email.com"
  },
  "classroom_count": 3,
  "student_count": 62,
  "active_assignments": 7,
  "review_queue": [
    {
      "id": 301,
      "student": { "id": 24, "full_name": "Елена Стојановска" },
      "classroom": { "id": 4, "name": "7-A" },
      "assignment": { "id": 81, "title": "Дробки и децимали" },
      "status": "submitted",
      "submitted_at": "2026-03-13T18:25:00Z"
    }
  ],
  "upcoming_calendar_events": [
    {
      "id": 11,
      "title": "Одделенски час",
      "starts_at": "2026-03-16T08:00:00Z"
    }
  ]
}
```

Frontend notes:
- `TeacherArea` reads `review_queue` and `upcoming_calendar_events` directly.
- If some counters are omitted, frontend can derive fallback values from classroom data.

## `GET /teacher/classrooms`
Returns classrooms assigned to the current teacher in the active school.

Typical response:
```json
[
  {
    "id": 4,
    "name": "7-A",
    "grade_level": "7",
    "academic_year": "2025/2026",
    "student_count": 24,
    "assignment_count": 3,
    "school": {
      "id": 1,
      "name": "ОУ Браќа Миладиновци"
    }
  }
]
```

## `GET /teacher/classrooms/:id`
Returns a single classroom available to the teacher.

Suggested response shape:
```json
{
  "id": 4,
  "name": "7-A",
  "grade_level": "7",
  "academic_year": "2025/2026",
  "students": [
    {
      "id": 24,
      "full_name": "Елена Стојановска",
      "submission_rate": 0.91,
      "average_grade": 4.7
    }
  ],
  "subjects": [
    { "id": 2, "name": "Математика", "code": "MAT-7" }
  ],
  "active_assignments": [
    { "id": 81, "title": "Дробки и децимали", "status": "published" }
  ]
}
```

## `GET /teacher/subjects`
Returns subjects linked to the current teacher.

Typical response:
```json
[
  { "id": 2, "name": "Математика", "code": "MAT-7" },
  { "id": 5, "name": "Информатика", "code": "INF-7" }
]
```

## `GET /teacher/students/:id`
Returns a teacher-scoped view of one student.

Suggested response shape:
```json
{
  "student": {
    "id": 24,
    "full_name": "Елена Стојановска",
    "email": "student14@edu.mk"
  },
  "classrooms": [
    { "id": 4, "name": "7-A" }
  ],
  "subjects": [
    {
      "id": 2,
      "name": "Математика",
      "current_grade": 5,
      "missing_assignments": 1
    }
  ],
  "recent_submissions": [
    {
      "id": 301,
      "assignment_title": "Дробки и децимали",
      "status": "submitted",
      "submitted_at": "2026-03-13T18:25:00Z"
    }
  ]
}
```

Access rules:
- Teacher must be linked to the student through a classroom or subject in the same school.
- Return `404` when the student is outside teacher scope.
