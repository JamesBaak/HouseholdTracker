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

## Mobile app (`mobile/`)

A React Native app built with [Expo](https://expo.dev), so the same
TypeScript codebase runs on both Android and iOS. It talks to the backend
API above so household data is shared across every member's phone.

### Run it on your phone (fastest way, no native build required)

1. Start the backend API (see above) on a machine reachable from your phone's
   network, and note its LAN IP address (not `127.0.0.1`), e.g. `192.168.1.20`.
2. Install dependencies and start the dev server:
   ```bash
   cd mobile
   npm install
   EXPO_PUBLIC_API_URL=http://192.168.1.20:8000 npx expo start
   ```
3. Install the **Expo Go** app on your Android or iPhone from the Play Store /
   App Store.
4. Scan the QR code shown in the terminal/browser with Expo Go (Android) or
   the Camera app (iOS) — the app loads on your phone.

Your phone and the computer running the backend must be on the same Wi‑Fi
network for the app to reach the API.

### App features

- Create or join a household (shared via a household id)
- Add household members
- Create tasks with title, description, assignee, time of day, and a
  recurrence (daily, every X days, weekly, monthly, quarterly, biannually,
  annually)
- Mark tasks complete, which advances their due date per the recurrence rule
- Local notifications scheduled for each task's due date/time
- Vacation mode to push every task's due date by N days

### Build an installable app package

- Android APK/AAB or iOS build: use
  [`eas build`](https://docs.expo.dev/build/introduction/) (requires a free
  Expo account) — e.g. `npx eas build --platform android`. iOS builds and App
  Store/TestFlight distribution require an Apple Developer account.

### Type-check the mobile app

```bash
cd mobile
npx tsc --noEmit
```