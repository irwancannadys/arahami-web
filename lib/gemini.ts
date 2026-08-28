import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { adminAuth } from './firebase/admin'

// Groq — text tasks (generate topics, generate quiz)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// OpenRouter — vision tasks (analyze photo)
const openrouter = new OpenAI({
  apiKey:  process.env.OPENROUTER_API_KEY ?? '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://arahami-web.vercel.app',
    'X-Title':      'Arahami',
  },
})

export async function generateText(prompt: string, temperature = 1.0): Promise<string> {
  const res = await groq.chat.completions.create({
    model:       'openai/gpt-oss-120b',
    messages:    [{ role: 'user', content: prompt }],
    temperature,
  })
  return res.choices[0]?.message?.content ?? ''
}

export async function generateTextWithImage(
  prompt:      string,
  imageBase64: string,
  mimeType:    string,
): Promise<string> {
  // Vision via OpenRouter — llama vision model (free)
  const res = await openrouter.chat.completions.create({
    model: 'nvidia/nemotron-nano-12b-v2-vl:free',
    messages: [
      {
        role:    'user',
        content: [
          { type: 'text',      text:      prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
  })
  return res.choices[0]?.message?.content ?? ''
}

export const SUBJECT_LABELS: Record<string, string> = {
  PANCASILA: 'Pendidikan Pancasila',
  B_INDO:    'Bahasa Indonesia',
  MTK:       'Matematika',
  ENGLISH:   'Bahasa Inggris',
  IPA:       'IPA (Ilmu Pengetahuan Alam)',
  IPS:       'IPS (Ilmu Pengetahuan Sosial)',
  AGAMA:     'Pendidikan Agama',
  SENI:      'Seni Budaya',
  PJOK:      'PJOK (Pendidikan Jasmani)',
}

// Verifikasi Firebase ID Token beneran — dipakai route dari browser parent (Google
// Sign-In) dan generate-quiz dari Android (Anonymous Auth, gak ada UI login anak).
// Gak ada shared-secret lagi yang bisa kebaca dari JS bundle / decompile APK.
export async function checkAuth(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return false
  try {
    await adminAuth.verifyIdToken(idToken)
    return true
  } catch {
    return false
  }
}

export function parseGeminiJson<T>(text: string): T {
  // Hapus markdown code blocks
  let clean = text.replace(/```json\n?|\n?```/g, '').trim()

  // Coba parse langsung dulu
  try {
    return JSON.parse(clean) as T
  } catch {
    // Fallback: extract JSON array atau object dengan regex
    const arrayMatch = clean.match(/\[[\s\S]*\]/)
    const objMatch   = clean.match(/\{[\s\S]*\}/)
    const extracted  = arrayMatch?.[0] ?? objMatch?.[0] ?? clean

    // Hapus trailing commas sebelum ] atau }
    const fixed = extracted
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/\/\/.*/g, '')  // hapus komentar inline

    return JSON.parse(fixed) as T
  }
}
