from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from . import orm_models, schemas
from .database import Base, engine, get_db
from .domain import RecurrenceRule, RecurrenceType

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HouseholdTracker API", version="0.1.0")


def _recurrence_rule(task: orm_models.Task) -> RecurrenceRule:
    return RecurrenceRule(
        recurrence_type=RecurrenceType(task.recurrence_type),
        every_x_days=task.every_x_days,
    )


def _get_household_or_404(db: Session, household_id: int) -> orm_models.Household:
    household = db.get(orm_models.Household, household_id)
    if household is None:
        raise HTTPException(status_code=404, detail="Household not found")
    return household


def _get_task_or_404(db: Session, task_id: int) -> orm_models.Task:
    task = db.get(orm_models.Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/households", response_model=schemas.HouseholdOut, status_code=201)
def create_household(
    payload: schemas.HouseholdCreate, db: Session = Depends(get_db)
) -> orm_models.Household:
    household = orm_models.Household(name=payload.name)
    db.add(household)
    db.commit()
    db.refresh(household)
    return household


@app.get("/households/{household_id}", response_model=schemas.HouseholdOut)
def get_household(
    household_id: int, db: Session = Depends(get_db)
) -> orm_models.Household:
    return _get_household_or_404(db, household_id)


@app.post(
    "/households/{household_id}/members",
    response_model=schemas.PersonOut,
    status_code=201,
)
def add_member(
    household_id: int,
    payload: schemas.PersonCreate,
    db: Session = Depends(get_db),
) -> orm_models.Person:
    household = _get_household_or_404(db, household_id)
    member = orm_models.Person(name=payload.name, household_id=household.id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@app.post(
    "/households/{household_id}/tasks",
    response_model=schemas.TaskOut,
    status_code=201,
)
def create_task(
    household_id: int,
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
) -> orm_models.Task:
    household = _get_household_or_404(db, household_id)
    assignee = db.get(orm_models.Person, payload.assigned_to_id)
    if assignee is None or assignee.household_id != household.id:
        raise HTTPException(
            status_code=400,
            detail="assigned_to_id must reference a member of this household",
        )

    task = orm_models.Task(
        household_id=household.id,
        title=payload.title,
        description=payload.description,
        assigned_to_id=payload.assigned_to_id,
        due_date=payload.due_date,
        time_of_day=payload.time_of_day,
        recurrence_type=payload.recurrence_type.value,
        every_x_days=payload.every_x_days,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.get(
    "/households/{household_id}/tasks", response_model=list[schemas.TaskOut]
)
def list_tasks(
    household_id: int, db: Session = Depends(get_db)
) -> list[orm_models.Task]:
    _get_household_or_404(db, household_id)
    return (
        db.query(orm_models.Task)
        .filter(orm_models.Task.household_id == household_id)
        .all()
    )


@app.post("/tasks/{task_id}/complete", response_model=schemas.TaskOut)
def complete_task(task_id: int, db: Session = Depends(get_db)) -> orm_models.Task:
    task = _get_task_or_404(db, task_id)
    completed_at = datetime.now(timezone.utc)
    task.last_completed_at = completed_at
    task.due_date = _recurrence_rule(task).next_date(task.due_date)
    db.commit()
    db.refresh(task)
    return task


@app.post(
    "/households/{household_id}/vacation", response_model=list[schemas.TaskOut]
)
def set_vacation_mode(
    household_id: int,
    payload: schemas.VacationModeRequest,
    db: Session = Depends(get_db),
) -> list[orm_models.Task]:
    if payload.push_days < 0:
        raise HTTPException(status_code=400, detail="push_days must be >= 0")

    household = _get_household_or_404(db, household_id)
    household.vacation_mode = payload.push_days > 0
    tasks = (
        db.query(orm_models.Task)
        .filter(orm_models.Task.household_id == household_id)
        .all()
    )
    for task in tasks:
        task.due_date = task.due_date + timedelta(days=payload.push_days)
    db.commit()
    for task in tasks:
        db.refresh(task)
    return tasks
