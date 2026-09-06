# Stage 7 — Auth: University Email Login

**Goal:** replace the demo persona switcher with real, domain-restricted signup and login.

## Design

- Email + password (bcrypt via `bcryptjs`) — simplest thing that demos well without an email provider.
- Signup restricted to configured university domains: `University.domain` and `University.altDomains` (e.g. `utoronto.ca`, `mail.utoronto.ca`). Reject other domains with a clear message.
- Session: signed HTTP-only cookie (`iron-session`-style or a `Session` table with random token). Keep the `getCurrentUser()` signature from Stage 1 so nothing else changes.
- `proxy.ts` redirects unauthenticated users from app routes to `/login` (public: `/`, `/login`, `/signup`, `/clubs/[slug]`, `/postings/[id]`).
- Pages: `/login`, `/signup`, `/logout` action. Show "Demo accounts" hint on login page listing seeded emails and the shared demo password.
- Remove `/switch-user` (or keep behind `DEMO_MODE=true`).

## Files owned

- `src/lib/auth.ts` (rewrite internals, keep exports), `src/lib/auth-actions.ts`, `src/lib/session.ts`
- `src/proxy.ts`
- `src/app/(auth)/login/**`, `src/app/(auth)/signup/**`
- Prisma: add `passwordHash` to User, add `Session` model, add `altDomains String[]` to University; update seed with hashed demo password.
