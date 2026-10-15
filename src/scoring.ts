import { getContent, QUIZ_POINTS, type Content } from './content'
import type { AnswerRow, AwardRow, Participant, ScoreRow } from './types'

export const computeScore = (checks: number[], deds: number[], typos: number, c: Content = getContent()) =>
  checks.reduce((s, i) => s + (c.checks[i]?.[1] ?? 0), 0) - 5 * (deds.length + typos)

export function verdict(n: number): { text: string; tone: 'ok' | 'warn' | 'bad' } {
  if (n >= 85) return { text: 'Ready to send. Start applying this week.', tone: 'ok' }
  if (n >= 60) return { text: 'Close. Fix your lowest-scoring items tonight.', tone: 'warn' }
  if (n >= 0) return { text: 'Rebuild it using this checklist before your next application.', tone: 'bad' }
  return { text: 'Congratulations, you have the classic Nigerian CV. Start again from a blank page.', tone: 'bad' }
}

/** Points for one person's quiz answers, worked out from the current questions. */
export const quizPoints = (answers: AnswerRow[], c: Content = getContent()) =>
  answers.reduce((n, a) => n + (c.quiz[a.q] && c.quiz[a.q].answer === a.choice ? QUIZ_POINTS : 0), 0)

export interface BoardRow { id: string; name: string; game: number; quiz: number; bonus: number; total: number; rank: number }

/** Game score plus hand-awarded points. Ties share a rank. Only people who have
 *  sent a score, answered the quiz or been given points appear. */
export function buildBoard(participants: Participant[], scores: ScoreRow[], awards: AwardRow[], answers: AnswerRow[] = [], c: Content = getContent()): BoardRow[] {
  const game = new Map(scores.map(s => [s.participant_id, s.score]))
  const bonus = new Map<string, number>()
  awards.forEach(a => bonus.set(a.participant_id, (bonus.get(a.participant_id) ?? 0) + a.points))
  const quiz = new Map<string, AnswerRow[]>()
  answers.forEach(a => quiz.set(a.participant_id, [...(quiz.get(a.participant_id) ?? []), a]))
  const rows = participants
    .filter(p => game.has(p.id) || bonus.has(p.id) || quiz.has(p.id))
    .map(p => {
      const g = game.get(p.id) ?? 0, b = bonus.get(p.id) ?? 0, qz = quizPoints(quiz.get(p.id) ?? [], c)
      return { id: p.id, name: p.name, game: g, quiz: qz, bonus: b, total: g + qz + b, rank: 0 }
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  rows.forEach((r, i) => { r.rank = i > 0 && rows[i - 1].total === r.total ? rows[i - 1].rank : i + 1 })
  return rows
}
