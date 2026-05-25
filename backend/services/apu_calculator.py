from math import floor, ceil
from typing import List


def recommend_process(quantity: int) -> str:
    if quantity < 300:
        return "cnc"
    elif quantity <= 5000:
        return "troqueladora_pliego"
    else:
        return "troqueladora_rodillo"


def recommend_process_label(quantity: int) -> str:
    rec = recommend_process(quantity)
    labels = {
        "cnc": "Mesa CNC – ideal para prototipos y tirajes cortos",
        "troqueladora_pliego": "Troqueladora de Pliego – óptima para tirajes medios",
        "troqueladora_rodillo": "Troqueladora de Rodillo – eficiente para alta producción",
    }
    return labels[rec]


def calculate_apu(
    quantity: int,
    developed_width_cm: float,
    developed_height_cm: float,
    flute_direction: str,
    material,
    machine,
    finishes: List,
    config: dict,
) -> dict:
    # A. Material consumption
    if flute_direction == "vertical":
        piece_w = developed_width_cm
        piece_h = developed_height_cm
    else:
        piece_w = developed_height_cm
        piece_h = developed_width_cm

    sheet_w = material.sheet_width_cm
    sheet_h = material.sheet_height_cm

    pieces_per_row = floor(sheet_w / piece_w) if piece_w > 0 else 0
    pieces_per_col = floor(sheet_h / piece_h) if piece_h > 0 else 0
    pieces_per_sheet = max(1, pieces_per_row * pieces_per_col)

    sheets_needed = ceil(quantity / pieces_per_sheet)

    area_neta_m2 = (developed_width_cm * developed_height_cm) / 10000
    waste_factor = material.waste_factor
    area_bruta_total_m2 = sheets_needed * (sheet_w * sheet_h / 10000) * (1 + waste_factor)

    material_cost = area_bruta_total_m2 * material.price_per_m2

    # B. Finishes
    finish_cost_per_m2 = sum(f.cost_per_m2 for f in finishes)
    finish_cost = finish_cost_per_m2 * area_bruta_total_m2

    # C. Die / Troquel
    die_base_cost = float(config.get("die_base_cost", 1800000))
    # CNC does not require physical die
    if machine.machine_type == "cnc":
        die_cost_total = 0.0
    else:
        die_cost_total = die_base_cost
    die_unit_cost = die_cost_total / quantity if quantity > 0 else 0

    # D. Labor
    labor_hour_base = float(config.get("labor_hour_base", 11000))
    labor_efficiency = float(config.get("labor_efficiency", 85))
    labor_hour_real = labor_hour_base / (labor_efficiency / 100)

    production_hours = sheets_needed / machine.productivity_rate
    setup_hours = machine.setup_time_hours
    total_operative_hours = production_hours + setup_hours

    labor_cost_total = total_operative_hours * labor_hour_real

    # E. Machine cost
    machine_cost_total = total_operative_hours * machine.machine_hour_cost + machine.setup_cost_cop

    # F. Supplies
    supplies_per_m2 = float(config.get("supplies_per_m2", 400))
    supplies_cost = area_bruta_total_m2 * supplies_per_m2

    # G. QC + packaging
    qc_pct = float(config.get("qc_packaging_percentage", 8))
    subtotal_before_qc = (
        material_cost + finish_cost + die_cost_total
        + labor_cost_total + machine_cost_total + supplies_cost
    )
    qc_cost = subtotal_before_qc * (qc_pct / 100)

    # H. Direct cost
    direct_cost_total = subtotal_before_qc + qc_cost
    direct_cost_unit = direct_cost_total / quantity if quantity > 0 else 0

    # I. Selling price
    cif_pct = float(config.get("cif_percentage", 12))
    admin_pct = float(config.get("admin_expense_percentage", 8))
    profit_pct = float(config.get("profit_margin", 15))
    vat_pct = float(config.get("vat_percentage", 19))

    cif_admin = direct_cost_unit * ((cif_pct + admin_pct) / 100)
    subtotal_with_overhead = direct_cost_unit + cif_admin
    profit = subtotal_with_overhead * (profit_pct / 100)
    net_price_unit = subtotal_with_overhead + profit
    vat_amount_unit = net_price_unit * (vat_pct / 100)
    final_price_unit = net_price_unit + vat_amount_unit

    net_price_lot = net_price_unit * quantity
    final_price_lot = final_price_unit * quantity

    return {
        "quantity": quantity,
        # Material params
        "pieces_per_sheet": pieces_per_sheet,
        "sheets_needed": sheets_needed,
        "area_neta_m2": round(area_neta_m2, 4),
        "area_bruta_total_m2": round(area_bruta_total_m2, 4),
        # Lot costs
        "material_cost": round(material_cost, 2),
        "finish_cost": round(finish_cost, 2),
        "die_cost_total": round(die_cost_total, 2),
        "setup_machine_cost": round(machine.setup_cost_cop, 2),
        "labor_cost_total": round(labor_cost_total, 2),
        "machine_cost_total": round(machine_cost_total, 2),
        "supplies_cost": round(supplies_cost, 2),
        "qc_cost": round(qc_cost, 2),
        "direct_cost_total": round(direct_cost_total, 2),
        # Unit costs
        "direct_cost_unit": round(direct_cost_unit, 2),
        "cif_admin_unit": round(cif_admin, 2),
        "profit_unit": round(profit, 2),
        "net_price_unit": round(net_price_unit, 2),
        "vat_amount_unit": round(vat_amount_unit, 2),
        "final_price_unit": round(final_price_unit, 2),
        # Lot totals
        "net_price_lot": round(net_price_lot, 2),
        "final_price_lot": round(final_price_lot, 2),
        # Metadata
        "recommended_process": recommend_process(quantity),
        "recommended_process_label": recommend_process_label(quantity),
        "production_hours": round(production_hours, 4),
        "setup_hours": setup_hours,
        "total_operative_hours": round(total_operative_hours, 4),
        "labor_hour_real": round(labor_hour_real, 2),
    }
