// Shared theme helpers — handle both web format ("🧁 Bakery") and Android format ("bakery")

const EMOJI_MAP: Record<string, string> = {
  '⚽ sepak bola': '⚽', 'sepak bola': '⚽', 'sepak': '⚽',
  '🤖 robot': '🤖',     'robot': '🤖',
  '🎒 petualang': '🎒', 'petualang': '🎒',
  '🦕 dinosaurus': '🦕','dinosaurus': '🦕',
  '👑 princess': '👑',  'princess': '👑',
  '🐱 kucing': '🐱',    'kucing': '🐱',
  '🧁 bakery': '🧁',    'bakery': '🧁',
  '🧜‍♀️ putri duyung': '🧜‍♀️', 'putri duyung': '🧜‍♀️', 'putri': '🧜‍♀️',
}

export function themeEmoji(theme: string): string {
  if (!theme) return '🎒'
  return EMOJI_MAP[theme.toLowerCase()] ?? '🎒'
}

export function themeGradient(theme: string): { from: string; to: string; accent: string } {
  const t = theme.toLowerCase()
  if (t.includes('sepak') || t.includes('bola')) return { from: '#DCFCE7', to: '#BBF7D0', accent: '#16A34A' }
  if (t.includes('robot'))      return { from: '#DBEAFE', to: '#BFDBFE', accent: '#2563EB' }
  if (t.includes('petualang'))  return { from: '#FEF3C7', to: '#FDE68A', accent: '#D97706' }
  if (t.includes('dinosaurus')) return { from: '#CCFBF1', to: '#99F6E4', accent: '#0D9488' }
  if (t.includes('princess'))   return { from: '#FCE7F3', to: '#FBCFE8', accent: '#DB2777' }
  if (t.includes('kucing'))     return { from: '#EDE9FE', to: '#DDD6FE', accent: '#7C3AED' }
  if (t.includes('bakery'))     return { from: '#FFE4E6', to: '#FECDD3', accent: '#E11D48' }
  if (t.includes('duyung'))     return { from: '#CFFAFE', to: '#A5F3FC', accent: '#0891B2' }
  return { from: '#EFF6FF', to: '#DBEAFE', accent: '#0095F6' }
}
