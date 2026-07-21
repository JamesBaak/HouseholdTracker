from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from enum import Enum


class RecurrenceType(str, Enum):
    DAILY = "daily"
    EVERY_X_DAYS = "every_x_days"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    BIANNUALLY = "biannually"
    ANNUALLY = "annually"


def _days_in_month(year: int, month: int) -> int:
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    return (next_month - date(year, month, 1)).days


def _add_months(current: date, months: int) -> date:
    month_index = current.month - 1 + months
    year = current.year + month_index // 12
    month = month_index % 12 + 1
    day = min(current.day, _days_in_month(year, month))
    return date(year, month, day)


@dataclass(frozen=True)
class Person:
    name: str


@dataclass(frozen=True)
class RecurrenceRule:
    recurrence_type: RecurrenceType
    every_x_days: int | None = None

    def __post_init__(self) -> None:
        if self.recurrence_type == RecurrenceType.EVERY_X_DAYS:
            if self.every_x_days is None or self.every_x_days < 1:
                raise ValueError("every_x_days must be set and >= 1 for EVERY_X_DAYS")
        elif self.every_x_days is not None:
            raise ValueError("every_x_days is only valid for EVERY_X_DAYS")

    def next_date(self, from_date: date) -> date:
        if self.recurrence_type == RecurrenceType.DAILY:
            return from_date + timedelta(days=1)
        if self.recurrence_type == RecurrenceType.EVERY_X_DAYS:
            return from_date + timedelta(days=self.every_x_days or 1)
        if self.recurrence_type == RecurrenceType.WEEKLY:
            return from_date + timedelta(days=7)
        if self.recurrence_type == RecurrenceType.MONTHLY:
            return _add_months(from_date, 1)
        if self.recurrence_type == RecurrenceType.QUARTERLY:
            return _add_months(from_date, 3)
        if self.recurrence_type == RecurrenceType.BIANNUALLY:
            return _add_months(from_date, 6)
        if self.recurrence_type == RecurrenceType.ANNUALLY:
            return _add_months(from_date, 12)
        raise ValueError(f"Unsupported recurrence type: {self.recurrence_type}")


@dataclass
class Task:
    title: str
    description: str
    assigned_to: Person
    due_date: date
    time_of_day: time
    recurrence: RecurrenceRule
    completed_at: datetime | None = None
    completion_history: list[datetime] = field(default_factory=list)

    def mark_completed(self, completed_at: datetime | None = None) -> None:
        completion_time = completed_at or datetime.utcnow()
        self.completed_at = completion_time
        self.completion_history.append(completion_time)
        self.due_date = self.recurrence.next_date(self.due_date)

    def push_due_date(self, days: int) -> None:
        if days < 0:
            raise ValueError("days must be >= 0")
        self.due_date = self.due_date + timedelta(days=days)

    def due_datetime(self) -> datetime:
        return datetime.combine(self.due_date, self.time_of_day)

    def notification_due(self, now: datetime) -> bool:
        return now >= self.due_datetime()


@dataclass
class Household:
    name: str
    members: list[Person] = field(default_factory=list)
    tasks: list[Task] = field(default_factory=list)

    def add_member(self, person: Person) -> None:
        if person not in self.members:
            self.members.append(person)

    def add_task(self, task: Task) -> None:
        if task.assigned_to not in self.members:
            raise ValueError("Task assignee must be a household member")
        self.tasks.append(task)

    def set_vacation_mode(self, push_days: int) -> None:
        if push_days < 0:
            raise ValueError("push_days must be >= 0")
        for task in self.tasks:
            task.push_due_date(push_days)
