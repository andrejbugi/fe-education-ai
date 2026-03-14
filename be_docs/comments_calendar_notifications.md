# Comments, Calendar, and Notifications

Base path: `/api/v1`

These shared features power feedback, scheduling, and user alerts.

## Comments

### `POST /comments`
Creates a comment on a polymorphic resource.

Request example:
```json
{
  "commentable_type": "Submission",
  "commentable_id": 301,
  "body": "Одличен напредок, доработи го последниот дел."
}
```

Success response:
```json
{
  "id": 901,
  "commentable_type": "Submission",
  "commentable_id": 301,
  "body": "Одличен напредок, доработи го последниот дел.",
  "author": {
    "id": 8,
    "full_name": "Ана Трајковска"
  },
  "created_at": "2026-03-14T09:15:00Z"
}
```

Supported `commentable_type` values in current model notes:
- `Assignment`
- `Submission`
- `Grade`
- `Announcement`
- `CalendarEvent`

### `GET /comments?commentable_type=Submission&commentable_id=301`
Returns comments for a single resource.

Suggested response:
```json
[
  {
    "id": 901,
    "body": "Одличен напредок, доработи го последниот дел.",
    "author": {
      "id": 8,
      "full_name": "Ана Трајковска"
    },
    "created_at": "2026-03-14T09:15:00Z"
  }
]
```

## Calendar

### `GET /calendar/events`
Returns events in the current school context.

Suggested response:
```json
[
  {
    "id": 11,
    "title": "Одделенски час",
    "description": "Подготовка за натпревар",
    "starts_at": "2026-03-16T08:00:00Z",
    "ends_at": "2026-03-16T08:45:00Z",
    "event_type": "school",
    "participant_count": 18
  }
]
```

### `POST /calendar/events`
Creates a new calendar event.

Request example:
```json
{
  "title": "Квиз по математика",
  "description": "Поглавје 3",
  "starts_at": "2026-03-18T09:00:00Z",
  "ends_at": "2026-03-18T09:45:00Z",
  "event_type": "quiz",
  "participant_ids": [24, 25, 26]
}
```

### `PATCH /calendar/events/:id`
Updates an existing event.

Request example:
```json
{
  "title": "Квиз по математика - поместен термин",
  "starts_at": "2026-03-19T09:00:00Z"
}
```

## Notifications

### `GET /notifications`
Returns notifications for the current user.

Supported response shapes:
```json
[
  {
    "id": 401,
    "title": "Нова домашна задача",
    "message": "Додадена е домашна по математика.",
    "read": false,
    "created_at": "2026-03-14T08:30:00Z"
  }
]
```

or

```json
{
  "notifications": [
    {
      "id": 401,
      "title": "Нова домашна задача"
    }
  ],
  "unread_count": 2
}
```

Frontend notes:
- Current UI accepts either a flat array or `{ notifications: [...] }`
- `message` or `body` can be used for the detail text

### `POST /notifications/:id/mark_as_read`
Marks one notification as read.

Success response:
```json
{
  "id": 401,
  "read": true,
  "read_at": "2026-03-14T08:45:00Z"
}
```
