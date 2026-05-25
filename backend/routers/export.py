from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import tempfile
import os

from database import get_db
from models import APUResult, Project, Material, Machine, Finish
from services.excel_exporter import export_to_excel

router = APIRouter()


@router.get("/excel/{apu_result_id}")
def export_excel(apu_result_id: str, db: Session = Depends(get_db)):
    apu = db.query(APUResult).filter(APUResult.id == apu_result_id).first()
    if not apu:
        raise HTTPException(status_code=404, detail="APU no encontrado.")

    project = db.query(Project).filter(Project.id == apu.project_id).first()
    material = db.query(Material).filter(Material.id == apu.material_id).first()
    machine = db.query(Machine).filter(Machine.id == apu.machine_id).first()
    finishes = db.query(Finish).filter(Finish.id.in_(apu.finish_ids)).all()

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    tmp.close()

    export_to_excel(
        filepath=tmp.name,
        project=project,
        material=material,
        machine=machine,
        finishes=finishes,
        apu=apu,
    )

    # Mark project as exported
    project.status = "exportado"
    db.commit()

    from datetime import datetime
    date_str = datetime.now().strftime("%Y%m%d")
    filename = f"APU_{project.code}_{date_str}.xlsx"

    return FileResponse(
        path=tmp.name,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
