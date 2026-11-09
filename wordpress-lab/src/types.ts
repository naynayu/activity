export interface SessionRow { id: string; step: number; message: string | null; updated_at: string }
export interface Participant { id: string; name: string; created_at: string }
export interface ProgressRow { participant_id: string; step: number; task: number }
export interface HelpRow { participant_id: string; step: number; stuck: boolean }
