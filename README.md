# CV Clinic

Live activity app for the CV Clinic session of *Positioning Yourself to Be Relevant in Our World*.
A static React + Vite app on Vercel with all room state in Supabase, built the way nnpc-dpms is.

## Three screens, one address

| URL | Who | What |
| --- | --- | --- |
| `/` | Participants (phones) | Join with a first name. One step at a time, one thing to do |
| `/#screen` | Projector (optional) | Everything on a big screen, if you have one. Not needed: phones show it all |
| `/#host` | Facilitator (PIN in `src/config.ts`) | Next and Back, one action per step, more controls underneath |

## The session: 7 steps

1. **Welcome**: people scan the code and join.
2. **Hire or Pass**: paste or photograph a patient's CV; it appears on every phone and stays there. The room votes and sees the tally.
3. **Fix the line**: the CV stays on each phone; everyone rewrites one weak line with a result and a number (60 seconds). Pick the best for +10 and they show on every phone.
4. **Bad CV vs good CV**: an Executive Assistant example, scored −90 and 100.
5. **Score your own CV**: tick the checklist and red flags on your phone, send your score.
6. **Quiz**: 10 multiple-choice questions on the talk, 10 points each. The host opens it, closes it, reveals the answers, and can reset it.
7. **Winners**: the leaderboard (CV score + quiz + any bonus points), hidden until you reveal it. Built for 50+ people.

Anyone can also ask a question from the "Ask a question" tab on their phone. The host sees them under "Questions from the room".

## Host controls

- **Who can send**: votes, rewrites, scores and questions can each be opened and closed. This is enforced
  in the database, not just on the phones, and rewrites stop when the 60-second timer ends.
- **What phones show**: follow the step, "Eyes on the screen", the leaderboard, or questions.
- **Edit the content**: checklist, red flags, rewrite examples, both CVs and the prepared questions, saved
  to the database and live on every device at once.

## How sync works

One shared realtime connection per device, changes applied straight to screen without refetching,
a catch-up when a phone wakes or reconnects, and a slow jittered refresh as a safety net. Countdowns use
the database clock (`server_time_ms`), so a wrong phone clock does not matter.

## Backend

Supabase project `cv-clinic` (`xgjpygjpkkpakbixugoh`, eu-west-2): `session`, `participants`, `votes`,
`submissions`, `scores`, `answers`, `awards`, `questions`, `question_votes`, `content`, `cvs`, plus the `gate()` and
`server_time_ms()` functions.

## Running

```
npm install
npm run dev
npm run build
```

## A note on the PIN and security

The PIN is compiled into the bundle and the Supabase policies are open to the publishable key, as in
nnpc-dpms. It keeps an idle participant out of the console; it is not a security control. Do not put real
personal data in this app, and use "Start over" in the host console after the session.
