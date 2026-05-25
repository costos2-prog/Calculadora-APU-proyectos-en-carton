from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Finish
from schemas import FinishCreate, FinishUpdate, FinishOut

router = APIRouter()


@router.get("", response_model=list[FinishOut])
def list_finishes(db: Session = Depends(get_db)):
    return db.query(Finish).filter(Finish.is_active == True).order_by(Finish.name).all()


@router.get("/all", response_model=list[FinishOut])
def list_all_finishes(db: Session = Depends(get_db)):
    return db.query(Finish).order_by(Finish.name).all()


@router.post("", response_model=FinishOut, status_code=201)
def create_finish(data: FinishCreate, db: Session = Depends(get_db)):
    finish = Finish(**data.model_dump())
    db.add(finish)
    db.commit()
    db.refresh(finish)
    return finish


@router.put("/{finish_id}", response_model=FinishOut)
def update_finish(finish_id: int, data: FinishUpdate, db: Session = Depends(get_db)):
    finish = db.query(Finish).filter(Finish.id == finish_id).first()
    if not finish:
        raise HTTPException(status_code=404, detail="Acabado no encontrado.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(finish, field, value)
    db.commit()
    db.refresh(finish)
    return finish


@router.delete("/{finish_id}", status_code=204)
def delete_finish(finish_id: int, db: Session = Depends(get_db)):
    finish = db.query(Finish).filter(Finish.id == finish_id).first()
    if not finish:
        raise HTTPException(status_code=404, detail="Acabado no encontrado.")
    finish.is_active = False
    db.commit()
