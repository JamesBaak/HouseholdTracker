# HouseholdTracker

Minimal domain model for a portable household chore tracker app.

## Implemented requirements

- Household with shared members and shared tasks
- Task fields:
  - title
  - description
  - assigned person
  - time of day
- Recurring intervals:
  - daily
  - every X days
  - weekly
  - monthly
  - quarterly
  - biannually
  - annually
- Task completion flow (`mark_completed`) with recurrence advance
- Notification due check (`notification_due`)
- Vacation mode to push all household tasks by N days (`set_vacation_mode`)

## Run tests

```bash
python -m unittest discover -s tests -v
```

## Backend API (`backend/`)

A small FastAPI service exposes households/members/tasks over HTTP so every
household member's phone can read and write the same shared data instead of
storing it locally per device. It reuses the recurrence math from
`household_tracker` and persists data in SQLite via SQLAlchemy.

### Run the API

```bash
pip install -r backend/requirements.txt
cd backend
python -m uvicorn app.main:app --reload
```

The API is then available at `http://127.0.0.1:8000` (interactive docs at
`/docs`).

### Endpoints

| Method | Path                                | Description                              |
| ------ | ------------------------------------ | ----------------------------------------- |
| GET    | `/health`                             | Health check                              |
| POST   | `/households`                         | Create a household                        |
| GET    | `/households/{id}`                    | Get a household with its members          |
| POST   | `/households/{id}/members`            | Add a member to a household               |
| POST   | `/households/{id}/tasks`              | Create a task assigned to a member        |
| GET    | `/households/{id}/tasks`              | List a household's tasks                  |
| POST   | `/tasks/{id}/complete`                | Mark a task complete, advancing its due date |
| POST   | `/households/{id}/vacation`           | Push every task's due date by N days      |

### Run backend tests

```bash
pip install -r backend/requirements-dev.txt
python -m unittest discover -s backend/tests -v
```