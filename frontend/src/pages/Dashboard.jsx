import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FolderOpen, Calendar, Download, ArrowRight } from 'lucide-react'
import { getProjects } from '../services/api'
import { formatDate, statusLabel, statusColor } from '../utils/formatters'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, exported: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [allRes, exportedRes] = await Promise.all([
          getProjects({ limit: 5 }),
          getProjects({ status: 'exportado', limit: 1 }),
        ])
        const all = allRes.data
        setRecent(all.items || [])

        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)

        const thisWeek = (all.items || []).filter((p) => new Date(p.date_created) >= weekStart).length

        setStats({
          total: all.total,
          thisWeek,
          exported: exportedRes.data.total,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">¡Bienvenido a DIFORMA APU!</h1>
        <p className="text-slate-500 mt-1 capitalize">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={<FolderOpen size={22} />} label="Total proyectos" value={stats.total} color="bg-blue-50 text-blue-600" />
        <StatCard icon={<Calendar size={22} />} label="Esta semana" value={stats.thisWeek} color="bg-green-50 text-green-600" />
        <StatCard icon={<Download size={22} />} label="Exportados" value={stats.exported} color="bg-orange-50 text-orange-600" />
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/proyecto/nuevo')}
        className="w-full flex items-center justify-center gap-3 bg-navy text-white py-4 rounded-xl text-lg font-semibold hover:bg-navy-light transition-colors mb-8 shadow-sm"
      >
        <PlusCircle size={24} />
        Nuevo Proyecto
      </button>

      {/* Recent */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Proyectos recientes</h2>
          <button
            onClick={() => navigate('/proyectos')}
            className="text-sm text-accent hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight size={14} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400">
            Aún no hay proyectos. ¡Crea el primero!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-3 py-3 font-medium">Nombre</th>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono font-medium text-navy">{p.code}</td>
                  <td className="px-3 py-3 text-slate-700">{p.name}</td>
                  <td className="px-3 py-3 text-slate-500">{p.client}</td>
                  <td className="px-3 py-3 text-slate-400">{formatDate(p.date_created)}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/proyecto/${p.id}/calcular`)}
                      className="text-accent hover:underline text-xs font-medium"
                    >
                      Abrir →
                    </button>
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

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
