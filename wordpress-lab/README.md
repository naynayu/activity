# WordPress Lab

A live, hands-on session where everyone builds a blog from scratch in WordPress Playground (a free,
in-browser WordPress, no install). Separate from CV Clinic: its own app and its own database.

| URL | Who | What |
| --- | --- | --- |
| `/` | Learners (phones) | Join with a first name, tick off tasks, tap "I'm stuck" |
| `/#screen` | Projector | Current step, tasks, QR code, "7 / 20 finished", who needs help |
| `/#host` | Facilitator (PIN in `src/config.ts`) | Back/Next, live progress per person, stuck list, message to phones |

## The 9 steps (about 90 minutes)
Get WordPress, name the blog, first post, categories and tags, About page, menu, look and feel,
plugin and comments, show it and keep it. Edit `src/content.ts` to change any of it.

## Setup
1. Create a **new** Supabase project and run `schema.sql` in the SQL editor.
2. Put its URL and publishable key in `src/config.ts` (and change `HOST_PIN`).
3. `npm install && npm run dev`, or deploy to Vercel (`vercel.json` included).

Learners should use a laptop for WordPress and their phone for the checklist. Open policies, no real
personal data. Use "Start over" after the session.
