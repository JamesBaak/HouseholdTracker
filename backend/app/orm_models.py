from __future__ import annotations

from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Household(Base):
    __tablename__ = "households"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    vacation_mode: Mapped[bool] = mapped_column(default=False)

    members: Mapped[list["Person"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="household", cascade="all, delete-orphan"
    )


class Person(Base):
    __tablename__ = "people"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    household_id: Mapped[int] = mapped_column(ForeignKey("households.id"))
    name: Mapped[str] = mapped_column(String, nullable=False)

    household: Mapped[Household] = relationship(back_populates="members")
    tasks: Mapped[list["Task"]] = relationship(back_populates="assigned_to")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    household_id: Mapped[int] = mapped_column(ForeignKey("households.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, default="")
    assigned_to_id: Mapped[int] = mapped_column(ForeignKey("people.id"))
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    time_of_day: Mapped[time] = mapped_column(Time, nullable=False)
    recurrence_type: Mapped[str] = mapped_column(String, nullable=False)
    every_x_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    household: Mapped[Household] = relationship(back_populates="tasks")
    assigned_to: Mapped[Person] = relationship(back_populates="tasks")
