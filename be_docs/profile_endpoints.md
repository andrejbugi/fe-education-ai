# Profile Endpoints

Base path: `/api/v1`

This doc covers current-user profile endpoints used after authentication.

## Shared auth rules
- Requires `Authorization: Bearer <jwt>`
- Send `X-School-Id` when profile data is school-scoped
- Response errors follow the common contract from `frontend_login_flow.md`

## `GET /profile`
Returns the current user profile in the active school context.

Typical response:
```json
{
  "user": {
    "id": 24,
    "email": "student14@edu.mk",
    "first_name": "Елена",
    "last_name": "Стојановска",
    "full_name": "Елена Стојановска",
    "roles": ["student"]
  },
  "school": {
    "id": 1,
    "name": "ОУ Браќа Миладиновци",
    "code": "OU-BM"
  },
  "profile": {
    "theme_preference": "light",
    "language": "mk",
    "avatar_url": null,
    "phone": null
  }
}
```

Notes:
- For students, backend may include student-specific profile fields.
- For teachers, backend may include teacher profile fields such as title or department.

## `PATCH /profile`
Updates editable fields for the current user.

Request example:
```json
{
  "first_name": "Елена",
  "last_name": "Стојановска",
  "theme_preference": "dark",
  "language": "mk"
}
```

Success response:
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 24,
    "first_name": "Елена",
    "last_name": "Стојановска",
    "full_name": "Елена Стојановска"
  },
  "profile": {
    "theme_preference": "dark",
    "language": "mk"
  }
}
```

Validation notes:
- Unknown fields should be ignored or rejected with `422`
- Email change should be treated as a separate flow if backend does not support it here

## Frontend usage
1. Call `GET /profile` on profile page load when richer profile data is needed than `GET /auth/me`.
2. Save user-facing settings with `PATCH /profile`.
3. Refresh local cached user/profile state after successful update.
