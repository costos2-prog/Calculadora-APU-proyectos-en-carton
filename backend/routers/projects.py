import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Project
from schemas import ProjectCreate, ProjectUpdate, ProjectOut

router = APIRouter()

UPLOAD_DIR = "/tmp/uploads" if os.environ.get("VERCEL") else "uploads"


def get_next_project_code(db: Session) -> str:
    year = datetime.now().year
    last = (
        db.query(Project)
        .filter(Project.code.like(f"DF-{year}-%"))
        .order_by(Project.code.desc())
        .first()
    )
    if last:
        try:
            num = int(last.code.split("-")[-1]) + 1
        except ValueError:
            num = 1
    else:
        num = 1
    return f"DF-{year}-{num:03d}"


@router.get("", response_model=dict)
def list_projects(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Project)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Project.code.ilike(like))
            | (Project.name.ilike(like))
            | (Project.client.ilike(like))
        )
    if status:
        query = query.filter(Project.status == status)
    total = query.count()
    projects = query.order_by(Project.date_created.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": [ProjectOut.from_orm(p) for p in projects]}


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Project).filter(Project.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="El código de proyecto ya existe.")
    project = Project(id=str(uuid.uuid4()), **data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/next-code")
def next_code(db: Session = Depends(get_db)):
    return {"code": get_next_project_code(db)}


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    db.delete(project)
    db.commit()


@router.post("/{project_id}/upload-dwg")
async def upload_dwg(project_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    allowed = {".dwg", ".dxf"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .dwg y .dxf")
    filename = f"{project_id}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        content = await file.read()
        f.write(content)
    project.dwg_filename = file.filename
    db.commit()
    return {"filename": file.filename, "stored_as": filename}
