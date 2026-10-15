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
  /** Fictional patients for Hire or Pass. `weak` is the line the room rewrites; `note` is for the host only. */
  samples: Sample[]
  /** 10 questions, 10 points each. `answer` is the index of the right option. */
  quiz: QuizQ[]
}
export interface QuizQ { q: string; options: string[]; answer: number; why: string }
export interface Sample { name: string; note: string; weak: string; rewrites: string[]; text: string }

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


export const QUIZ_POINTS = 10
const QUIZ: QuizQ[] = [
  { q: 'What does being “relevant” really mean?', options: ['Being busy all the time', 'Holding many certificates', 'People connect your name to a specific value', 'Having many followers'], answer: 2, why: 'Relevance is what people say you are known for when you are not in the room.' },
  { q: 'Which carries more weight with employers and funders?', options: ['“I’m good at X”', '“I did X and it led to Y”', 'A long list of skills', 'A famous referee'], answer: 1, why: 'Proof beats claims. Show the work and the result.' },
  { q: 'Where has the value moved now that AI handles routine tasks?', options: ['Typing speed', 'Judgment, problem framing, relationships and using AI well', 'Memorising facts', 'Working longer hours'], answer: 1, why: 'AI takes tasks. People who use it well keep the job.' },
  { q: 'What is the best way to stand out?', options: ['Be good at everything', 'Copy what everyone else does', 'Combine two or three strengths into a clear identity', 'Wait to be noticed'], answer: 2, why: 'Intersections like “HR plus tech” are less crowded than single fields.' },
  { q: 'On social media, what works best?', options: ['Random posts on five platforms', 'Posting only when you win', 'Consistency on one or two platforms', 'Never sharing a process'], answer: 2, why: 'Consistency on one beats random posts on five.' },
  { q: 'When should you apply for a role?', options: ['Only at 100% fit', 'Even at 60 to 70% fit', 'Never without a referral', 'Only after a second degree'], answer: 1, why: 'Job descriptions are wish lists. Let the employer decide.' },
  { q: 'Which CV bullet is strongest?', options: ['Responsible for social media', 'Helped with Instagram', 'Grew Instagram followers from 500 to 3,000 in 6 months', 'Good at social media'], answer: 2, why: 'Action verb, result and a number.' },
  { q: 'Which of these should you leave OFF your CV?', options: ['LinkedIn link', 'Marital status', 'Specific tools you use', 'A portfolio link'], answer: 1, why: 'Date of birth, marital status, religion and state of origin cost you points and add nothing.' },
  { q: 'What got Chimaobi promoted in his first year?', options: ['Waiting until he graduated', 'Proof of work, consistency and focus', 'His level of study', 'Knowing the right people'], answer: 1, why: 'Nobody waited for him to graduate. He did the work and showed it.' },
  { q: 'How should you treat a rejection?', options: ['As proof you are not good enough', 'As a reason to stop applying', 'As part of the process: learn, then apply again', 'As a personal insult'], answer: 2, why: 'Your yes is hidden among your no’s. Keep applying.' },
]

const SAMPLES: Sample[] = [
  {
    name: 'Chidi, accounting graduate',
    note: 'Pass. A real degree and NYSC, buried under personal data and a generic objective. Ask: what did he actually do? Fix: lose the personal data, add a number to the filing line.',
    weak: 'Responsible for answering calls and filing',
    rewrites: [
      'Handled 40+ client calls a day and filed 300 audit documents, cutting retrieval time from 15 minutes to under 5',
      'Organised the audit filing system for 5 clients, so any document could be found in under 5 minutes',
      'Answered 40+ calls daily and kept 300 audit files in order, with zero lost documents',
    ],
    text: `CURRICULUM VITAE

Name: Chidiebere Nnamdi Eze
Date of Birth: 21st January, 1998
Sex: Male
Marital Status: Single
State of Origin: Enugu State
Religion: Christianity
Email: chidi_cool_boy@yahoo.com
Phone: 0805 000 0000

CAREER OBJECTIVE
To work in a reputable organisation where I can utilise my skills
for the growth of the organisation.

EDUCATION
University of Nigeria, Nsukka, B.Sc Accounting   2016 - 2021
Federal Government College, SSCE                 2010 - 2016
St. Mary's Primary School                        2004 - 2010

WORK EXPERIENCE
Prime Auditors, Intern                           2022 - 2023
- Responsible for answering calls and filing
- Performed other duties as assigned

NYSC, Kaduna State                               2021 - 2022
- Taught Mathematics

SKILLS
Microsoft Office, hardworking, team player

HOBBIES
Football, music, making friends

REFEREES available on request`,
  },
  {
    name: 'Ngozi, marketing officer',
    note: 'Pass, but close. Real experience hidden by duty-itis. Ask: how many followers, how many events? Fix: results and numbers on every bullet.',
    weak: 'Responsible for social media',
    rewrites: [
      'Grew GreenLeaf Foods’ Instagram from 500 to 3,000 followers in 6 months by posting 4 times a week',
      'Ran 3 social channels and raised monthly engagement by 45% with weekly recipe videos',
      'Built a content calendar that took Instagram from 500 to 3,000 followers in 6 months',
    ],
    text: `NGOZI ADAEZE OKONKWO
Marketing Officer
Lagos | 0802 000 0000 | ngozi.okonkwo@gmail.com

PROFILE
A hardworking, result-oriented and creative marketing professional
with the ability to work under pressure and meet deadlines.

EXPERIENCE
Marketing Officer, GreenLeaf Foods                 2021 - Present
- Responsible for social media
- Helped organise events
- Wrote content for the company blog
- Worked with the sales team

Marketing Assistant, Bright Ideas Agency           2019 - 2021
- Assisted with campaigns
- Did data entry

EDUCATION
B.Sc Mass Communication, University of Lagos, 2018

SKILLS
Canva, Microsoft Office, social media, communication`,
  },
  {
    name: 'Tunde, developer intern',
    note: 'Pass for now. Good skills list but nothing to prove it. Ask: where is the GitHub or a live project? Fix: add one link and a result.',
    weak: 'Worked on a team project',
    rewrites: [
      'Led a team of 4 to build a campus events app used by 200 students, shipping in 6 weeks',
      'Built the login and payments pages of a 4-person team project and fixed 12 bugs before the live demo',
      'Coordinated 4 developers on a student marketplace now used by 150 people (github.com/tunde/market)',
    ],
    text: `TUNDE BAKARE
Computer Science student, University of Ibadan (400 level)
tunde.bakare@gmail.com | 0803 000 0000

SUMMARY
Passionate and fast-learning developer looking for an internship
to gain experience.

SKILLS
JavaScript, React, HTML, CSS, Python, Git
Good communication, team player

PROJECTS
- Worked on a team project at school
- Built a calculator app
- Built a to-do list app

EDUCATION
B.Sc Computer Science, University of Ibadan, expected 2027
CGPA: 4.2 / 5.0

CERTIFICATES
- freeCodeCamp Responsive Web Design
- Coursera Python for Everybody`,
  },
  {
    name: 'Fatima, customer service',
    note: 'Maybe. Clean and short, but a typo, a vague bullet and nothing tailored. Ask: what would make you call her for an interview? Fix: show the result of the 40 enquiries.',
    weak: 'Did customer service',
    rewrites: [
      'Resolved 40+ customer enquiries a week, with 90% answered within 24 hours',
      'Handled 40 enquiries weekly and lifted customer satisfaction from 78% to 91%',
      'Answered 40+ weekly enquiries and trained 2 new team members to the same 24-hour response standard',
    ],
    text: `FATIMA BELLO
Customer Experience Associate
Abuja | 0807 000 0000 | fatima.bello@gmail.com | linkedin.com/in/fatimabello

SUMMARY
Customer service professional with 3 years experience in telecoms
and retail. I enjoy solving problems and keeping customers happy.

EXPERIENCE
Customer Service Representative, SwiftNet Telecom   2022 - Present
- Did customer service
- Handled about 40 enquiries a week by phone and chat
- Trained 2 new team members
- Recieved a Star Employee award in 2024

Sales Assistant, FreshMart                          2020 - 2022
- Served customers and managed the till

EDUCATION
B.Sc Sociology, Ahmadu Bello University, 2019

SKILLS
Zendesk, Microsoft Office, WhatsApp Business, Hausa and English`,
  },
  {
    name: 'Emeka, operations (the novel)',
    note: 'Pass. Four pages of everything for someone with two years of experience. Ask: what is the one thing you remember? Fix: cut to one page and lead with a result.',
    weak: 'Helped organise events',
    rewrites: [
      'Coordinated 3 company events for 150+ attendees, managing 12 speakers and a N500k budget',
      'Organised 3 events for 150+ people and cut venue costs by 20% through early booking',
      'Ran logistics for 3 events with 150+ attendees and a 95% positive feedback score',
    ],
    text: `CURRICULUM VITAE OF EMEKA OBI

PERSONAL DATA: Male, Single, 27 years, Igbo, Imo State
Address: 15 Okigwe Road, Owerri, Imo State
Phone: 0809 000 0000  Email: emeka4real@gmail.com

OBJECTIVE: To be a part of a dynamic and progressive organisation.

EDUCATION
Primary school, secondary school (WAEC: 7 credits), JAMB 262,
Federal University of Technology Owerri, B.Eng Mechanical, 2019

EXPERIENCE (2 years)
Operations Assistant, Rivers Logistics
- Helped organise events
- Helped with deliveries
- Attended meetings
- Typed reports

COURSES AND CERTIFICATES
Computer packages, Leadership seminar, First aid, Entrepreneurship
training, Public speaking workshop, Time management, Excel (1 day),
and 14 more on request

HOBBIES: Reading, football, travelling, watching movies
REFEREES: Prof. A. Nwosu (0803 000 0000), Mr K. Ade (0805 000 0000)

(This CV runs to 4 pages.)`,
  },
  {
    name: 'Halima, programme assistant',
    note: 'Hire (interview). Not perfect: no LinkedIn and no summary, but numbers and action verbs throughout. Ask the room what is missing, then compare with the others.',
    weak: 'Member of the tech club',
    rewrites: [
      'Ran monthly meetups for 80+ attendees and recruited 15 speakers in 2 years',
      'Grew the Kaduna Tech Meetup from 20 to 80+ monthly attendees by recruiting 15 speakers',
      'Organised 24 monthly meetups for 80+ attendees, with speakers from 15 companies',
    ],
    text: `HALIMA SANI
Programme Assistant | Kaduna | 0806 000 0000 | halima.sani@gmail.com

EXPERIENCE
Programme Assistant, Hope Youth Foundation        Feb 2023 - Present
- Coordinated 4 training cohorts of 60 young people each, with 92% completion
- Cut participant onboarding from 3 days to 1 by building a simple form and tracker
- Wrote 12 donor reports, helping secure a N6m renewal grant
- Managed a budget of N2.4m across 3 programmes

Volunteer Coordinator, Kaduna Tech Meetup         2021 - 2023
- Member of the tech club
- Ran monthly meetups for 80+ attendees and recruited 15 speakers

EDUCATION
B.A. Social Work, Kaduna State University, 2022

SKILLS
Google Workspace, Excel, Canva, KoboToolbox, grant reporting,
Hausa, English`,
  },
]

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
  samples: SAMPLES,
  quiz: QUIZ,
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
  { key: 'quiz', title: 'Quiz', say: 'Answer all 10 questions. Each one is worth 10 points.', minutes: 10 },
  { key: 'winners', title: 'Winners', say: 'The winners are announced here.', minutes: 5 },
]
export const stepIndex = (p: Phase) => Math.max(0, STEPS.findIndex(s => s.key === p))
