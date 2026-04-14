export type Plan = 'free' | 'starter' | 'pro' | 'agency'
export type UserRole = 'owner' | 'member' | 'admin'
export type CarouselStatus = 'draft' | 'exported' | 'scheduled'
export type PostStatus = 'pending' | 'notified' | 'posted'

export interface Profile {
  id: string
  user_id: string
  organization_id: string | null
  role: UserRole
  display_name: string | null
  instagram_handle: string | null
  niche: string | null
  voice_profile: Record<string, unknown>
  visual_kit: {
    cor: string
    estilo: string
    fonte: string
  }
  plan: Plan
  exports_used_this_month: number
  exports_limit: number
  onboarding_completed: boolean
  telegram_chat_id: string | null
  created_at: string
}

export interface Organization {
  id: string
  owner_user_id: string
  name: string
  plan: Plan
  seats_used: number
  seats_limit: number
  created_at: string
}

export interface Carousel {
  id: string
  user_id: string
  analysis_id: string | null
  tema: string
  tom: string
  num_slides: number
  slides_json: CarouselSlide[]
  legenda: string | null
  html_url: string | null
  preview_token: string
  has_watermark: boolean
  status: CarouselStatus
  exported_at: string | null
  created_at: string
}

export interface CarouselSlide {
  id?: string
  carousel_id?: string
  position: number
  titulo: string
  corpo: string
  hack_aplicado: string | null
  bg_image_url: string | null
  custom_styles: Record<string, unknown>
}

export interface ScheduledPost {
  id: string
  user_id: string
  carousel_id: string | null
  tema: string | null
  scheduled_at: string
  notify_minutes_before: number
  telegram_notified: boolean
  status: PostStatus
  created_at: string
}

export interface UsageLog {
  id: string
  user_id: string
  action: string
  tokens_used: number
  cost_brl: number
  created_at: string
}

export interface WeeklyTrend {
  id: string
  nicho: string
  week_start: string
  temas: string[]
  created_at: string
}
