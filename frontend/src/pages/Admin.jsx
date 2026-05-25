import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react'
import {
  getMaterials, createMaterial, updateMaterial, deleteMaterial,
  getAllFinishes, createFinish, updateFinish, deleteFinish,
  getMachines, updateMachine,
  getConfig, updateConfig,
} from '../services/api'
import { formatCOP, materialTypeLabel, machineTypeLabel } from '../utils/formatters'

const TABS = ['Materiales', 'Acabados', 'Máquinas', 'Variables Globales']

export default function Admin() {
  const [tab, setTab] = useState(0)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-6">Panel de Administración</h1>
      <div className="flex border-b border-slate-200 mb-6">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === i ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <MaterialsTab />}
      {tab === 1 && <FinishesTab />}
      {tab === 2 && <MachinesTab />}
      {tab === 3 && <ConfigTab />}
    </div>
  )
}

// ─── Materials ─────────────────────────────────────────────────────────────────
function MaterialsTab() {
  const [materials, setMaterials] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const res = await getMaterials({ active_only: false, material_type: typeFilter || undefined })
    setMaterials(res.data)
  }

  useEffect(() => { load() }, [typeFilter])

  async function handleToggle(m) {
    try {
      await updateMaterial(m.id, { is_active: !m.is_active })
      toast.success(`Material ${m.is_active ? 'desactivado' : 'activado'}.`)
      load()
    } catch { toast.error('Error al actualizar.') }
  }

  async function handleSave(data) {
    try {
      if (editing?.id) {
        await updateMaterial(editing.id, data)
        toast.success('Material actualizado.')
      } else {
        await createMaterial(data)
        toast.success('Material creado.')
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar.')
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select className="form-input w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="corrugado">Corrugado</option>
          <option value="microcorrugado">Microcorrugado</option>
          <option value="plegadizo">Plegadizo</option>
        </select>
        <button onClick={() => { setEditing({}); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo material
        </button>
      </div>

      {showForm && (
        <MaterialForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <th className="px-4 py-2 text-left font-medium">Nombre</th>
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-left font-medium">Flauta/Cal.</th>
              <th className="px-3 py-2 text-right font-medium">Precio/m²</th>
              <th className="px-3 py-2 text-right font-medium">Pliego (cm)</th>
              <th className="px-3 py-2 text-center font-medium">Estado</th>
              <th className="px-4 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className={`border-b border-slate-50 ${!m.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2 font-medium text-slate-700">{m.name}</td>
                <td className="px-3 py-2 text-slate-500">{materialTypeLabel(m.material_type)}</td>
                <td className="px-3 py-2 text-slate-500">{m.flauta || m.calibre || '–'}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCOP(m.price_per_m2)}</td>
                <td className="px-3 py-2 text-right">{m.sheet_width_cm}×{m.sheet_height_cm}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => handleToggle(m)}>
                    {m.is_active
                      ? <ToggleRight size={18} className="text-green-500" />
                      : <ToggleLeft size={18} className="text-slate-400" />}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => { setEditing(m); setShowForm(true) }}
                    className="text-accent text-xs hover:underline"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MaterialForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', material_type: 'corrugado', flauta: '', calibre: '',
    thickness_mm: '', weight_gsm: '', sheet_width_cm: '', sheet_height_cm: '',
    price_per_m2: '', waste_factor: '0.15', supplier: '', notes: '',
    ...initial,
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    const data = {
      ...form,
      thickness_mm: parseFloat(form.thickness_mm),
      weight_gsm: parseFloat(form.weight_gsm),
      sheet_width_cm: parseFloat(form.sheet_width_cm),
      sheet_height_cm: parseFloat(form.sheet_height_cm),
      price_per_m2: parseFloat(form.price_per_m2),
      waste_factor: parseFloat(form.waste_factor),
      flauta: form.material_type !== 'plegadizo' ? form.flauta || null : null,
      calibre: form.material_type === 'plegadizo' ? form.calibre || null : null,
    }
    onSave(data)
  }

  return (
    <div className="card p-5 mb-4">
      <h3 className="font-semibold text-slate-800 mb-4">{initial?.id ? 'Editar' : 'Nuevo'} Material</h3>
      <form onSubmit={submit} className="grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <label className="form-label">Nombre</label>
          <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Tipo</label>
          <select className="form-input" value={form.material_type} onChange={(e) => set('material_type', e.target.value)}>
            <option value="corrugado">Corrugado</option>
            <option value="microcorrugado">Microcorrugado</option>
            <option value="plegadizo">Plegadizo</option>
          </select>
        </div>
        {form.material_type !== 'plegadizo' ? (
          <div>
            <label className="form-label">Flauta</label>
            <input className="form-input" value={form.flauta} onChange={(e) => set('flauta', e.target.value)} placeholder="A, B, C, E, BC..." />
          </div>
        ) : (
          <div>
            <label className="form-label">Calibre</label>
            <input className="form-input" value={form.calibre} onChange={(e) => set('calibre', e.target.value)} placeholder="12, 14, 15..." />
          </div>
        )}
        <div>
          <label className="form-label">Espesor (mm)</label>
          <input className="form-input" type="number" step="0.01" value={form.thickness_mm} onChange={(e) => set('thickness_mm', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Gramaje (g/m²)</label>
          <input className="form-input" type="number" value={form.weight_gsm} onChange={(e) => set('weight_gsm', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Ancho pliego (cm)</label>
          <input className="form-input" type="number" step="0.1" value={form.sheet_width_cm} onChange={(e) => set('sheet_width_cm', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Alto pliego (cm)</label>
          <input className="form-input" type="number" step="0.1" value={form.sheet_height_cm} onChange={(e) => set('sheet_height_cm', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Precio/m² (COP)</label>
          <input className="form-input" type="number" value={form.price_per_m2} onChange={(e) => set('price_per_m2', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Factor desperdicio</label>
          <input className="form-input" type="number" step="0.01" min="0" max="1" value={form.waste_factor} onChange={(e) => set('waste_factor', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="form-label">Proveedor (opcional)</label>
          <input className="form-input" value={form.supplier || ''} onChange={(e) => set('supplier', e.target.value)} />
        </div>
        <div className="col-span-3 flex gap-3 justify-end mt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  )
}

// ─── Finishes ─────────────────────────────────────────────────────────────────
function FinishesTab() {
  const [finishes, setFinishes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    const res = await getAllFinishes()
    setFinishes(res.data)
  }
  useEffect(() => { load() }, [])

  async function handleToggle(f) {
    await updateFinish(f.id, { is_active: !f.is_active })
    load()
  }

  async function handleSave(data) {
    try {
      if (editing?.id) {
        await updateFinish(editing.id, data)
        toast.success('Acabado actualizado.')
      } else {
        await createFinish(data)
        toast.success('Acabado creado.')
      }
      setShowForm(false); setEditing(null); load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar.')
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditing({}); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo acabado
        </button>
      </div>
      {showForm && (
        <FinishForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}
      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <th className="px-4 py-2 text-left font-medium">Nombre</th>
              <th className="px-3 py-2 text-right font-medium">Costo/m² (COP)</th>
              <th className="px-3 py-2 text-center font-medium">Activo</th>
              <th className="px-4 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {finishes.map((f) => (
              <tr key={f.id} className={`border-b border-slate-50 ${!f.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2 font-medium text-slate-700">{f.name}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCOP(f.cost_per_m2)}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => handleToggle(f)}>
                    {f.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-slate-400" />}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => { setEditing(f); setShowForm(true) }} className="text-accent text-xs hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FinishForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', description: '', cost_per_m2: 0, ...initial })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="card p-5 mb-4">
      <h3 className="font-semibold text-slate-800 mb-4">{initial?.id ? 'Editar' : 'Nuevo'} Acabado</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, cost_per_m2: parseFloat(form.cost_per_m2) }) }} className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="form-label">Nombre</label>
          <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Costo por m² (COP)</label>
          <input className="form-input" type="number" min="0" value={form.cost_per_m2} onChange={(e) => set('cost_per_m2', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Descripción (opcional)</label>
          <input className="form-input" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="col-span-2 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  )
}

// ─── Machines ─────────────────────────────────────────────────────────────────
function MachinesTab() {
  const [machines, setMachines] = useState([])

  async function load() {
    const res = await getMachines()
    setMachines(res.data)
  }
  useEffect(() => { load() }, [])

  async function handleSave(slot, data) {
    try {
      await updateMachine(slot, data)
      toast.success(`Máquina ${slot} actualizada.`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar.')
    }
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      {machines.map((m) => (
        <MachineCard key={m.slot} machine={m} onSave={(data) => handleSave(m.slot, data)} />
      ))}
    </div>
  )
}

function MachineCard({ machine, onSave }) {
  const [form, setForm] = useState({ ...machine })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    onSave({
      name: form.name,
      machine_type: form.machine_type,
      machine_hour_cost: parseFloat(form.machine_hour_cost),
      setup_time_hours: parseFloat(form.setup_time_hours),
      setup_cost_cop: parseFloat(form.setup_cost_cop),
      productivity_rate: parseFloat(form.productivity_rate),
      productivity_unit: form.productivity_unit,
      is_active: form.is_active,
      notes: form.notes,
    })
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy">Slot {machine.slot}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-slate-500">{form.is_active ? 'Activa' : 'Inactiva'}</span>
          <button type="button" onClick={() => set('is_active', !form.is_active)}>
            {form.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-slate-400" />}
          </button>
        </label>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="form-label">Nombre de la máquina</label>
          <input className="form-input text-xs" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Tipo</label>
          <select className="form-input text-xs" value={form.machine_type} onChange={(e) => set('machine_type', e.target.value)}>
            <option value="cnc">CNC</option>
            <option value="troqueladora_pliego">Troqueladora de Pliego</option>
            <option value="troqueladora_rodillo">Troqueladora de Rodillo</option>
          </select>
        </div>
        <div>
          <label className="form-label">Costo/hora (COP)</label>
          <input className="form-input text-xs" type="number" value={form.machine_hour_cost} onChange={(e) => set('machine_hour_cost', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="form-label">Setup (horas)</label>
            <input className="form-input text-xs" type="number" step="0.5" value={form.setup_time_hours} onChange={(e) => set('setup_time_hours', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Costo setup (COP)</label>
            <input className="form-input text-xs" type="number" value={form.setup_cost_cop} onChange={(e) => set('setup_cost_cop', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="form-label">Productividad</label>
            <input className="form-input text-xs" type="number" value={form.productivity_rate} onChange={(e) => set('productivity_rate', e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Unidad</label>
            <input className="form-input text-xs" value={form.productivity_unit} onChange={(e) => set('productivity_unit', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="form-label">Notas</label>
          <textarea className="form-input text-xs resize-none" rows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 text-xs">
          <Save size={14} /> Guardar máquina {machine.slot}
        </button>
      </form>
    </div>
  )
}

// ─── Global Config ─────────────────────────────────────────────────────────────
const CONFIG_FIELDS = [
  { key: 'labor_hour_base', label: 'Costo hora MO base (COP/hora)', type: 'number' },
  { key: 'labor_efficiency', label: 'Eficiencia de planta (%)', type: 'number', max: 100 },
  { key: 'cif_percentage', label: 'CIF – Costos Indirectos de Fabricación (%)', type: 'number', max: 100 },
  { key: 'admin_expense_percentage', label: 'Gastos administrativos (%)', type: 'number', max: 100 },
  { key: 'profit_margin', label: 'Margen de utilidad (%)', type: 'number', max: 100 },
  { key: 'vat_percentage', label: 'IVA (%)', type: 'number', disabled: true },
  { key: 'die_base_cost', label: 'Costo base troquel (COP)', type: 'number' },
  { key: 'supplies_per_m2', label: 'Insumos/consumibles por m² (COP)', type: 'number' },
  { key: 'qc_packaging_percentage', label: 'Control de calidad + empaque (%)', type: 'number', max: 100 },
]

function ConfigTab() {
  const [values, setValues] = useState({})
  const [descriptions, setDescriptions] = useState({})

  async function load() {
    const res = await getConfig()
    const vals = {}
    const descs = {}
    res.data.forEach((c) => { vals[c.key] = c.value; descs[c.key] = c.description })
    setValues(vals)
    setDescriptions(descs)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e) {
    e.preventDefault()
    try {
      const items = Object.entries(values).map(([key, value]) => ({
        key, value: String(value), description: descriptions[key],
      }))
      await updateConfig(items)
      toast.success('Configuración guardada correctamente.')
    } catch {
      toast.error('Error al guardar la configuración.')
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Advertencia:</strong> Cambiar estas variables afectará todos los cálculos futuros. Los APU ya guardados no se recalculan automáticamente.
        </p>
      </div>
      <form onSubmit={handleSave} className="card p-6 space-y-4">
        {CONFIG_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="form-label">{f.label}</label>
            <input
              className={`form-input ${f.disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              type={f.type}
              value={values[f.key] || ''}
              onChange={(e) => !f.disabled && setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              disabled={f.disabled}
              max={f.max}
              min={0}
              step="any"
            />
            {f.disabled && <p className="text-xs text-slate-400 mt-0.5">Este valor es fijo por normativa colombiana (IVA 19%).</p>}
          </div>
        ))}
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          <Save size={16} /> Guardar configuración
        </button>
      </form>
    </div>
  )
}
