# Nourish

A private web app for gaining healthy weight: a consultation, a daily tracker (food, activity, stress, skin, sleep, weight) and an AI-written plan.

Built with Next.js, Supabase (auth + Postgres with row-level security) and the Claude API.

## Setup

1. Copy `.env.example` to `.env.local` and fill it in.
2. Apply `supabase/migrations/*.sql` to the Supabase project.
3. `npm install && npm run dev`

## Environment variables

| Name | What |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `ANTHROPIC_API_KEY` | Claude API key (server only) |
| `ALLOWED_EMAILS` | Comma-separated emails allowed to sign up and use AI features |
| `NEXT_PUBLIC_TIME_ZONE` | IANA time zone for "today", e.g. `Australia/Sydney` |
