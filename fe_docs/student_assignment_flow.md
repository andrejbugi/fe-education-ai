# Student Assignment Flow (Frontend Logic)

## Core idea
The assignment workflow should clearly guide the student from **opening a task → solving it → submitting it → receiving teacher feedback**.

## Main flow
1. Teacher creates an **assignment** with instructions and steps.
2. The assignment is assigned to a **classroom or specific students**.
3. Students see the assignment on their **dashboard**.
4. Student opens the assignment and enters the **workspace**.

## Student solving flow
Inside the workspace:

1. Student reads assignment instructions and resources.
2. Assignment contains **ordered steps**.
3. Student answers steps one by one.
4. Each step can be:
   - auto-checked
   - or reviewed later by the teacher.

Step answers are saved inside a **submission**.

## Submission logic
When a student starts solving an assignment:

- a **submission record** is created for that student
- step answers are stored under that submission.

Students can:
- save progress
- continue later
- submit when finished.

## Teacher review flow
After submission:

1. Teacher opens the student's **submission**.
2. Teacher reviews step answers.
3. Teacher assigns a **grade**.
4. Teacher can leave **comments on the submission**.

Important rule:

Comments and grades belong to the **student submission**, not only to the assignment itself.

This allows teachers to give feedback specific to **that student’s work**.
