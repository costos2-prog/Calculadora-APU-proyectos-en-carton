import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import NewProject from './pages/NewProject'
import Calculator from './pages/Calculator'
import ProjectList from './pages/ProjectList'
import Admin from './pages/Admin'

export default function App() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/proyectos" element={<ProjectList />} />
          <Route path="/proyecto/nuevo" element={<NewProject />} />
          <Route path="/proyecto/:id/calcular" element={<Calculator />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
