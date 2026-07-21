from __future__ import annotations

from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, field_validator

from .domain import RecurrenceType


class PersonCreate(BaseModel):
    name: str


class PersonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class HouseholdCreate(BaseModel):
    name: str


class HouseholdOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    vacation_mode: bool
    members: list[PersonOut] = []


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    assigned_to_id: int
    due_date: date
    time_of_day: time
    recurrence_type: RecurrenceType
    every_x_days: int | None = None

    @field_validator("every_x_days")
    @classmethod
    def validate_every_x_days(cls, value, info):
        recurrence_type = info.data.get("recurrence_type")
        if recurrence_type == RecurrenceType.EVERY_X_DAYS:
            if value is None or value < 1:
                raise ValueError("every_x_days must be >= 1 for EVERY_X_DAYS")
        elif value is not None:
            raise ValueError("every_x_days is only valid for EVERY_X_DAYS")
        return value


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    assigned_to_id: int
    due_date: date
    time_of_day: time
    recurrence_type: RecurrenceType
    every_x_days: int | None
    last_completed_at: datetime | None


class VacationModeRequest(BaseModel):
    push_days: int
