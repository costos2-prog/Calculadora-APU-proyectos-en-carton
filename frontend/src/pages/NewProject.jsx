import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { RefreshCw, Upload, ArrowRight } from 'lucide-react'
import { createProject, getNextCode, uploadDWG } from '../services/api'

const schema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  client: z.string().min(1, 'El cliente es obligatorio'),
  notes: z.string().optional(),
})

export default function NewProject() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dwgFile, setDwgFile] = useState(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    loadNextCode()
  }, [])

  async function loadNextCode() {
    try {
      const res = await getNextCode()
      setValue('code', res.data.code)
    } catch {}
  }

  async function onSubmit(data) {
    setLoading(true)
    try {
      const res = await createProject(data)
      const project = res.data
      if (dwgFile) {
        try {
          await uploadDWG(project.id, dwgFile)
        } catch {
          toast.error('Proyecto creado pero el archivo DWG no se pudo subir.')
        }
      }
      toast.success(`Proyecto ${project.code} creado correctamente.`)
      navigate(`/proyecto/${project.id}/calcular`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al crear el proyecto.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-2">Nuevo Proyecto</h1>
      <p className="text-slate-500 mb-8">Completa los datos del proyecto para continuar al cálculo APU.</p>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Code */}
          <div>
            <label className="form-label">Código del proyecto</label>
            <div className="flex gap-2">
              <input {...register('code')} className="form-input" placeholder="DF-2026-001" />
              <button
                type="button"
                onClick={loadNextCode}
                className="btn-secondary flex items-center gap-1 whitespace-nowrap"
              >
                <RefreshCw size={14} />
                Auto-generar
              </button>
            </div>
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="form-label">Nombre del proyecto</label>
            <input {...register('name')} className="form-input" placeholder="Caja dispensadora producto X" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Client */}
          <div>
            <label className="form-label">Cliente</label>
            <input {...register('client')} className="form-input" placeholder="Nombre del cliente" />
            {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Notas <span className="text-slate-400 font-normal">(opcional)</span></label>
            <textarea
              {...register('notes')}
              rows={3}
              className="form-input resize-none"
              placeholder="Observaciones adicionales del proyecto..."
            />
          </div>

          {/* DWG Upload */}
          <div>
            <label className="form-label">Archivo DWG/DXF <span className="text-slate-400 font-normal">(referencia, opcional)</span></label>
            <label className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-accent transition-colors">
              <Upload size={20} className="text-slate-400" />
              <span className="text-sm text-slate-500">
                {dwgFile ? dwgFile.name : 'Haz clic para seleccionar .dwg o .dxf'}
              </span>
              <input
                type="file"
                accept=".dwg,.dxf"
                className="hidden"
                onChange={(e) => setDwgFile(e.target.files[0] || null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            {loading ? 'Creando...' : <>Continuar al Cálculo <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
