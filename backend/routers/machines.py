from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Machine
from schemas import MachineUpdate, MachineOut

router = APIRouter()


@router.get("", response_model=list[MachineOut])
def list_machines(db: Session = Depends(get_db)):
    return db.query(Machine).order_by(Machine.slot).all()


@router.put("/{slot}", response_model=MachineOut)
def update_machine(slot: int, data: MachineUpdate, db: Session = Depends(get_db)):
    if slot not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Slot debe ser 1, 2 o 3.")
    machine = db.query(Machine).filter(Machine.slot == slot).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Máquina no encontrada.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(machine, field, value)
    db.commit()
    db.refresh(machine)
    return machine
