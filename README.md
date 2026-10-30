# Fitness Track

A full-stack workout tracker: build a workout from an exercise catalog, log warm-ups and sets with weight and reps, and keep your training history.

[![API](https://github.com/GeoLarry/fitness-track/actions/workflows/api.yml/badge.svg)](https://github.com/GeoLarry/fitness-track/actions/workflows/api.yml)
[![Web](https://github.com/GeoLarry/fitness-track/actions/workflows/web.yml/badge.svg)](https://github.com/GeoLarry/fitness-track/actions/workflows/web.yml)

## Current state

The repository brings two working halves together. Connecting them is the first part of the roadmap.

- `web/` is the Angular app as it stands today. It still uses **Firebase** (Auth and Firestore) for sign-in and the exercise catalog.
- `api/` is the .NET backend from my `dotnet-auth-starter` template. It is not used by the app yet.

What the app does today:

- Sign up and log in (Firebase Auth), with roles `admin`, `coach` and `user`
- Workout page with tabs: Planned, New and Completed (Planned and Completed are placeholders)
- Current workout: a timer, one card per exercise with warm-ups and sets (weight, reps, drag to reorder)
- Exercise picker with search, exercise info, and custom exercises (muscles, equipment, instructions)

## Tech stack

| Part | Technologies |
|---|---|
| Frontend (`web/`) | Angular 21, standalone components, zoneless change detection, Angular Material, ESLint, Firebase (to be replaced by the API) |
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

App on http://localhost:4200. Until the auth step of the roadmap, sign-in goes through the Firebase project `fitness-tracker-83406`.

## Roadmap

- [x] Monorepo: API from `dotnet-auth-starter`, the Angular app in `web/`, CI per folder
- [ ] Upgrade the web app: Angular 22, drop the unused SSR server, Vitest instead of Karma, ESLint, remove dead code
- [ ] Sign-in through the API: JWT auth service, interceptor and guards in the web app (the existing screens stay), Coach role in the API
- [ ] Exercise catalog on the API: exercises, muscles, equipment, seeded from `docs/AppData.xlsx`; then remove Firebase
- [ ] Save a workout: exercises, warm-ups and sets with weight and reps, duration from the timer
- [ ] Completed workouts: history per user
- [ ] Planned workouts: templates, start a workout from a plan
- [ ] Coaches: assign athletes, plan their workouts, see their history
- [ ] Email confirmation, rate limiting on the auth endpoints, dates read back as UTC
- [ ] Progress: charts per exercise, personal records
- [ ] Mobile polish / PWA, live demo
