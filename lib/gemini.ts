import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

export async function generateText(prompt: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model:    MODEL,
    messages: [{ role: 'user', content: prompt }],
  })
  return res.choices[0]?.message?.content ?? ''
}

// Groq tidak support vision — fallback ke text-based extraction
export async function generateTextWithImage(
  prompt:      string,
  _imageBase64: string,
  _mimeType:    string,
): Promise<string> {
  // Untuk foto buku, kirim prompt saja (image vision butuh Gemini)
  return generateText(prompt)
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

export function checkApiSecret(req: Request): boolean {
  const secret = req.headers.get('x-api-secret')
  return secret === process.env.API_SECRET
}

export function parseGeminiJson<T>(text: string): T {
  const clean = text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(clean) as T
}
