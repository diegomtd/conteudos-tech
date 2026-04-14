import { create } from 'zustand'
import type { Profile, Carousel } from '@/types'

interface AppState {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void

  currentCarousel: Carousel | null
  setCurrentCarousel: (carousel: Carousel | null) => void

  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  currentCarousel: null,
  setCurrentCarousel: (carousel) => set({ currentCarousel: carousel }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
