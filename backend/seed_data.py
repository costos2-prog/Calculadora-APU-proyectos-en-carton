"""Run this script once to populate the database with initial data."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
from models import Material, Machine, Finish, GlobalConfig

Base.metadata.create_all(bind=engine)

db = SessionLocal()


def seed():
    if db.query(Material).count() > 0:
        print("La base de datos ya tiene datos. Saltando seed.")
        db.close()
        return

    # ─── Materials: Corrugado ─────────────────────────────────────────────────
    corrugados = [
        {"name": "Corrugado A-150/150", "flauta": "A", "thickness_mm": 4.75, "weight_gsm": 450,
         "sheet_width_cm": 120, "sheet_height_cm": 80, "price_per_m2": 3200},
        {"name": "Corrugado A-200/150", "flauta": "A", "thickness_mm": 4.75, "weight_gsm": 550,
         "sheet_width_cm": 120, "sheet_height_cm": 80, "price_per_m2": 4100},
        {"name": "Corrugado B-150/150", "flauta": "B", "thickness_mm": 2.46, "weight_gsm": 375,
         "sheet_width_cm": 120, "sheet_height_cm": 80, "price_per_m2": 2800},
        {"name": "Corrugado B-200/150", "flauta": "B", "thickness_mm": 2.46, "weight_gsm": 450,
         "sheet_width_cm": 120, "sheet_height_cm": 80, "price_per_m2": 3100},
        {"name": "Corrugado C-150/150", "flauta": "C", "thickness_mm": 3.53, "weight_gsm": 400,
         "sheet_width_cm": 120, "sheet_height_cm": 80, "price_per_m2": 3000},
        {"name": "Corrugado C-200/150", "flauta": "C", "thickness_mm": 3.53, "weight_gsm": 500,
         "sheet_width_cm": 120, "sheet_height_cm": 80, "price_per_m2": 3400},
        {"name": "Corrugado C-200/200", "flauta": "C", "thickness_mm": 3.53, "weight_gsm": 600,
         "sheet_width_cm": 120, "sheet_height_cm": 80, "price_per_m2": 3800},
        {"name": "Corrugado C7 (BC 150/150/150)", "flauta": "BC", "thickness_mm": 6.00, "weight_gsm": 600,
         "sheet_width_cm": 150, "sheet_height_cm": 100, "price_per_m2": 5500},
        {"name": "Corrugado AC-200/150/200", "flauta": "AC", "thickness_mm": 8.00, "weight_gsm": 700,
         "sheet_width_cm": 150, "sheet_height_cm": 100, "price_per_m2": 7200},
    ]
    for m in corrugados:
        db.add(Material(
            material_type="corrugado", waste_factor=0.15, liner_weight_gsm=None,
            supplier=None, notes=None, **m
        ))

    # ─── Materials: Microcorrugado ────────────────────────────────────────────
    micros = [
        {"name": "Microcorrugado E-100/100", "flauta": "E", "thickness_mm": 1.50, "weight_gsm": 280,
         "sheet_width_cm": 100, "sheet_height_cm": 70, "price_per_m2": 3500},
        {"name": "Microcorrugado E-150/100", "flauta": "E", "thickness_mm": 1.50, "weight_gsm": 350,
         "sheet_width_cm": 100, "sheet_height_cm": 70, "price_per_m2": 4000},
        {"name": "Microcorrugado F-100/100", "flauta": "F", "thickness_mm": 0.80, "weight_gsm": 250,
         "sheet_width_cm": 100, "sheet_height_cm": 70, "price_per_m2": 4200},
    ]
    for m in micros:
        db.add(Material(
            material_type="microcorrugado", waste_factor=0.15, liner_weight_gsm=None,
            supplier=None, notes=None, **m
        ))

    # ─── Materials: Plegadiza ─────────────────────────────────────────────────
    plegadizas = [
        {"name": "Maule Calibre 12", "calibre": "12", "thickness_mm": 0.28, "weight_gsm": 250,
         "sheet_width_cm": 70, "sheet_height_cm": 100, "price_per_m2": 2200},
        {"name": "Maule Calibre 14", "calibre": "14", "thickness_mm": 0.32, "weight_gsm": 270,
         "sheet_width_cm": 70, "sheet_height_cm": 100, "price_per_m2": 2400},
        {"name": "Maule Calibre 15", "calibre": "15", "thickness_mm": 0.35, "weight_gsm": 285,
         "sheet_width_cm": 70, "sheet_height_cm": 100, "price_per_m2": 2600},
        {"name": "Maule Calibre 18", "calibre": "18", "thickness_mm": 0.40, "weight_gsm": 325,
         "sheet_width_cm": 70, "sheet_height_cm": 100, "price_per_m2": 2900},
        {"name": "Maule Calibre 22", "calibre": "22", "thickness_mm": 0.46, "weight_gsm": 380,
         "sheet_width_cm": 70, "sheet_height_cm": 100, "price_per_m2": 3200},
    ]
    for m in plegadizas:
        db.add(Material(
            material_type="plegadizo", waste_factor=0.12, flauta=None,
            liner_weight_gsm=None, supplier=None, notes=None, **m
        ))

    # ─── Finishes ─────────────────────────────────────────────────────────────
    finishes = [
        ("Sin acabado", 0),
        ("Impresión 1 tinta (flexo)", 800),
        ("Impresión 2 tintas (flexo)", 1400),
        ("Impresión 4 colores CMYK (offset)", 2200),
        ("Barniz UV brillante", 600),
        ("Barniz UV mate", 700),
        ("Laminado brillante (BOPP)", 1200),
        ("Laminado mate (BOPP)", 1300),
        ("Troquelado ventana PVC", 800),
        ("Perforación/microperforación", 300),
        ("Hot stamping (stamping dorado/plateado)", 1800),
        ("Gofrado/relieve", 1000),
    ]
    for name, cost in finishes:
        db.add(Finish(name=name, cost_per_m2=cost, is_active=True))

    # ─── Machines ─────────────────────────────────────────────────────────────
    db.add(Machine(
        slot=1, name="Mesa de Corte CNC", machine_type="cnc",
        setup_time_hours=0.5, setup_cost_cop=0, machine_hour_cost=45000,
        productivity_rate=50, productivity_unit="piezas/hora", is_active=True,
        notes="Ideal para prototipos y tirajes cortos. No requiere troquel físico.",
    ))
    db.add(Machine(
        slot=2, name="Troqueladora Plana de Pliego (Almeja)", machine_type="troqueladora_pliego",
        setup_time_hours=2, setup_cost_cop=0, machine_hour_cost=30000,
        productivity_rate=400, productivity_unit="golpes/hora", is_active=True,
        notes="Óptima para tirajes de 300–5.000 unidades. Requiere troquel físico.",
    ))
    db.add(Machine(
        slot=3, name="Troqueladora Rotativa de Rodillo", machine_type="troqueladora_rodillo",
        setup_time_hours=3, setup_cost_cop=0, machine_hour_cost=55000,
        productivity_rate=2000, productivity_unit="piezas/hora", is_active=True,
        notes="Alta producción. Requiere troquel rotativo. Eficiente para +5.000 unidades.",
    ))

    # ─── Global Config ────────────────────────────────────────────────────────
    config_entries = [
        ("labor_hour_base", "11000", "Costo hora MO base (COP) – SMLV + prestaciones ~52%"),
        ("labor_efficiency", "85", "Eficiencia de planta (%)"),
        ("cif_percentage", "12", "CIF – Costos Indirectos de Fabricación (%)"),
        ("admin_expense_percentage", "8", "Gastos administrativos (%)"),
        ("profit_margin", "15", "Margen de utilidad (%)"),
        ("vat_percentage", "19", "IVA Colombia (%) – no modificar"),
        ("die_base_cost", "1800000", "Costo base troquel (COP)"),
        ("supplies_per_m2", "400", "Insumos y consumibles por m² (COP)"),
        ("qc_packaging_percentage", "8", "Control calidad + empaque (% sobre costo directo)"),
        ("currency", "COP", "Moneda"),
    ]
    for key, value, description in config_entries:
        db.add(GlobalConfig(key=key, value=value, description=description))

    db.commit()
    db.close()
    print("✓ Datos iniciales cargados correctamente.")


if __name__ == "__main__":
    seed()
