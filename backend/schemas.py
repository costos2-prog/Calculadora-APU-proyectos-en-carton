from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class MaterialType(str, Enum):
    corrugado = "corrugado"
    microcorrugado = "microcorrugado"
    plegadizo = "plegadizo"


class ProjectStatus(str, Enum):
    borrador = "borrador"
    calculado = "calculado"
    exportado = "exportado"


class MachineType(str, Enum):
    cnc = "cnc"
    troqueladora_pliego = "troqueladora_pliego"
    troqueladora_rodillo = "troqueladora_rodillo"


class FluteDirection(str, Enum):
    vertical = "vertical"
    horizontal = "horizontal"


# --- Project ---
class ProjectBase(BaseModel):
    code: str
    name: str
    client: str
    notes: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    client: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ProjectStatus] = None
    dwg_filename: Optional[str] = None


class ProjectOut(ProjectBase):
    id: str
    date_created: datetime
    status: ProjectStatus
    dwg_filename: Optional[str] = None

    class Config:
        from_attributes = True


# --- Material ---
class MaterialBase(BaseModel):
    name: str
    material_type: MaterialType
    flauta: Optional[str] = None
    calibre: Optional[str] = None
    thickness_mm: float = Field(gt=0)
    weight_gsm: float = Field(gt=0)
    liner_weight_gsm: Optional[float] = None
    sheet_width_cm: float = Field(gt=0)
    sheet_height_cm: float = Field(gt=0)
    price_per_m2: float = Field(gt=0)
    waste_factor: float = Field(default=0.15, ge=0, le=1)
    supplier: Optional[str] = None
    notes: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    material_type: Optional[MaterialType] = None
    flauta: Optional[str] = None
    calibre: Optional[str] = None
    thickness_mm: Optional[float] = None
    weight_gsm: Optional[float] = None
    liner_weight_gsm: Optional[float] = None
    sheet_width_cm: Optional[float] = None
    sheet_height_cm: Optional[float] = None
    price_per_m2: Optional[float] = None
    waste_factor: Optional[float] = None
    supplier: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class MaterialOut(MaterialBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# --- Finish ---
class FinishBase(BaseModel):
    name: str
    description: Optional[str] = None
    cost_per_m2: float = Field(ge=0)


class FinishCreate(FinishBase):
    pass


class FinishUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cost_per_m2: Optional[float] = None
    is_active: Optional[bool] = None


class FinishOut(FinishBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# --- Machine ---
class MachineBase(BaseModel):
    slot: int = Field(ge=1, le=3)
    name: str
    machine_type: MachineType
    setup_time_hours: float = Field(default=0.0, ge=0)
    setup_cost_cop: float = Field(default=0.0, ge=0)
    machine_hour_cost: float = Field(gt=0)
    productivity_rate: float = Field(gt=0)
    productivity_unit: str = "piezas/hora"
    notes: Optional[str] = None


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    machine_type: Optional[MachineType] = None
    setup_time_hours: Optional[float] = None
    setup_cost_cop: Optional[float] = None
    machine_hour_cost: Optional[float] = None
    productivity_rate: Optional[float] = None
    productivity_unit: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class MachineOut(MachineBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# --- Global Config ---
class ConfigItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class ConfigUpdate(BaseModel):
    items: List[ConfigItem]


class ConfigOut(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- APU Calculation ---
class APUInputParams(BaseModel):
    project_id: str
    material_id: int
    machine_id: int
    finish_ids: List[int] = []
    developed_width_cm: float = Field(gt=0)
    developed_height_cm: float = Field(gt=0)
    flute_direction: FluteDirection = FluteDirection.vertical
    quantities: List[int] = Field(min_length=1)
    notes: Optional[str] = None


class APUCalculateParams(BaseModel):
    material_id: int
    machine_id: int
    finish_ids: List[int] = []
    developed_width_cm: float = Field(gt=0)
    developed_height_cm: float = Field(gt=0)
    flute_direction: FluteDirection = FluteDirection.vertical
    quantities: List[int] = Field(min_length=1)


class APUResultOut(BaseModel):
    id: str
    project_id: str
    material_id: int
    machine_id: int
    finish_ids: List[int]
    developed_width_cm: float
    developed_height_cm: float
    flute_direction: str
    quantities_json: List[Any]
    results_json: Any
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
