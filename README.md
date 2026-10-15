# CV Clinic

Live activity app for the CV Clinic session of *Positioning Yourself to Be Relevant in Our World*.
Built the same way as nnpc-dpms: a static React + Vite app on Vercel, with all room state in Supabase.

## Three screens, one address

| URL | Who | What |
| --- | --- | --- |
| `/` | Participants (phones) | Join with a first name, vote, rewrite, score their CV, ask questions |
| `/#screen` | Projector | QR code, live vote bars, rewrites, scorecard progress, 50+ person leaderboard, questions |
| `/#host` | Facilitator (PIN in `src/config.ts`) | Run of show, timers, reveal, award points, pick rewrites, questions |

## The run of show

Set the scene, Round 1 Hire or Pass (6-second timer, live vote), Round 2 Diagnosis, Round 3 Glow-Up
(60-second timer, host picks rewrites for +10), practice on Seun's CV (answer −80), terrible vs good
Executive Assistant CV (−90 vs 100), the 100-point scorecard game (individual leaderboard), leaderboard
and prizes, Q&A. Questions are upvoted by the room; "Copy unanswered" exports what is left to answer afterwards.

## Backend

Supabase project `cv-clinic` (`xgjpygjpkkpakbixugoh`, eu-west-2). Tables: `session`, `participants`,
`votes`, `submissions`, `scores`, `awards`, `questions`, `question_votes`, plus the `leaderboard` view.

## Running

```
npm install
npm run dev      # local
npm run build    # type-check and build to dist/
```

Deploy to Vercel (`vercel.json` is included). `offline.html` is the earlier single-file scorecard
that works with no backend.

## A note on the PIN and security

The PIN is compiled into the bundle, and the Supabase policies are open to the publishable key, exactly
as in nnpc-dpms. It keeps an idle participant out of the console; it is not a security control. Do not
put real personal data in this app, and reset everything from the host console after the session.
