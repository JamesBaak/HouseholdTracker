from __future__ import annotations

from unittest import TestCase

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app


class ApiTests(TestCase):
    def setUp(self) -> None:
        # Fresh in-memory SQLite database per test for isolation.
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        testing_session_local = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

        def override_get_db():
            db = testing_session_local()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()
        self.engine.dispose()

    def _create_household_with_member(self) -> tuple[int, int]:
        household = self.client.post(
            "/households", json={"name": "Test Home"}
        ).json()
        member = self.client.post(
            f"/households/{household['id']}/members", json={"name": "Alex"}
        ).json()
        return household["id"], member["id"]

    def test_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_create_household_and_member(self) -> None:
        household_id, member_id = self._create_household_with_member()
        household = self.client.get(f"/households/{household_id}").json()
        self.assertEqual(household["name"], "Test Home")
        self.assertEqual(len(household["members"]), 1)
        self.assertEqual(household["members"][0]["id"], member_id)

    def test_task_requires_member_of_same_household(self) -> None:
        household_id, _ = self._create_household_with_member()
        other_household = self.client.post(
            "/households", json={"name": "Other Home"}
        ).json()
        other_member = self.client.post(
            f"/households/{other_household['id']}/members",
            json={"name": "Sam"},
        ).json()

        response = self.client.post(
            f"/households/{household_id}/tasks",
            json={
                "title": "Trash",
                "description": "Take out trash",
                "assigned_to_id": other_member["id"],
                "due_date": "2026-07-21",
                "time_of_day": "19:00:00",
                "recurrence_type": "weekly",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_task_lifecycle_completion_and_vacation_mode(self) -> None:
        household_id, member_id = self._create_household_with_member()
        task = self.client.post(
            f"/households/{household_id}/tasks",
            json={
                "title": "Water plants",
                "description": "Water indoor plants",
                "assigned_to_id": member_id,
                "due_date": "2026-07-21",
                "time_of_day": "09:00:00",
                "recurrence_type": "every_x_days",
                "every_x_days": 2,
            },
        ).json()
        self.assertEqual(task["due_date"], "2026-07-21")

        completed = self.client.post(f"/tasks/{task['id']}/complete").json()
        self.assertEqual(completed["due_date"], "2026-07-23")
        self.assertIsNotNone(completed["last_completed_at"])

        vacation_result = self.client.post(
            f"/households/{household_id}/vacation", json={"push_days": 10}
        ).json()
        self.assertEqual(vacation_result[0]["due_date"], "2026-08-02")

    def test_invalid_every_x_days_rejected(self) -> None:
        household_id, member_id = self._create_household_with_member()
        response = self.client.post(
            f"/households/{household_id}/tasks",
            json={
                "title": "Bad task",
                "assigned_to_id": member_id,
                "due_date": "2026-07-21",
                "time_of_day": "09:00:00",
                "recurrence_type": "weekly",
                "every_x_days": 3,
            },
        )
        self.assertEqual(response.status_code, 422)
