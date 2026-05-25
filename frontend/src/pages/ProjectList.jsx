import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Edit, Calculator, Download, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjects, deleteProject, getAPUResult, exportExcel } from '../services/api'
import { formatDate, statusLabel, statusColor } from '../utils/formatters'

export default function ProjectList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProjects({ search, status: statusFilter || undefined, limit: 100 })
      setProjects(res.data.items || [])
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete(p) {
    if (!window.confirm(`¿Eliminar el proyecto "${p.code} – ${p.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteProject(p.id)
      toast.success('Proyecto eliminado.')
      load()
    } catch {
      toast.error('Error al eliminar el proyecto.')
    }
  }

  async function handleExport(p) {
    try {
      const apuRes = await getAPUResult(p.id)
      const apu = apuRes.data
      const fileRes = await exportExcel(apu.id)
      const url = URL.createObjectURL(fileRes.data)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.href = url
      a.download = `APU_${p.code}_${date}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel exportado correctamente.')
      load()
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Este proyecto no tiene un APU guardado. Primero calcule el APU.')
      } else {
        toast.error('Error al exportar Excel.')
      }
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Proyectos</h1>
          <p className="text-slate-500 text-sm mt-1">{total} proyectos en total</p>
        </div>
        <button onClick={() => navigate('/proyecto/nuevo')} className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} /> Nuevo Proyecto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            className="form-input pl-9"
            placeholder="Buscar por código, nombre o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="calculado">Calculado</option>
          <option value="exportado">Exportado</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No se encontraron proyectos.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-3 py-3 font-medium">Nombre</th>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-navy">{p.code}</td>
                  <td className="px-3 py-3 text-slate-700 max-w-[200px] truncate">{p.name}</td>
                  <td className="px-3 py-3 text-slate-500">{p.client}</td>
                  <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{formatDate(p.date_created)}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <ActionBtn
                        icon={<Calculator size={14} />}
                        label="Calcular"
                        onClick={() => navigate(`/proyecto/${p.id}/calcular`)}
                        className="text-accent hover:text-blue-700"
                      />
                      <ActionBtn
                        icon={<Download size={14} />}
                        label="Excel"
                        onClick={() => handleExport(p)}
                        className="text-green-600 hover:text-green-700"
                      />
                      <ActionBtn
                        icon={<Trash2 size={14} />}
                        label="Eliminar"
                        onClick={() => handleDelete(p)}
                        className="text-red-500 hover:text-red-700"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, className }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors ${className}`}
    >
      {icon} {label}
    </button>
  )
}
