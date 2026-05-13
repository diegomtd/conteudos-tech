export type TemplateId = 'impacto' | 'editorial' | 'lista' | 'citacao' | 'storytelling' | 'dados'

export interface TemplateConfig {
  font_size_title: number
  font_size_body: number
  title_uppercase: boolean
  title_letter_spacing: number
  text_position: 'bottom' | 'center' | 'top'
  overlay_opacity: number
  body_max_lines: number
  num_slides_sugerido: number
  show_slide_number?: boolean
  text_align?: 'left' | 'center' | 'right'
  accent_on_title?: boolean
}

export const TEMPLATE_CONFIG: Record<TemplateId, TemplateConfig> = {
  impacto:      { font_size_title: 96, font_size_body: 22, title_uppercase: true,  title_letter_spacing: 3, text_position: 'bottom', overlay_opacity: 60, body_max_lines: 3, num_slides_sugerido: 7 },
  editorial:    { font_size_title: 64, font_size_body: 26, title_uppercase: true,  title_letter_spacing: 1, text_position: 'center', overlay_opacity: 70, body_max_lines: 6, num_slides_sugerido: 10 },
  lista:        { font_size_title: 48, font_size_body: 28, title_uppercase: false, title_letter_spacing: 0, text_position: 'center', overlay_opacity: 65, body_max_lines: 5, num_slides_sugerido: 7,  show_slide_number: true },
  citacao:      { font_size_title: 52, font_size_body: 20, title_uppercase: false, title_letter_spacing: 0, text_position: 'center', overlay_opacity: 75, body_max_lines: 2, num_slides_sugerido: 5,  text_align: 'center' },
  storytelling: { font_size_title: 58, font_size_body: 24, title_uppercase: false, title_letter_spacing: 0, text_position: 'bottom', overlay_opacity: 55, body_max_lines: 5, num_slides_sugerido: 10 },
  dados:        { font_size_title: 88, font_size_body: 22, title_uppercase: true,  title_letter_spacing: 2, text_position: 'center', overlay_opacity: 70, body_max_lines: 3, num_slides_sugerido: 7,  accent_on_title: true },
}

export const TEMPLATES_META: Array<{ id: TemplateId; nome: string; descricao: string; icone: string }> = [
  { id: 'impacto',      nome: 'Impacto',       descricao: 'Título gigante, texto mínimo. Para ganchos que param o scroll.',   icone: '⚡' },
  { id: 'editorial',    nome: 'Editorial',      descricao: 'Equilíbrio entre título e corpo. Para conteúdo educativo denso.',  icone: '📰' },
  { id: 'lista',        nome: 'Lista',          descricao: 'Cada slide = 1 item de lista numerado. Para "X coisas que..."',    icone: '📋' },
  { id: 'citacao',      nome: 'Citação',        descricao: 'Frase de impacto centralizada. Para reflexões e provocações.',     icone: '💬' },
  { id: 'storytelling', nome: 'Bastidor',       descricao: 'Narrativa sequencial. Para contar histórias e casos reais.',       icone: '🎬' },
  { id: 'dados',        nome: 'Dado Chocante',  descricao: 'Número ou estatística em destaque. Para dados que impressionam.',  icone: '📊' },
]
