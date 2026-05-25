from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Material
from schemas import MaterialCreate, MaterialUpdate, MaterialOut

router = APIRouter()


@router.get("", response_model=list[MaterialOut])
def list_materials(
    material_type: Optional[str] = Query(None),
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    query = db.query(Material)
    if active_only:
        query = query.filter(Material.is_active == True)
    if material_type:
        query = query.filter(Material.material_type == material_type)
    return query.order_by(Material.name).all()


@router.post("", response_model=MaterialOut, status_code=201)
def create_material(data: MaterialCreate, db: Session = Depends(get_db)):
    material = Material(**data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.put("/{material_id}", response_model=MaterialOut)
def update_material(material_id: int, data: MaterialUpdate, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(material, field, value)
    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}", status_code=204)
def deactivate_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado.")
    material.is_active = False
    db.commit()
