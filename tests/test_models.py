from datetime import date, datetime, time
from unittest import TestCase

from household_tracker.models import (
    Household,
    Person,
    RecurrenceRule,
    RecurrenceType,
    Task,
)


class RecurrenceRuleTests(TestCase):
    def test_supported_intervals(self) -> None:
        start = date(2026, 1, 31)

        self.assertEqual(
            RecurrenceRule(RecurrenceType.DAILY).next_date(start), date(2026, 2, 1)
        )
        self.assertEqual(
            RecurrenceRule(RecurrenceType.EVERY_X_DAYS, every_x_days=5).next_date(start),
            date(2026, 2, 5),
        )
        self.assertEqual(
            RecurrenceRule(RecurrenceType.WEEKLY).next_date(start), date(2026, 2, 7)
        )
        self.assertEqual(
            RecurrenceRule(RecurrenceType.MONTHLY).next_date(start), date(2026, 2, 28)
        )
        self.assertEqual(
            RecurrenceRule(RecurrenceType.QUARTERLY).next_date(start), date(2026, 4, 30)
        )
        self.assertEqual(
            RecurrenceRule(RecurrenceType.BIANNUALLY).next_date(start),
            date(2026, 7, 31),
        )
        self.assertEqual(
            RecurrenceRule(RecurrenceType.ANNUALLY).next_date(start), date(2027, 1, 31)
        )


class HouseholdTaskTests(TestCase):
    def setUp(self) -> None:
        self.alex = Person(name="Alex")
        self.sam = Person(name="Sam")
        self.household = Household(name="Home", members=[self.alex])

    def test_task_must_be_assigned_to_household_member(self) -> None:
        task = Task(
            title="Take out trash",
            description="Move bins to curb",
            assigned_to=self.sam,
            due_date=date(2026, 7, 21),
            time_of_day=time(19, 0),
            recurrence=RecurrenceRule(RecurrenceType.WEEKLY),
        )

        with self.assertRaises(ValueError):
            self.household.add_task(task)

    def test_task_completion_and_notification(self) -> None:
        task = Task(
            title="Clean kitchen",
            description="Wipe counters and sweep floor",
            assigned_to=self.alex,
            due_date=date(2026, 7, 21),
            time_of_day=time(18, 30),
            recurrence=RecurrenceRule(RecurrenceType.DAILY),
        )
        self.household.add_task(task)

        self.assertFalse(task.notification_due(datetime(2026, 7, 21, 18, 29)))
        self.assertTrue(task.notification_due(datetime(2026, 7, 21, 18, 30)))

        task.mark_completed(datetime(2026, 7, 21, 19, 0))
        self.assertEqual(task.due_date, date(2026, 7, 22))
        self.assertEqual(len(task.completion_history), 1)

    def test_vacation_mode_pushes_all_tasks(self) -> None:
        task = Task(
            title="Water plants",
            description="Water indoor plants",
            assigned_to=self.alex,
            due_date=date(2026, 7, 21),
            time_of_day=time(9, 0),
            recurrence=RecurrenceRule(RecurrenceType.EVERY_X_DAYS, every_x_days=2),
        )
        self.household.add_task(task)

        self.household.set_vacation_mode(push_days=10)
        self.assertEqual(task.due_date, date(2026, 7, 31))
