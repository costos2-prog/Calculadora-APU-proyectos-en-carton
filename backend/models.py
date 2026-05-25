import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Integer, Text, DateTime, Enum, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    client = Column(String, nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum("borrador", "calculado", "exportado"), default="borrador")
    notes = Column(Text, nullable=True)
    dwg_filename = Column(String, nullable=True)

    apu_results = relationship("APUResult", back_populates="project", cascade="all, delete-orphan")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    material_type = Column(Enum("corrugado", "microcorrugado", "plegadizo"), nullable=False)
    flauta = Column(String, nullable=True)
    calibre = Column(String, nullable=True)
    thickness_mm = Column(Float, nullable=False)
    weight_gsm = Column(Float, nullable=False)
    liner_weight_gsm = Column(Float, nullable=True)
    sheet_width_cm = Column(Float, nullable=False)
    sheet_height_cm = Column(Float, nullable=False)
    price_per_m2 = Column(Float, nullable=False)
    waste_factor = Column(Float, default=0.15)
    supplier = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)


class Finish(Base):
    __tablename__ = "finishes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cost_per_m2 = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slot = Column(Integer, unique=True, nullable=False)
    name = Column(String, nullable=False)
    machine_type = Column(Enum("cnc", "troqueladora_pliego", "troqueladora_rodillo"), nullable=False)
    setup_time_hours = Column(Float, default=0.0)
    setup_cost_cop = Column(Float, default=0.0)
    machine_hour_cost = Column(Float, nullable=False)
    productivity_rate = Column(Float, nullable=False)
    productivity_unit = Column(String, default="piezas/hora")
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)


class GlobalConfig(Base):
    __tablename__ = "global_config"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class APUResult(Base):
    __tablename__ = "apu_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    finish_ids = Column(JSON, default=list)
    developed_width_cm = Column(Float, nullable=False)
    developed_height_cm = Column(Float, nullable=False)
    flute_direction = Column(Enum("vertical", "horizontal"), default="vertical")
    quantities_json = Column(JSON, default=list)
    results_json = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="apu_results")
    material = relationship("Material")
    machine = relationship("Machine")
