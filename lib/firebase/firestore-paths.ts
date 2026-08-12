import { collection, doc } from 'firebase/firestore'
import { db } from './config'

// ─── Path helpers — mirror dari Android FirestoreSource ──────────────────────
export const userDoc        = (uid: string)                    => doc(db, 'users', uid)
export const childrenCol    = (uid: string)                    => collection(db, 'users', uid, 'children')
export const childDoc       = (uid: string, childId: string)   => doc(db, 'users', uid, 'children', childId)
export const schedulesCol   = (uid: string, childId: string)   => collection(db, 'users', uid, 'children', childId, 'schedules')
export const scheduleDoc    = (uid: string, childId: string, day: string) => doc(db, 'users', uid, 'children', childId, 'schedules', day)
export const topicsCol      = (uid: string, childId: string)   => collection(db, 'users', uid, 'children', childId, 'topics')
export const sessionsCol    = (uid: string, childId: string)   => collection(db, 'users', uid, 'children', childId, 'sessions')
export const rewardsCol     = (uid: string, childId: string)   => collection(db, 'users', uid, 'children', childId, 'rewards')
export const threadsCol     = (uid: string, childId: string)   => collection(db, 'users', uid, 'children', childId, 'messages')
export const chatsCol       = (uid: string, childId: string)   => collection(db, 'users', uid, 'children', childId, 'chats')
export const childCodeDoc   = (code: string)                   => doc(db, 'childCodes', code)
