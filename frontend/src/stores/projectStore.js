import { create } from 'zustand'

export const useProjectStore = create((set) => ({
  projects: [],
  total: 0,
  setProjects: (projects, total) => set({ projects, total }),
}))
