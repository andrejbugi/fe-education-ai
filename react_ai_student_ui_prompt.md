# Prompt for AI Code Helper

Build a **simple React UI prototype** for a student AI learning
assistant.\
This is **frontend only**, **no API calls**, **no backend**, just UI/UX
and basic state.

Use **React functional components** and **simple CSS** (no UI
libraries).

The goal is to simulate how a **student solves a math problem
step-by-step with AI guidance**.

------------------------------------------------------------------------

# Application goal

A student sees:

1.  a **math equation**
2.  a **short AI tutor prompt**
3.  an **input field to enter the next step**
4.  **buttons to check the step or ask for hint**
5.  **feedback**
6.  **history of steps**

The UI should feel like a **learning tool**, not a chatbot.

------------------------------------------------------------------------

# Page layout

Centered card layout.

Top → bottom order:

1.  Header
2.  Problem card
3.  Tutor prompt card
4.  Step input
5.  Feedback
6.  Step history

------------------------------------------------------------------------

# Components to implement

Create these components:

## Header

Shows:

    Subject: Math
    Topic: Linear Equations
    Progress: Step 1 of 3

Include a **simple progress bar**.

------------------------------------------------------------------------

## ProblemCard

Displays the current problem.

Example content:

    Solve the equation:

    3x + 5 = 20

Equation should be **large and centered**.

------------------------------------------------------------------------

## TutorPromptCard

Shows a short AI guidance prompt.

Example:

    Think about isolating x.

    What should be the first step?

Important: Keep the prompt **short** like a tutor hint.

------------------------------------------------------------------------

## StepInputCard

Contains:

Input field

    Enter your next step
    [              ]

Buttons:

    Check Step
    Hint
    Skip

Store input with `useState`.

------------------------------------------------------------------------

## FeedbackBox

Shows result after pressing **Check Step**.

Simulate logic locally.

If student enters:

    3x = 15

show:

    Correct. You subtracted 5 from both sides.

Otherwise show:

    Not quite.

    Hint: apply the same operation to both sides.

------------------------------------------------------------------------

## StepHistory

Shows solved steps.

Example:

    Steps

    1. 3x = 15   ✓
    2. x = 5     ✓

Use a simple array stored in state.

------------------------------------------------------------------------

# State behavior (simple simulation)

Use React `useState`.

Initial state:

    problem: "3x + 5 = 20"
    currentStep: 1
    steps: []
    feedback: ""

Logic for **Check Step button**:

If input equals `"3x = 15"`:

-   add step to history
-   show success feedback
-   update step number

Otherwise show hint.

This is **just UI simulation**, not a real solver.

------------------------------------------------------------------------

# Styling requirements

Use **clean student-friendly UI**.

Design rules:

-   centered layout
-   cards with rounded borders
-   soft colors
-   large equation text
-   plenty of spacing

Example visual layout:

    +------------------------------------+
    | Math / Linear Equations  Step 1/3 |
    | [ progress bar ]                   |
    +------------------------------------+

    +------------------------------------+
    | Solve the equation                 |
    |                                    |
    |        3x + 5 = 20                 |
    +------------------------------------+

    +------------------------------------+
    | Tutor                              |
    | What should be the first step      |
    | to isolate x?                      |
    +------------------------------------+

    +------------------------------------+
    | Enter next step                    |
    | [ 3x = 15                     ]    |
    |                                    |
    | [Check Step] [Hint] [Skip]         |
    +------------------------------------+

    +------------------------------------+
    | Feedback                           |
    | Correct. You subtracted 5.         |
    +------------------------------------+

    +------------------------------------+
    | Steps                              |
    | 1. 3x = 15 ✓                       |
    +------------------------------------+

------------------------------------------------------------------------

# Project structure

    src
     ├── components
     │    ├── Header.jsx
     │    ├── ProblemCard.jsx
     │    ├── TutorPromptCard.jsx
     │    ├── StepInputCard.jsx
     │    ├── FeedbackBox.jsx
     │    ├── StepHistory.jsx
     │    └── StepItem.jsx
     │
     ├── pages
     │    └── StudentWorkspace.jsx
     │
     ├── App.jsx
     └── styles.css

------------------------------------------------------------------------

# Important constraints

Do NOT implement:

-   API calls
-   authentication
-   backend
-   AI integration

This is **only a UI prototype** to visualize the student learning flow.

------------------------------------------------------------------------

Optional polish:

-   smooth button hover
-   simple progress bar animation
-   clear spacing between cards

Focus on **clean and readable student UI**.
