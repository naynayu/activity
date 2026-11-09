export interface SessionRow { id: string; step: number; message: string | null; quiz_on: boolean; quiz_open: boolean; quiz_reveal: boolean; updated_at: string }
export interface Participant { id: string; name: string; created_at: string }
export interface ProgressRow { participant_id: string; step: number; task: number }
export interface HelpRow { participant_id: string; step: number; stuck: boolean }
export interface AnswerRow { participant_id: string; q: number; choice: number }
