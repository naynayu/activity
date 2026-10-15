import { peek, useTable } from './store'
import type { Phase } from './types'

export interface CvExample { text: string; chk: number[]; ded: number[]; typos: number }
export interface Content {
  checks: [text: string, points: number][]
  deds: string[]
  glow: [before: string, after: string][]
  notes: [bad: string, good: string][]
  qa: [question: string, answer: string][]
  bad: CvExample
  good: CvExample
}

const BAD_TEXT = `CURRICULUM VITAE

[PASSPORT PHOTO]

PERSONAL DATA
Name:            Blessing Chinwe Okafor
Date of Birth:   4th July, 1996
Sex:             Female
Marital Status:  Single
State of Origin: Anambra State
Religion:        Christianity
Address:         Flat 3, 22 Allen Avenue, Ikeja, Lagos State
Email:           blessy_sweetgirl@gmail.com
Phone:           0802 000 0000

CAREER OBJECTIVE
To secure a challenging position as an Executive Assistant in a
reputable organisation where I can utilise my skills for growth.

EDUCATION
Lagos State University, B.Sc Business Admin      2014 - 2018
Command Secondary School, SSCE                   2008 - 2014
Little Angels Nursery and Primary School         2002 - 2008
O'LEVEL: Eng C5, Maths C6, Econ B3, Commerce B2, Govt C4

WORK EXPERIENCE
Personal Assistant, Zenith Logistics Ltd         2021 - Till Date
- Responsible for typing letters
- In charge of answering calls and booking appointments
- Performed other duties as assigned

SKILLS
- Microsoft Office
- Hardworking, result-oriented and ability to work under pressure
- Excellent communication skils

HOBBIES
Reading, cooking, watching movies and making friends

REFEREES
1. Rev. Mrs A. Eze, 0803 000 0000
2. Mr T. Bakare, Manager, Zenith Logistics, 0805 000 0000

(Runs to 3 pages. Saved as "BLESSING CV final final 2.docx")`

const GOOD_TEXT = `AMINA YUSUF
Executive Assistant | Diary, travel and board support for CEOs
Lagos · 0801 000 0000 · amina.yusuf@email.com
linkedin.com/in/aminayusuf · aminayusuf.com/sample-board-pack

SUMMARY
Executive assistant with 5 years supporting CEOs in logistics and
fintech. Manage a 3-time-zone diary, 40+ trips a year and monthly board
packs, and protect 10+ hours of leadership time every week. Looking to
support a founder-CEO in a fast-growing company.

EXPERIENCE
Executive Assistant to the CEO, Zenith Logistics   Mar 2022 - Present
- Manage the CEO's calendar across 3 time zones, cutting double-bookings
  from 6 a month to zero
- Prepare packs for 9 directors for 12 board meetings a year, delivered
  48 hours ahead
- Built an Excel and Notion tracker that cut monthly expense processing
  from 5 days to 2
- Screen 80+ emails and requests a day, escalating the 10% that need
  the CEO's attention

Administrative Officer, Brightpath Schools         Jan 2020 - Feb 2022
- Coordinated 6 parent events with 300+ attendees each
- Introduced a digital filing system for 1,200 records, cutting retrieval
  time from 15 minutes to under 2

VOLUNTEERING
- Led a team of 5 to run a 2-day career fair for 200 students (2025)

SKILLS
Google Workspace, Microsoft 365, Notion, Calendly, Zoom, Concur
Minute-taking, travel planning, stakeholder communication
AI tools (ChatGPT, Copilot) to draft and summarise correspondence

EDUCATION
B.Sc Business Administration, University of Lagos, 2019`

export const DEFAULTS: Content = {
  checks: [
    ['Name, phone and professional email at the top (no “babygirl2000@…”)', 5],
    ['LinkedIn and portfolio or GitHub link included', 10],
    ['A 2–3 line summary of what you do and want, with no clichés', 10],
    ['Experience listed most recent first, with clear dates', 5],
    ['Every bullet starts with an action verb (led, built, grew, organised)', 10],
    ['At least 3 bullets with a number in them (%, people, naira, hours)', 15],
    ['Projects, volunteering or leadership roles included', 10],
    ['Specific skills and tools listed (not just “Microsoft Office”)', 10],
    ['One page if student or early career, two maximum if experienced', 5],
    ['Clean, consistent format: one font, aligned dates, easy to scan', 10],
    ['Tailored to the role you are applying for', 10],
  ],
  deds: [
    'Date of birth or age', 'Sex or gender', 'Marital status', 'State of origin or LGA', 'Religion',
    'Full home address (city and state is enough)', 'A passport photograph',
    'Unprofessional email (nicknames, “4real”, “baby”, “sweetboy”)',
    '“Curriculum Vitae” as the title instead of your name',
    '“Career Objective: To work in a reputable organisation…”',
    'Primary and secondary schools listed when you have a degree', 'O’level results listed',
    '“Hardworking, result-oriented, ability to work under pressure…”',
    '“Responsible for…” or “Performed other duties as assigned”',
    'Hobbies: reading, travelling, making friends',
    'Referees’ full names and phone numbers listed without being asked',
    'More than 2 pages', 'File saved as “CV final final 2.docx”',
  ],
  glow: [
    ['Responsible for social media', 'Grew Instagram followers from 500 to 3,000 in 6 months by posting 4 times a week'],
    ['Helped organise events', 'Coordinated 3 tech meetups with 150+ attendees, managing speakers and logistics'],
    ['Did customer service', 'Resolved 40+ customer enquiries weekly with 90% handled within 24 hours'],
    ['Member of the tech club', 'Led a team of 5 to build a campus events app used by 200 students'],
    ['Good at Excel', 'Built an Excel tracker that cut weekly reporting time from 3 hours to 45 minutes'],
  ],
  notes: [
    ['Title says “Curriculum Vitae”, then a passport photo and personal data', 'Her name is the title. Contact line, LinkedIn and a sample board pack link'],
    ['“Career objective” that could be on anyone’s CV', 'Three-line summary: who she supports, her numbers, what she wants next'],
    ['“Responsible for typing letters”, “in charge of answering calls”', 'Every bullet starts with an action verb and ends with a result'],
    ['“Microsoft Office”, “hardworking, result-oriented”', 'Named tools, named skills, and AI used on the job'],
    ['Primary school, O’level results, hobbies, referees’ phone numbers', 'Degree only. No hobbies, no referees'],
    ['Three pages, a typo, and a file called “CV final final 2”', 'One page, one font, aligned dates'],
  ],
  qa: [
    ['Is AI coming for my job?', 'AI is coming for tasks, not whole jobs. The person who learns to use it well keeps the job, and probably gets the next one.'],
    ['I’m not in tech. Do I still need to learn AI?', 'Yes, maybe more than tech people. Teachers, HR, marketers, farmers, lawyers and accountants all have tasks AI can speed up.'],
    ['Do I need to learn coding?', 'Not to use AI. You need clear thinking and clear writing.'],
    ['Isn’t using AI cheating?', 'Using AI to avoid learning is cheating yourself. Using it to work faster while understanding the output is a skill. Never submit what you can’t explain.'],
    ['Which AI tool should I start with?', 'Any major free one. The habit matters more than the tool: pick one and use it daily for a month.'],
    ['Will AI take entry-level jobs from graduates?', 'Some entry-level tasks are being automated, so the bar is rising. Proof of work, real projects and AI skills matter more now.'],
    ['I’m a student. Where do I start?', 'One skill, one tool, one project. Learn a skill, use AI to help you learn it, build something small, and post it.'],
  ],
  // The only thing right on the bad CV is "most recent first, with dates". Every red flag is on it.
  bad: { text: BAD_TEXT, chk: [3], ded: Array.from({ length: 18 }, (_, i) => i), typos: 1 },
  good: { text: GOOD_TEXT, chk: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ded: [], typos: 0 },
}

/** Editable content: the database row wins over these defaults, field by field. */
let cache: { src: unknown; val: Content } | null = null
function merge(rows: { id: string; data: Partial<Content> }[]): Content {
  const row = rows.find(r => r.id === 'v1')
  if (cache && cache.src === row) return cache.val
  const val = { ...DEFAULTS, ...(row?.data ?? {}) } as Content
  cache = { src: row, val }
  return val
}
export const getContent = (): Content => merge(peek('content') as never)
export function useContent(): Content {
  const { rows } = useTable<{ id: string; data: Partial<Content> }>('content')
  return merge(rows)
}

export interface Step { key: Phase; title: string; say: string; minutes: number }
/** The whole session in plain words. `say` is the one sentence people see on their phones. */
export const STEPS: Step[] = [
  { key: 'welcome', title: 'Welcome', say: 'Waiting for the host to start. Keep this page open.', minutes: 5 },
  { key: 'vote', title: 'Hire or Pass', say: 'Read the CV below. Would you hire this person? Tap Hire or Pass.', minutes: 15 },
  { key: 'rewrite', title: 'Fix the line', say: 'Rewrite the weak line from the CV so it shows a result and a number.', minutes: 10 },
  { key: 'compare', title: 'Bad CV vs good CV', say: 'Look at both CVs. What is different?', minutes: 8 },
  { key: 'score', title: 'Score your own CV', say: 'Tick what your CV has, and what it should not have. Then send your score.', minutes: 20 },
  { key: 'winners', title: 'Winners', say: 'The winners are announced here.', minutes: 5 },
  { key: 'questions', title: 'Questions', say: 'Ask a question. Tap ▲ on the ones you want answered.', minutes: 20 },
]
export const stepIndex = (p: Phase) => Math.max(0, STEPS.findIndex(s => s.key === p))
