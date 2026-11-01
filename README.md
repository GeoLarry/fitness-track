# Fitness Track

A full-stack workout tracker: build a workout from an exercise catalog, log warm-ups and sets with weight and reps, and keep your training history.

[![API](https://github.com/GeoLarry/fitness-track/actions/workflows/api.yml/badge.svg)](https://github.com/GeoLarry/fitness-track/actions/workflows/api.yml)
[![Web](https://github.com/GeoLarry/fitness-track/actions/workflows/web.yml/badge.svg)](https://github.com/GeoLarry/fitness-track/actions/workflows/web.yml)

## Features

The Angular app in `web/` runs entirely on the .NET API in `api/`, built from my `dotnet-auth-starter` template.

- Sign up with a username, log in with email or username, stay signed in across reloads; roles User, Coach and Administrator
- Workout page with tabs: Planned, New and Completed (Planned and Completed are placeholders)
- Current workout: a rest timer, one card per exercise with warm-ups and sets (weight, reps, drag to reorder); workouts are not saved yet
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

The API has no migrations yet: after pulling changes to its data model, delete `api/src/Starter.Api/app.db` once so it is recreated.

## Roadmap

- [x] Monorepo: API from `dotnet-auth-starter`, the Angular app in `web/`, CI per folder
- [x] Upgrade the web app: Angular 22, drop the unused SSR server, Vitest instead of Karma, ESLint, remove dead code
- [x] Sign-in through the API: JWT auth service, interceptor and guards in the web app (the existing screens stay), Coach role in the API
- [x] Exercise catalog on the API: exercises, muscles, equipment, seeded from `docs/AppData.xlsx`
- [x] The web app reads the catalog from the API; Firebase removed
- [x] Save a workout on the API: plans, one workout in progress, completed history; exercises, warm-ups and sets; start a workout from a plan (the plan stays); demo workouts in the seed
- [ ] Redesign of the web app (to be agreed first)
- [ ] Workout screens in the new design, on the workouts API: Training → new workout (live, saved at any time, Done moves it to Completed) or plan (saved for later in Planned)
- [ ] Better adding of exercises, sets, warm-ups and custom exercises
- [ ] Admin: user management screen, roles Admin / User / Coach in the web app
- [ ] Exercise details: description, an anatomy map with primary and secondary muscles colored, a carousel with execution videos
- [ ] Coaches: assign athletes, plan their workouts, see their history
- [ ] Profile: first and last name, birthdate (asked at sign-up before the move to the API)
- [ ] Email confirmation, rate limiting on the auth endpoints, dates read back as UTC
- [ ] Live demo: EF migrations, hosting, demo accounts per role
- [ ] Programs and goals: workout templates, goals, a calendar
- [ ] Progress: charts per exercise, personal records
- [ ] Nutrition: calories, macros, meals
- [ ] Body measurements: weight, body fat, circumferences, with progress charts
- [ ] Mobile polish / PWA
