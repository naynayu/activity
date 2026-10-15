export type Phase = 'welcome' | 'vote' | 'rewrite' | 'compare' | 'score' | 'winners' | 'questions'
export type PhoneView = 'auto' | 'hold' | 'winners' | 'questions'

export interface SessionRow {
  id: string
  phase: Phase
  /** Furthest step reached, for the ticks on the host console. */
  step: number
  /** Which patient: cv1, cv2 ... */
  round: string
  /** Compare: the good CV is revealed. */
  reveal: boolean
  timer_end: string | null
  message: string | null
  weak_line: string | null
  voting_open: boolean
  submit_open: boolean
  scores_open: boolean
  questions_open: boolean
  show_board: boolean
  phone_view: PhoneView
  updated_at: string
}
export interface Participant { id: string; name: string; created_at: string; last_seen: string }
export interface VoteRow { participant_id: string; round: string; choice: 'hire' | 'pass' }
export interface SubmissionRow { id: string; participant_id: string; round: string; content: string; picked: boolean; created_at: string }
export interface ScoreRow { participant_id: string; score: number; checks: number[]; deds: number[]; typos: number; updated_at: string }
export interface AwardRow { id: string; participant_id: string; points: number; reason: string | null; created_at: string }
export interface QuestionRow { id: string; participant_id: string | null; text: string; answered: boolean; created_at: string }
export interface QVoteRow { question_id: string; participant_id: string }
