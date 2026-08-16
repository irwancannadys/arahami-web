// ─── Mirror dari Android data models ─────────────────────────────────────────

export interface Child {
  id:             string
  parentId:       string
  name:           string
  kelas:          number
  gender:         string
  theme:          string
  childCode:      string
  customSubjects: string[]
  xp:             number
  level:          number
  streak:         number
  lastActiveDate:  string
  enabledRewards?: string[]
  enableWeekend?:  boolean
  fcmToken?:       string
  createdAt?:      Date
}

export interface Schedule {
  id:       string
  day:      string
  subjects: string[]
}

export interface Topic {
  id:        string
  subject:   string
  topicName: string
  source:    string
  isDone:    boolean
  order:     number
}

export interface QuizAnswerDetail {
  questionText:  string
  userAnswer:    string   // jawaban anak (display text), kosong kalau benar
  correctAnswer: string   // jawaban benar (display text)
  isCorrect:     boolean
}

export interface QuizSession {
  id:            string
  subject:       string
  topicId:       string
  topicName:     string
  score:         number
  totalQ:        number
  correctQ:      number
  answers:       string[]            // "CORRECT"/"WRONG" per soal (basic display)
  answerDetails: QuizAnswerDetail[]  // detail per soal (teks soal + jawaban)
  date?:         Date
}

export interface Reward {
  id:         string
  childId:    string
  request:    string
  score:      number
  sessionId:  string
  status:     'PENDING' | 'APPROVED' | 'REJECTED'
  parentNote: string
  createdAt?: Date
}

export interface ThreadMessage {
  id:        string
  text:      string
  sender:    'parent' | 'child'
  replies:   ThreadReply[]
  createdAt?: Date
}

export interface ThreadReply {
  text:      string
  sender:    'parent' | 'child'
  createdAt?: Date
}

export interface ChatMessage {
  id:        string
  text:      string
  sender:    'parent' | 'child'
  isRead:    boolean
  createdAt?: Date
}

// ─── Subject constants ────────────────────────────────────────────────────────
export const Subject = {
  PANCASILA: 'PANCASILA',
  B_INDO:    'B_INDO',
  MTK:       'MTK',
  ENGLISH:   'ENGLISH',
  IPA:       'IPA',
  IPS:       'IPS',
  AGAMA:     'AGAMA',
  SENI:      'SENI',
  PJOK:      'PJOK',
} as const

export const subjectDisplayName = (s: string): string => ({
  PANCASILA: 'Pend. Pancasila',
  B_INDO:    'Bahasa Indonesia',
  MTK:       'Matematika',
  ENGLISH:   'Bahasa Inggris',
  IPA:       'IPA',
  IPS:       'IPS',
  AGAMA:     'Pend. Agama',
  SENI:      'Seni Budaya',
  PJOK:      'PJOK',
}[s] ?? s)
