import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import APUResult, Project, Material, Machine, Finish, GlobalConfig
from schemas import APUInputParams, APUCalculateParams, APUResultOut
from services.apu_calculator import calculate_apu

router = APIRouter()


def load_config(db: Session) -> dict:
    rows = db.query(GlobalConfig).all()
    return {r.key: float(r.value) if r.value.replace(".", "", 1).isdigit() else r.value for r in rows}


@router.post("/calculate")
def calculate_preview(params: APUCalculateParams, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == params.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado.")
    machine = db.query(Machine).filter(Machine.id == params.machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Máquina no encontrada.")
    finishes = db.query(Finish).filter(Finish.id.in_(params.finish_ids)).all()
    config = load_config(db)

    results = []
    for qty in params.quantities:
        res = calculate_apu(
            quantity=qty,
            developed_width_cm=params.developed_width_cm,
            developed_height_cm=params.developed_height_cm,
            flute_direction=params.flute_direction,
            material=material,
            machine=machine,
            finishes=finishes,
            config=config,
        )
        results.append(res)
    return {"quantities": params.quantities, "results": results}


@router.post("/apu-results", response_model=APUResultOut, status_code=201)
def save_apu_result(params: APUInputParams, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == params.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    material = db.query(Material).filter(Material.id == params.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado.")
    machine = db.query(Machine).filter(Machine.id == params.machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Máquina no encontrada.")
    finishes = db.query(Finish).filter(Finish.id.in_(params.finish_ids)).all()
    config = load_config(db)

    results = []
    for qty in params.quantities:
        res = calculate_apu(
            quantity=qty,
            developed_width_cm=params.developed_width_cm,
            developed_height_cm=params.developed_height_cm,
            flute_direction=params.flute_direction,
            material=material,
            machine=machine,
            finishes=finishes,
            config=config,
        )
        results.append(res)

    # Delete previous result for this project if exists
    db.query(APUResult).filter(APUResult.project_id == params.project_id).delete()

    apu = APUResult(
        id=str(uuid.uuid4()),
        project_id=params.project_id,
        material_id=params.material_id,
        machine_id=params.machine_id,
        finish_ids=params.finish_ids,
        developed_width_cm=params.developed_width_cm,
        developed_height_cm=params.developed_height_cm,
        flute_direction=params.flute_direction,
        quantities_json=params.quantities,
        results_json={"quantities": params.quantities, "results": results},
        notes=params.notes,
    )
    db.add(apu)
    project.status = "calculado"
    db.commit()
    db.refresh(apu)
    return apu


@router.get("/apu-results/{project_id}", response_model=APUResultOut)
def get_apu_result(project_id: str, db: Session = Depends(get_db)):
    apu = db.query(APUResult).filter(APUResult.project_id == project_id).first()
    if not apu:
        raise HTTPException(status_code=404, detail="APU no encontrado para este proyecto.")
    return apu
