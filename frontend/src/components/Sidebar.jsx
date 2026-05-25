import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, PlusCircle, Settings, Package2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getProjects } from '../services/api'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/proyectos', label: 'Proyectos', icon: FolderOpen },
  { to: '/proyecto/nuevo', label: 'Nuevo Proyecto', icon: PlusCircle },
  { to: '/admin', label: 'Administración', icon: Settings },
]

export default function Sidebar() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    getProjects({ limit: 1 })
      .then((r) => setCount(r.data.total))
      .catch(() => {})
  }, [])

  return (
    <aside className="w-60 flex-shrink-0 bg-navy text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div
        className="px-6 py-5 border-b border-navy-light cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="flex items-center gap-2 mb-1">
          <Package2 size={22} className="text-blue-300" />
          <span className="font-bold text-lg tracking-tight">DIFORMA APU</span>
        </div>
        <span className="text-xs text-blue-300 font-medium">v1.0 – Calculadora de Empaques</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-blue-100 hover:bg-navy-light hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
            {label === 'Proyectos' && count > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-navy-light">
        <p className="text-xs text-blue-400">© 2026 Grupo DIFORMA</p>
        <p className="text-xs text-blue-400">Empaques de Cartón Colombia</p>
      </div>
    </aside>
  )
}
