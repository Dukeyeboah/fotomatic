# Fotomatic

Standalone marketing + photographer discovery app for **Fotomatic** (separate from Grad Drive).

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS v4
- [Firebase](https://firebase.google.com/) Auth + Firestore

## Getting started

```bash
cd Fotomatic
cp .env.example .env.local
# Fill in Firebase Web config from your Fotomatic Firebase project
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firebase setup (new project)

1. Create a **new** Firebase project (e.g. `fotomatic-prod`).
2. Enable **Authentication** → Email/Password.
3. Enable **Firestore** → publish rules from `firestore.rules` in this repo (adjust as you add an admin console).
4. Add a Web app and copy config into `.env.local`.

### Data model (initial)

- `photographers` — public read; seed/update via scripts or a future admin app (writes are denied to clients in the sample rules).
- `photographerBookings` — authenticated users can **create** requests (adjust if you need admin read access).
- `users` — one document per Firebase Auth user at signup.

## Grad Drive integration (high level)

- Grad Drive stays in its own repo; **link users to Fotomatic** for booking, e.g.  
  `https://fotomatic.app/photographers?code=YOURCODE`
- Map messages for codes in `.env.local` using `NEXT_PUBLIC_PROMO_MESSAGES` (see `.env.example`).

## Deploy

Typical options: **Vercel**, **Firebase Hosting**, or any Node host. Set the same `NEXT_PUBLIC_*` env vars in the hosting dashboard.

## Repo / GitHub

This folder was scaffolded with its own `git` history from `create-next-app`. To push to GitHub:

```bash
cd Fotomatic
git remote add origin https://github.com/YOUR_ORG/fotomatic.git
git branch -M main
git push -u origin main
```

## Assets

Marketing images live in `public/fotomaticImages/` (logo, wordmark, hero + grid photos).
