from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import GlobalConfig
from schemas import ConfigUpdate, ConfigOut

router = APIRouter()


@router.get("", response_model=list[ConfigOut])
def get_config(db: Session = Depends(get_db)):
    return db.query(GlobalConfig).all()


@router.put("")
def update_config(data: ConfigUpdate, db: Session = Depends(get_db)):
    for item in data.items:
        cfg = db.query(GlobalConfig).filter(GlobalConfig.key == item.key).first()
        if cfg:
            cfg.value = item.value
            if item.description:
                cfg.description = item.description
            cfg.updated_at = datetime.utcnow()
        else:
            cfg = GlobalConfig(key=item.key, value=item.value, description=item.description)
            db.add(cfg)
    db.commit()
    return {"ok": True}
