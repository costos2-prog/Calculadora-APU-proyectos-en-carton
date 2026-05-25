import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Save, Download, Plus, Trash2, Calculator as CalcIcon, AlertTriangle } from 'lucide-react'
import {
  getProject, getMaterials, getFinishes, getMachines,
  calculateAPU, saveAPUResult, getAPUResult, exportExcel,
} from '../services/api'
import { formatCOP, formatNumber, materialTypeLabel, machineTypeLabel } from '../utils/formatters'

const LS_KEY = (id) => `diforma_apu_calc_${id}`

function FluteDiagram({ direction }) {
  if (direction === 'vertical') {
    return (
      <div className="flex flex-col items-center gap-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-xs text-slate-500 mb-1">Flauta vertical ↕</div>
        <div className="flex gap-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {[...Array(8)].map((_, j) => (
                <div key={j} className="w-2 h-1.5 rounded-sm bg-navy opacity-70" />
              ))}
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-400 mt-1">↕ paralela al alto</div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="text-xs text-slate-500 mb-1">Flauta horizontal ↔</div>
      <div className="flex flex-col gap-0.5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-0.5">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="w-4 h-1.5 rounded-sm bg-navy opacity-70" />
            ))}
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 mt-1">↔ paralela al ancho</div>
    </div>
  )
}

function recommendProcess(qty) {
  if (!qty || qty <= 0) return null
  if (qty < 300) return { type: 'cnc', label: 'Mesa CNC – ideal para prototipos y tirajes cortos' }
  if (qty <= 5000) return { type: 'troqueladora_pliego', label: 'Troqueladora de Pliego – óptima para tirajes medios' }
  return { type: 'troqueladora_rodillo', label: 'Troqueladora de Rodillo – eficiente para alta producción' }
}

export default function Calculator() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  const [project, setProject] = useState(null)
  const [materials, setMaterials] = useState([])
  const [finishes, setFinishes] = useState([])
  const [machines, setMachines] = useState([])

  // Form state
  const [materialType, setMaterialType] = useState('corrugado')
  const [materialId, setMaterialId] = useState('')
  const [machineId, setMachineId] = useState('')
  const [selectedFinishes, setSelectedFinishes] = useState([])
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [fluteDir, setFluteDir] = useState('vertical')
  const [quantities, setQuantities] = useState([500, 1000, 2000])
  const [notes, setNotes] = useState('')

  // Results
  const [results, setResults] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [sizeError, setSizeError] = useState('')
  const [savedApuId, setSavedApuId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const filteredMaterials = materials.filter((m) => m.material_type === materialType)
  const selectedMaterial = materials.find((m) => m.id === Number(materialId))
  const selectedMachine = machines.find((m) => m.id === Number(machineId))
  const rec = recommendProcess(quantities[0])

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const [projRes, matRes, finRes, machRes] = await Promise.all([
          getProject(projectId),
          getMaterials({ active_only: true }),
          getFinishes(),
          getMachines(),
        ])
        setProject(projRes.data)
        setMaterials(matRes.data)
        setFinishes(finRes.data)
        setMachines(machRes.data.filter((m) => m.is_active))

        // Restore from localStorage
        const saved = localStorage.getItem(LS_KEY(projectId))
        if (saved) {
          try {
            const s = JSON.parse(saved)
            setMaterialType(s.materialType || 'corrugado')
            setMaterialId(s.materialId || '')
            setMachineId(s.machineId || '')
            setSelectedFinishes(s.selectedFinishes || [])
            setWidth(s.width || '')
            setHeight(s.height || '')
            setFluteDir(s.fluteDir || 'vertical')
            setQuantities(s.quantities || [500, 1000, 2000])
            setNotes(s.notes || '')
          } catch {}
        }

        // Load existing APU result
        try {
          const apuRes = await getAPUResult(projectId)
          setSavedApuId(apuRes.data.id)
        } catch {}
      } catch {
        toast.error('Error al cargar los datos del proyecto.')
      }
    }
    init()
  }, [projectId])

  // Set default machine based on recommendation
  useEffect(() => {
    if (!machineId && machines.length > 0 && rec) {
      const match = machines.find((m) => m.machine_type === rec.type)
      if (match) setMachineId(String(match.id))
    }
  }, [rec?.type, machines])

  // Validate piece vs sheet size
  useEffect(() => {
    if (!selectedMaterial || !width || !height) { setSizeError(''); return }
    const w = parseFloat(width)
    const h = parseFloat(height)
    const sw = selectedMaterial.sheet_width_cm
    const sh = selectedMaterial.sheet_height_cm
    const fitsNormal = w <= sw && h <= sh
    const fitsRotated = w <= sh && h <= sw
    if (!fitsNormal && !fitsRotated) {
      setSizeError(`⚠️ La pieza supera el tamaño del pliego (${sw}×${sh} cm). Seleccione un pliego mayor o ajuste las dimensiones.`)
    } else {
      setSizeError('')
    }
  }, [width, height, selectedMaterial])

  // Persist to localStorage
  useEffect(() => {
    const state = { materialType, materialId, machineId, selectedFinishes, width, height, fluteDir, quantities, notes }
    localStorage.setItem(LS_KEY(projectId), JSON.stringify(state))
  }, [materialType, materialId, machineId, selectedFinishes, width, height, fluteDir, quantities, notes, projectId])

  // Auto-calculate with debounce
  const triggerCalc = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (materialId && machineId && width && height && quantities.every((q) => q > 0) && !sizeError) {
        doCalculate()
      }
    }, 500)
  }, [materialId, machineId, width, height, quantities, selectedFinishes, fluteDir, sizeError])

  useEffect(() => { triggerCalc() }, [triggerCalc])

  async function doCalculate() {
    if (!materialId || !machineId || !width || !height) return
    const validQtys = quantities.filter((q) => q > 0)
    if (validQtys.length === 0) return
    setCalculating(true)
    try {
      const res = await calculateAPU({
        material_id: Number(materialId),
        machine_id: Number(machineId),
        finish_ids: selectedFinishes,
        developed_width_cm: parseFloat(width),
        developed_height_cm: parseFloat(height),
        flute_direction: fluteDir,
        quantities: validQtys,
      })
      setResults(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error en el cálculo.'
      toast.error(msg)
    } finally {
      setCalculating(false)
    }
  }

  async function handleSave() {
    if (!results) return
    setSaving(true)
    try {
      const res = await saveAPUResult({
        project_id: projectId,
        material_id: Number(materialId),
        machine_id: Number(machineId),
        finish_ids: selectedFinishes,
        developed_width_cm: parseFloat(width),
        developed_height_cm: parseFloat(height),
        flute_direction: fluteDir,
        quantities: results.quantities,
        notes,
      })
      setSavedApuId(res.data.id)
      toast.success('APU guardado correctamente.')
    } catch {
      toast.error('Error al guardar el APU.')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    if (!savedApuId) {
      toast.error('Primero guarda el APU antes de exportar.')
      return
    }
    setExporting(true)
    try {
      const res = await exportExcel(savedApuId)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.href = url
      a.download = `APU_${project?.code}_${date}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel exportado correctamente.')
    } catch {
      toast.error('Error al exportar Excel.')
    } finally {
      setExporting(false)
    }
  }

  function toggleFinish(id) {
    setSelectedFinishes((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  function addQuantity() {
    if (quantities.length < 5) setQuantities([...quantities, 0])
  }

  function removeQuantity(i) {
    if (quantities.length > 1) setQuantities(quantities.filter((_, idx) => idx !== i))
  }

  function setQty(i, val) {
    const next = [...quantities]
    next[i] = parseInt(val) || 0
    setQuantities(next)
  }

  const areaNeta = width && height ? ((parseFloat(width) * parseFloat(height)) / 10000).toFixed(4) : '–'
  const perimeter = width && height
    ? (2 * (parseFloat(width) + parseFloat(height))).toFixed(1)
    : '–'

  if (!project) return <div className="p-8 text-slate-500">Cargando proyecto...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
          <button onClick={() => navigate('/proyectos')} className="hover:text-accent">Proyectos</button>
          <span>›</span>
          <span className="text-navy font-medium">{project.code}</span>
        </div>
        <h1 className="text-xl font-bold text-navy">{project.name}</h1>
        <p className="text-slate-500 text-sm">Cliente: {project.client}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* ─── LEFT COLUMN: Form ─── */}
        <div className="space-y-5">

          {/* Section A: Dimensions */}
          <Section title="A. Dimensiones del desarrollo">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ancho del desarrollo (cm)">
                <input
                  type="number"
                  className="form-input"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.1"
                />
              </Field>
              <Field label="Alto del desarrollo (cm)">
                <input
                  type="number"
                  className="form-input"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.1"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <ReadField label="Perímetro total (cm)" value={perimeter} />
              <ReadField label="Área neta por pieza (m²)" value={areaNeta} />
            </div>
            {sizeError && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                {sizeError}
              </div>
            )}
          </Section>

          {/* Section B: Material */}
          <Section title="B. Material">
            <Field label="Tipo de material">
              <select
                className="form-input"
                value={materialType}
                onChange={(e) => { setMaterialType(e.target.value); setMaterialId('') }}
              >
                <option value="corrugado">Cartón Corrugado</option>
                <option value="microcorrugado">Cartón Microcorrugado</option>
                <option value="plegadizo">Cartulina Plegadiza Maule</option>
              </select>
            </Field>
            <Field label="Referencia de material" className="mt-3">
              <select
                className="form-input"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {filteredMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} – {m.flauta || `Cal.${m.calibre}`} | {m.sheet_width_cm}×{m.sheet_height_cm}cm | {formatCOP(m.price_per_m2)}/m²
                  </option>
                ))}
              </select>
            </Field>

            {selectedMaterial && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 grid grid-cols-2 gap-1">
                <span><b>Espesor:</b> {selectedMaterial.thickness_mm} mm</span>
                <span><b>Gramaje:</b> {selectedMaterial.weight_gsm} g/m²</span>
                <span><b>Pliego:</b> {selectedMaterial.sheet_width_cm}×{selectedMaterial.sheet_height_cm} cm</span>
                <span><b>Precio:</b> {formatCOP(selectedMaterial.price_per_m2)}/m²</span>
              </div>
            )}

            <div className="mt-3">
              <label className="form-label">Dirección de la flauta</label>
              <div className="flex gap-3">
                <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition-colors ${fluteDir === 'vertical' ? 'border-accent bg-blue-50' : 'border-slate-200'}`}>
                  <input type="radio" name="flute" value="vertical" checked={fluteDir === 'vertical'} onChange={() => setFluteDir('vertical')} className="sr-only" />
                  <div className="text-sm font-medium mb-2">↕ Vertical</div>
                  <FluteDiagram direction="vertical" />
                </label>
                <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition-colors ${fluteDir === 'horizontal' ? 'border-accent bg-blue-50' : 'border-slate-200'}`}>
                  <input type="radio" name="flute" value="horizontal" checked={fluteDir === 'horizontal'} onChange={() => setFluteDir('horizontal')} className="sr-only" />
                  <div className="text-sm font-medium mb-2">↔ Horizontal</div>
                  <FluteDiagram direction="horizontal" />
                </label>
              </div>
            </div>
          </Section>

          {/* Section C: Finishes */}
          <Section title="C. Acabados">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {finishes.map((f) => (
                <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedFinishes.includes(f.id)}
                    onChange={() => toggleFinish(f.id)}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-slate-700 flex-1">{f.name}</span>
                  {f.cost_per_m2 > 0 && (
                    <span className="text-xs text-slate-400">{formatCOP(f.cost_per_m2)}/m²</span>
                  )}
                </label>
              ))}
            </div>
            {selectedFinishes.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                Subtotal acabados: {formatCOP(finishes.filter((f) => selectedFinishes.includes(f.id)).reduce((s, f) => s + f.cost_per_m2, 0))}/m²
              </div>
            )}
          </Section>

          {/* Section D: Process */}
          <Section title="D. Proceso de producción">
            {rec && (
              <div className="mb-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-xs font-semibold text-green-700">Proceso recomendado:</span>
                <span className="text-xs text-green-700">{rec.label}</span>
              </div>
            )}
            <Field label="Seleccionar proceso / máquina">
              <select
                className="form-input"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{machineTypeLabel(m.machine_type)}] {m.name} – {formatCOP(m.machine_hour_cost)}/hora
                  </option>
                ))}
              </select>
            </Field>
            {selectedMachine && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 grid grid-cols-2 gap-1">
                <span><b>Setup:</b> {selectedMachine.setup_time_hours}h</span>
                <span><b>Costo/hora:</b> {formatCOP(selectedMachine.machine_hour_cost)}</span>
                <span><b>Productividad:</b> {formatNumber(selectedMachine.productivity_rate)} {selectedMachine.productivity_unit}</span>
                <span><b>Tipo:</b> {machineTypeLabel(selectedMachine.machine_type)}</span>
                {selectedMachine.notes && (
                  <span className="col-span-2 text-slate-500 italic">{selectedMachine.notes}</span>
                )}
              </div>
            )}
          </Section>

          {/* Section E: Quantities */}
          <Section title="E. Cantidades a producir">
            <div className="space-y-2">
              {quantities.map((q, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="number"
                    className="form-input flex-1"
                    value={q || ''}
                    onChange={(e) => setQty(i, e.target.value)}
                    placeholder="Cantidad"
                    min="1"
                  />
                  {quantities.length > 1 && (
                    <button onClick={() => removeQuantity(i)} className="text-red-400 hover:text-red-600 p-1.5">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {quantities.length < 5 && (
              <button onClick={addQuantity} className="mt-2 flex items-center gap-1 text-sm text-accent hover:underline">
                <Plus size={14} /> Agregar cantidad
              </button>
            )}
            <div className="mt-2">
              <Field label="Notas adicionales (opcional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="form-input resize-none text-xs"
                  placeholder="Observaciones del cálculo..."
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* ─── RIGHT COLUMN: Results ─── */}
        <div>
          <div className="sticky top-6 space-y-4">
            {calculating && (
              <div className="card p-4 text-center text-slate-500 text-sm">
                <div className="animate-pulse flex items-center justify-center gap-2">
                  <CalcIcon size={16} /> Calculando...
                </div>
              </div>
            )}

            {results && !calculating && (
              <>
                <ResultsTable results={results} />
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> {saving ? 'Guardando...' : 'Guardar APU'}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting || !savedApuId}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    title={!savedApuId ? 'Primero guarda el APU' : ''}
                  >
                    <Download size={16} /> {exporting ? 'Exportando...' : 'Exportar Excel'}
                  </button>
                </div>
                {!savedApuId && (
                  <p className="text-xs text-slate-400 text-center">Guarda el APU primero para poder exportar a Excel.</p>
                )}
              </>
            )}

            {!results && !calculating && (
              <div className="card p-8 text-center text-slate-400">
                <CalcIcon size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Completa los datos del formulario para ver los resultados del APU en tiempo real.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="section-header">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

function ReadField({ label, value }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="form-input bg-slate-50 text-slate-600 font-mono">{value}</div>
    </div>
  )
}

function ResultsTable({ results }) {
  const { quantities, results: rows } = results

  const tableRows = [
    { label: 'Piezas por pliego', key: 'pieces_per_sheet', fmt: 'int' },
    { label: 'Hojas requeridas', key: 'sheets_needed', fmt: 'int' },
    { label: 'Área bruta total (m²)', key: 'area_bruta_total_m2', fmt: 'dec4' },
    { section: 'Costos del Lote (COP)' },
    { label: 'Costo material', key: 'material_cost' },
    { label: 'Costo acabados', key: 'finish_cost' },
    { label: 'Costo troquel', key: 'die_cost_total' },
    { label: 'Setup máquina', key: 'setup_machine_cost' },
    { label: 'Mano de obra directa', key: 'labor_cost_total' },
    { label: 'Costo maquinaria', key: 'machine_cost_total' },
    { label: 'Insumos y consumibles', key: 'supplies_cost' },
    { label: 'Control calidad + empaque', key: 'qc_cost' },
    { label: 'COSTO DIRECTO TOTAL', key: 'direct_cost_total', bold: true },
    { section: 'Costos Unitarios (COP/ud)' },
    { label: 'Costo directo unitario', key: 'direct_cost_unit' },
    { label: 'CIF + Gastos adm.', key: 'cif_admin_unit' },
    { label: 'Utilidad', key: 'profit_unit' },
    { label: 'PRECIO NETO SIN IVA', key: 'net_price_unit', bold: true },
    { label: 'IVA 19%', key: 'vat_amount_unit' },
    { label: 'PRECIO FINAL CON IVA', key: 'final_price_unit', bold: true },
    { section: 'Totales del Lote' },
    { label: 'Total neto sin IVA', key: 'net_price_lot' },
    { label: 'TOTAL CON IVA', key: 'final_price_lot', bold: true },
    { label: 'Ahorro vs primera cantidad', key: '_savings' },
  ]

  const firstFinalPrice = rows[0]?.final_price_unit || 1

  function fmt(row, res) {
    if (row.key === '_savings') {
      if (res.quantity === quantities[0]) return '–'
      const pct = ((firstFinalPrice - res.final_price_unit) / firstFinalPrice * 100).toFixed(1)
      return `${pct}%`
    }
    const v = res[row.key]
    if (row.fmt === 'int') return formatNumber(v, 0)
    if (row.fmt === 'dec4') return formatNumber(v, 4)
    return formatCOP(v)
  }

  return (
    <div className="card overflow-auto max-h-[70vh]">
      <div className="section-header">Resultados del APU</div>
      <table className="w-full text-xs min-w-[500px]">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left px-3 py-2 font-medium text-slate-600 bg-slate-50 w-40">Concepto</th>
            {quantities.map((q) => (
              <th key={q} className="px-2 py-2 text-right font-medium text-slate-600 bg-slate-50 whitespace-nowrap">
                {formatNumber(q)} uds
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, i) => {
            if (row.section) {
              return (
                <tr key={i} className="bg-navy">
                  <td colSpan={quantities.length + 1} className="px-3 py-1.5 text-white text-xs font-semibold">
                    {row.section}
                  </td>
                </tr>
              )
            }
            return (
              <tr key={i} className={`border-b border-slate-50 ${row.bold ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <td className={`px-3 py-1.5 text-slate-600 ${row.bold ? 'font-semibold text-slate-800' : ''}`}>
                  {row.label}
                </td>
                {rows.map((res) => (
                  <td
                    key={res.quantity}
                    className={`px-2 py-1.5 text-right font-mono ${row.bold ? 'font-bold text-navy' : 'text-slate-700'}`}
                  >
                    {fmt(row, res)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
