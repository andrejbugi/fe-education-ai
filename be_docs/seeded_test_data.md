# Seeded Test Data

This seed snapshot reflects the completed backend test data currently expected by the frontend docs.

## Totals
- Schools: 2
- Users: 130
- Teachers: 8
- Students: 120
- Admins: 2
- Classrooms: 11
- Subjects: 8
- Assignments: 24
- Assignment steps: 64
- Submissions: 48
- Step answers: 144
- Grades: 16
- Comments: 32
- Calendar events: 10
- Event participants: 56
- Notifications: 52
- Activity logs: 48
- School users: 130
- Teacher classrooms: 20
- Classroom users: 125
- Teacher subjects: 10

## School split
- `ОУ Браќа Миладиновци` (`OU-BM`) -> teachers: 4, students: 60, classrooms: 6
- `ОУ Кочо Рацин` (`OU-KO`) -> teachers: 4, students: 60, classrooms: 5

## What this enables
- Multi-school login and school switching
- Teacher dashboard and classroom lists with realistic counts
- Student assignment views with active submissions and graded work
- Calendar, notifications, comments, and activity-feed demos

## Cross-check notes
- `School users` equals all users because every seeded user belongs to one school
- `Classroom users` is higher than student count because some students can be enrolled in more than one classroom/subject grouping
- `Teacher classrooms` and `teacher subjects` represent many-to-many assignments, not unique teachers
