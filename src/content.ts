import type { Phase } from './types'

export const CHECKS: [string, number][] = [
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
]

export const DEDUCT: string[] = [
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
]

export const SYMPTOMS: [name: string, means: string, cure: string][] = [
  ['Duty-itis', 'Lists what you were supposed to do, not what you achieved', 'Add a result and a number'],
  ['Cliché Fever', '“Hardworking, result-oriented, team player”', 'Replace with a specific achievement'],
  ['Typo Rash', 'Spelling and grammar errors', 'Proofread, then ask a friend'],
  ['Missing Link Syndrome', 'No LinkedIn, portfolio or GitHub', 'Add one link to proof of work'],
  ['Oversharing Disorder', 'State of origin, religion, marital status, date of birth', 'Delete them'],
  ['Template Overload', 'Too many colours, icons and boxes to read', 'One clean font, simple layout'],
  ['One-Size-Fits-All', 'Same CV sent to every role', 'Tailor the top third to each job'],
  ['Novel-itis', 'Four pages for two years of experience', 'Cut to one page'],
]

export const GLOW: [before: string, after: string][] = [
  ['Responsible for social media', 'Grew Instagram followers from 500 to 3,000 in 6 months by posting 4 times a week'],
  ['Helped organise events', 'Coordinated 3 tech meetups with 150+ attendees, managing speakers and logistics'],
  ['Did customer service', 'Resolved 40+ customer enquiries weekly with 90% handled within 24 hours'],
  ['Member of the tech club', 'Led a team of 5 to build a campus events app used by 200 students'],
  ['Good at Excel', 'Built an Excel tracker that cut weekly reporting time from 3 hours to 45 minutes'],
]

export const SAMPLE = `CURRICULUM VITAE

PERSONAL DATA
Name:             Oluwaseun Adebayo Johnson
Date of Birth:    12th March, 1999
Sex:              Male
Marital Status:   Single
State of Origin:  Ogun State
L.G.A:            Abeokuta South
Religion:         Christianity
Nationality:      Nigerian
Home Address:     No. 14, Adeola Street, Off Kemta Road,
                  Idi-Aba, Abeokuta, Ogun State
Email:            seunbaby4real@yahoo.com
Phone:            0803 000 0000

CAREER OBJECTIVE
To work in a reputable organisation where I can utilise my skills and
knowledge for the growth of the organisation and myself.

SCHOOLS ATTENDED WITH DATES
Olabisi Onabanjo University     B.Sc Accounting       2015 - 2020
Abeokuta Grammar School         SSCE                  2009 - 2015
St. Peter's Primary School      First School Leaving  2003 - 2009

O'LEVEL RESULT (WAEC 2015)
Mathematics B3, English C4, Economics B2, Accounting A1, Commerce B3

WORK EXPERIENCE
ABC Ventures Ltd, Admin Officer                         2021 - Till Date
- Responsible for answering calls
- In charge of filing
- Performed other duties as assigned

NYSC, Government Secondary School, Lokoja, Kogi State   2020 - 2021
- Teaching of Mathematics

SKILLS
- Microsoft Word, Excel, PowerPoint
- Hardworking and result-oriented
- Ability to work under pressure with minimal supervision
- Excellent communication skils

HOBBIES
Reading, travelling, watching football and making friends

REFEREES
1. Pastor F. Adeyemi, 0805 000 0000
2. Mr K. Bello, Manager, ABC Ventures Ltd, 0806 000 0000

(The original runs to 3 pages.)`
/** What the room should find on the sample: one pass, 17 red flags (one is a typo). */
export const SAMPLE_CHK = [3]
export const SAMPLE_DED = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
export const SAMPLE_TYPOS = 1

export interface PhaseInfo { key: Phase; title: string; minutes: number; host: string[] }
/** The run of show. Order matters: the tracker ticks off phases as the host moves through them. */
export const PHASES: PhaseInfo[] = [
  { key: 'lobby', title: 'Set the scene', minutes: 5, host: [
    'Play upbeat music. Cover phone numbers, emails and addresses before showing any CV.',
    'Applaud each patient for being brave. Start every review with one thing that works.' ] },
  { key: 'hirepass', title: 'Round 1: Hire or Pass', minutes: 8, host: [
    'Show the CV for 6 seconds, then hide it. Phones vote Hire or Pass.',
    'Ask one from each side: “Why?” and “What do you remember about this person?”' ] },
  { key: 'diagnosis', title: 'Round 2: The Diagnosis', minutes: 8, host: [
    'Put the CV back up. The room shouts the symptoms; award a point for each correct one.' ] },
  { key: 'glowup', title: 'Round 3: The Glow-Up', minutes: 8, host: [
    'Pick the weakest bullet. 60 seconds to rewrite it with a result and a number.',
    'Read three rewrites, run the applause meter, then give the patient two fixes for tonight.' ] },
  { key: 'practice', title: 'Practice: score the sample CV', minutes: 10, host: [
    'Score Seun’s CV as a room. Reveal: +5 earned, 17 red flags × −5 = −85, final −80.',
    'Ask what Seun actually did at ABC Ventures and rewrite one bullet together.' ] },
  { key: 'compare', title: 'Terrible vs good: Executive Assistant', minutes: 8, host: [
    'Show the terrible CV first. Ask the room to shout every red flag they can spot.',
    'Then reveal the good one. Point out numbers, action verbs, links and the tailored summary. Same job, same person’s experience, very different evidence.' ] },
  { key: 'scorecard', title: 'Scorecard game', minutes: 20, host: [
    'Everyone scores their own CV on their phone and submits. Read each item aloud.' ] },
  { key: 'leaderboard', title: 'Leaderboard and prizes', minutes: 5, host: [
    'Announce the winners. 85+ ready to send, 60–84 close, below 60 rebuild, below zero start again.' ] },
  { key: 'qa', title: 'Questions and answers', minutes: 20, host: [
    'Take the most upvoted questions first. Anything left over is exported for answering afterwards.' ] },
]
export const phaseIndex = (p: Phase) => PHASES.findIndex(x => x.key === p)

/** Prepared answers for the questions the talk expects. Seeded into the list on request. */
export const PREPARED_QA: [string, string][] = [
  ['Is AI coming for my job?', 'AI is coming for tasks, not whole jobs. The person who learns to use it well keeps the job, and probably gets the next one.'],
  ['I’m not in tech. Do I still need to learn AI?', 'Yes, maybe more than tech people. Teachers, HR, marketers, farmers, lawyers and accountants all have tasks AI can speed up.'],
  ['Do I need to learn coding?', 'Not to use AI. You need clear thinking and clear writing.'],
  ['Isn’t using AI cheating?', 'Using AI to avoid learning is cheating yourself. Using it to work faster while understanding the output is a skill. Never submit what you can’t explain.'],
  ['Which AI tool should I start with?', 'Any major free one. The habit matters more than the tool: pick one and use it daily for a month.'],
  ['Will AI take entry-level jobs from graduates?', 'Some entry-level tasks are being automated, so the bar is rising. Proof of work, real projects and AI skills matter more now.'],
  ['I’m a student. Where do I start?', 'One skill, one tool, one project. Learn a skill, use AI to help you learn it, build something small, and post it.'],
]

/** Terrible vs good, for an executive assistant. Both are fictional. */
export const BAD_EA = `CURRICULUM VITAE

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
export const GOOD_EA = `AMINA YUSUF
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
export const BAD_EA_CHK = [3]
export const BAD_EA_DEDS = Array.from({ length: 18 }, (_, i) => i)
export const BAD_EA_TYPOS = 1
export const GOOD_EA_CHK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const COMPARE_NOTES: [bad: string, good: string][] = [
  ['Title says “Curriculum Vitae”, then a passport photo and personal data block', 'Her name is the title. Contact line, LinkedIn and a sample board pack link to prove her work'],
  ['“Career objective” that could be on anyone’s CV', 'Three-line summary: who she supports, her numbers, what she wants next'],
  ['“Responsible for typing letters”, “in charge of answering calls”', 'Every bullet starts with an action verb and ends with a result: zero double-bookings, 5 days to 2'],
  ['“Microsoft Office”, “hardworking, result-oriented”', 'Named tools, named skills, and AI used on the job'],
  ['Primary school, O’level results, hobbies and referees’ phone numbers', 'Degree only. No hobbies, no referees: “available on request” is enough'],
  ['Three pages, a typo, and a file called “CV final final 2”', 'One page, one font, aligned dates, saved as AminaYusuf-EA-CV.pdf'],
]
