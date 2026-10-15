export type Phase = 'lobby' | 'hirepass' | 'diagnosis' | 'glowup' | 'practice' | 'compare' | 'scorecard' | 'leaderboard' | 'qa'

export interface SessionRow {
  id: string
  phase: Phase
  /** Furthest phase index reached, drives the run-of-show ticks. */
  step: number
  /** Which patient's CV is on screen: cv1, cv2 ... */
  round: string
  /** Hire or Pass: the CV is showing. Practice: the answer is revealed. */
  reveal: boolean
  timer_end: string | null
  message: string | null
  updated_at: string
}
export interface Participant { id: string; name: string; created_at: string; last_seen: string }
export interface VoteRow { participant_id: string; round: string; choice: 'hire' | 'pass' }
export interface SubmissionRow { id: string; participant_id: string; round: string; content: string; picked: boolean; created_at: string }
export interface ScoreRow { participant_id: string; score: number; checks: number[]; deds: number[]; typos: number; updated_at: string }
export interface AwardRow { id: string; participant_id: string; points: number; reason: string | null; created_at: string }
export interface QuestionRow { id: string; participant_id: string | null; text: string; answered: boolean; created_at: string }
export interface QVoteRow { question_id: string; participant_id: string }
