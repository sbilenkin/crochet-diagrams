from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user, get_db
from models import Project, ProjectData, User
from schemas.project import (
    CanvasSave,
    ProjectCreate,
    ProjectFull,
    ProjectSummary,
    ProjectUpdate,
)


router = APIRouter(prefix="/api/projects", tags=["projects"])


EMPTY_CANVAS = {"version": 1, "symbols": [], "connections": []}


def _owned_or_404(db: Session, project_id: UUID, user: User) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == user.user_id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("", response_model=list[ProjectSummary])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.user_id == current_user.user_id)
        .order_by(Project.updated_at.desc())
        .all()
    )


@router.post("", response_model=ProjectFull, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectFull:
    project = Project(
        user_id=current_user.user_id,
        name=payload.name,
        description=payload.description,
    )
    project.data = ProjectData(canvas_json=EMPTY_CANVAS)
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectFull(
        id=project.id,
        name=project.name,
        description=project.description,
        thumbnail=project.thumbnail,
        created_at=project.created_at,
        updated_at=project.updated_at,
        canvas_json=project.data.canvas_json,
    )


@router.get("/{project_id}", response_model=ProjectFull)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectFull:
    project = _owned_or_404(db, project_id, current_user)
    return ProjectFull(
        id=project.id,
        name=project.name,
        description=project.description,
        thumbnail=project.thumbnail,
        created_at=project.created_at,
        updated_at=project.updated_at,
        canvas_json=project.data.canvas_json if project.data else EMPTY_CANVAS,
    )


@router.put("/{project_id}", response_model=ProjectSummary)
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    project = _owned_or_404(db, project_id, current_user)
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}/canvas", response_model=ProjectSummary)
def save_canvas(
    project_id: UUID,
    payload: CanvasSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    project = _owned_or_404(db, project_id, current_user)
    if project.data is None:
        project.data = ProjectData(canvas_json=payload.canvas_json)
    else:
        project.data.canvas_json = payload.canvas_json
    if payload.thumbnail is not None:
        project.thumbnail = payload.thumbnail
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    project = _owned_or_404(db, project_id, current_user)
    db.delete(project)
    db.commit()
