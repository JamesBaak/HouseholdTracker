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