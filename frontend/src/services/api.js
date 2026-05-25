import axios from 'axios'

// VITE_API_BASE is set in Vercel env vars to point to the Railway backend.
// In local dev, Vite's proxy forwards /api → localhost:8000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
})

// Projects
export const getProjects = (params) => api.get('/projects', { params })
export const getProject = (id) => api.get(`/projects/${id}`)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)
export const getNextCode = () => api.get('/projects/next-code')
export const uploadDWG = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/projects/${id}/upload-dwg`, form)
}

// Materials
export const getMaterials = (params) => api.get('/materials', { params })
export const createMaterial = (data) => api.post('/materials', data)
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data)
export const deleteMaterial = (id) => api.delete(`/materials/${id}`)

// Finishes
export const getFinishes = () => api.get('/finishes')
export const getAllFinishes = () => api.get('/finishes/all')
export const createFinish = (data) => api.post('/finishes', data)
export const updateFinish = (id, data) => api.put(`/finishes/${id}`, data)
export const deleteFinish = (id) => api.delete(`/finishes/${id}`)

// Machines
export const getMachines = () => api.get('/machines')
export const updateMachine = (slot, data) => api.put(`/machines/${slot}`, data)

// Config
export const getConfig = () => api.get('/config')
export const updateConfig = (items) => api.put('/config', { items })

// Calculations
export const calculateAPU = (data) => api.post('/calculate', data)
export const saveAPUResult = (data) => api.post('/apu-results', data)
export const getAPUResult = (projectId) => api.get(`/apu-results/${projectId}`)

// Export
export const exportExcel = (apuResultId) =>
  api.get(`/export/excel/${apuResultId}`, { responseType: 'blob' })

export default api
