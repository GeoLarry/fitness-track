# Fitness Track

A full-stack workout tracker: build a workout from an exercise catalog, log warm-ups and sets with weight and reps, and keep your training history.

[![API](https://github.com/GeoLarry/fitness-track/actions/workflows/api.yml/badge.svg)](https://github.com/GeoLarry/fitness-track/actions/workflows/api.yml)
[![Web](https://github.com/GeoLarry/fitness-track/actions/workflows/web.yml/badge.svg)](https://github.com/GeoLarry/fitness-track/actions/workflows/web.yml)

## Features

The Angular app in `web/` runs entirely on the .NET API in `api/`, built from my `dotnet-auth-starter` template.

- Sign up with a username, log in with email or username, stay signed in across reloads; roles User, Coach and Administrator
- Training page with tabs: Planned (swipe right to start, tap to edit, swipe left to delete), New (start a workout now or plan one) and Completed (history with duration, sets and volume; tap for a preview of every set, swipe left or use the ⋮ menu to delete)
- Current workout: saved on the API at any time and resumed after a reload, elapsed time, a rest timer, one card per exercise (tap the name for its details) with warm-ups and sets (weight, reps, arrows to reorder, swipe left to delete); Done moves it to the history, X cancels and deletes it
- Plans: a name and an optional day; starting one copies it into a new workout and the plan stays
- Exercise picker over a catalog of 383 exercises, with search and exercise info (equipment, muscles, steps)
- Custom exercises (muscles, equipment, numbered steps), visible only to the user who created them

## Tech stack

| Part | Technologies |
|---|---|
| Frontend (`web/`) | Angular 22, standalone components, signals, `httpResource`, zoneless change detection, OnPush, Angular Material, ESLint |
| Backend (`api/`) | .NET 10 Minimal API, EF Core (SQLite / SQL Server), JWT, permission-based authorization, Bogus seeding |
| Tests | Vitest unit tests for the Angular app (jsdom), xUnit integration tests over the real HTTP pipeline |
| CI | GitHub Actions, one workflow per folder |

## Repository layout

```
api/   .NET 10 backend (see api/README.md)
web/   Angular frontend
docs/  Design notes: exercise catalog data (AppData.xlsx), workout builder structure
```

## Run locally

Backend (requires the .NET 10 SDK):

```bash
cd api
dotnet run --project src/Starter.Api
```

API on http://localhost:5080, API reference at http://localhost:5080/scalar/v1. Development admin: `admin` / `Admin123!`, demo users: `Demo123!`.

Frontend (requires Node.js 22 or later):

```bash
cd web
npm install
npm start
```

App on http://localhost:4200. The app calls the API on its own origin (`/api`); the dev server proxies those requests to http://localhost:5080 (`web/proxy.conf.json`).

To try it on a phone or tablet on the same Wi-Fi, run `npm run start:lan` instead and open `http://<your computer's IP>:4200` there (on a Mac: `ipconfig getifaddr en0`). Only the web port is exposed; `/api` is still proxied to the API on the computer.

The API has no migrations yet: after pulling changes to its data model, delete `api/src/Starter.Api/app.db` once so it is recreated.

## Roadmap

- [x] Monorepo: API from `dotnet-auth-starter`, the Angular app in `web/`, CI per folder
- [x] Upgrade the web app: Angular 22, drop the unused SSR server, Vitest instead of Karma, ESLint, remove dead code
- [x] Sign-in through the API: JWT auth service, interceptor and guards in the web app (the existing screens stay), Coach role in the API
- [x] Exercise catalog on the API: exercises, muscles, equipment, seeded from `docs/AppData.xlsx`
- [x] The web app reads the catalog from the API; Firebase removed
- [x] Save a workout on the API: plans, one workout in progress, completed history; exercises, warm-ups and sets; start a workout from a plan (the plan stays); demo workouts in the seed
- [x] The web app uses the workouts API (current UI): live workout resumed after a reload, Save and Done, plans to start or edit, history; dates come back from the API as UTC
- [x] Redesign, step 1: dark athletic theme, bottom bar on phones and side column on computers instead of the side menu and tabs, History and Profile pages
- [x] Redesign, step 2: live workout in the new design, no bottom bar during it on phones, a question before leaving with unsaved changes
- [ ] Redesign, next steps: History with a weekly summary, Training and dialogs, Home
- [ ] Workout screens in the new design, on the workouts API: Training → new workout (live, saved at any time, Done moves it to Completed) or plan (saved for later in Planned)
- [ ] Better adding of exercises, sets, warm-ups and custom exercises
- [ ] Admin: user management screen, roles Admin / User / Coach in the web app
- [ ] Exercise details: description, an anatomy map with primary and secondary muscles colored, a carousel with execution videos
- [ ] Coaches: assign athletes, plan their workouts, see their history
- [ ] Profile: first and last name, birthdate (asked at sign-up before the move to the API)
- [ ] Email confirmation, rate limiting on the auth endpoints
- [ ] Live demo: EF migrations, hosting, demo accounts per role
- [ ] Programs and goals: workout templates, goals, a calendar
- [ ] Progress: charts per exercise, personal records
- [ ] Nutrition: calories, macros, meals
- [ ] Body measurements: weight, body fat, circumferences, with progress charts
- [ ] Mobile polish / PWA
