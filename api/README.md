# Fitness Track API

.NET 10 Minimal API for Fitness Track, built from my private `dotnet-auth-starter` template: sign-up and login with JWT, users, roles and fine-grained permissions, a real database and seeded demo data.

All commands below run from this `api/` folder.

## What's inside

| Area | Details |
|---|---|
| API style | Minimal API, endpoints grouped per feature (`MapAuthEndpoints`, `MapUserEndpoints`, `MapRoleEndpoints`, `MapExerciseEndpoints`) |
| Auth | Register, login (username or email), `GET /api/auth/me`, JWT bearer tokens, BCrypt password hashing |
| Authorization | Permissions as `(Module, Action)` pairs on roles, users can hold several roles, `.RequirePermission(...)` on any endpoint |
| Live permissions | Permissions are checked against the database on every request, so role changes and deactivation apply to tokens already issued |
| Protected roles | Super Admin (immutable, never assignable), Administrator, User and Coach (built in, cannot be deleted). `System` permissions cannot be granted through the API |
| Exercise catalog | 383 shared exercises with muscles, equipment and types, seeded from `docs/AppData.xlsx`; custom exercises per user |
| Data | EF Core 10, SQLite by default, SQL Server with one setting |
| Seeding | Roles, the first admin, the exercise catalog and (in Development) demo users generated with Bogus |
| Docs | OpenAPI + Scalar UI in Development, ready-made requests in `Starter.Api.http` |
| Tests | xUnit integration tests over the real HTTP pipeline with in-memory SQLite |
| CI | GitHub Actions: restore, build, test on every push and pull request |

## Project layout

```
src/
  Starter.Core/            Models, contracts (DTOs), interfaces, permission enums. No EF Core.
  Starter.Infrastructure/  EF Core DbContext, services, seeding, JWT + authorization wiring
  Starter.Api/             Program.cs, endpoints, exception handling, appsettings
tests/
  Starter.Api.Tests/       Integration tests with WebApplicationFactory
```

## Run it

Requirements: [.NET 10 SDK](https://dotnet.microsoft.com/download).

```bash
dotnet run --project src/Starter.Api
```

- API: `http://localhost:5080`, API reference (Scalar): `http://localhost:5080/scalar/v1`
- A SQLite file `app.db` is created on first run, with roles, the admin, 25 demo users and the exercise catalog.
- There are no migrations yet: after pulling changes to the data model, delete `src/Starter.Api/app.db` once so it is recreated.
- Development admin: `admin` / `Admin123!` (from `appsettings.Development.json`). Demo users use `Demo123!`.

Open `src/Starter.Api/Starter.Api.http` in VS Code (REST Client extension) to log in and try every endpoint.

Run the tests:

```bash
dotnet test
```

## Endpoints

| Method | Route | Permission |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | signed in |
| GET | `/api/users?pageNumber=&pageSize=&search=` | Users.View |
| GET | `/api/users/{id}` | Users.View |
| POST | `/api/users` | Users.Create |
| PUT | `/api/users/{id}` | Users.Edit |
| DELETE | `/api/users/{id}` (deactivate) | Users.Delete |
| POST | `/api/users/{id}/reactivate` | Users.Edit |
| GET | `/api/roles`, `/api/roles/{id}` | Roles.View |
| POST | `/api/roles` | Roles.Create |
| PUT | `/api/roles/{id}` | Roles.Edit (system roles also need System.Edit) |
| DELETE | `/api/roles/{id}` | Roles.Delete |
| GET | `/api/permissions` | Roles.View |
| GET | `/api/exercises` (shared catalog plus your own custom exercises) | Exercises.View |
| GET | `/api/exercises/{id}` | Exercises.View |
| POST | `/api/exercises` (custom exercise, visible only to you) | Exercises.Create |
| GET | `/api/muscles`, `/api/equipment`, `/api/exercise-types` | Exercises.View |
| GET | `/health` | public |

Errors from services come back as `400 { "message": "..." }`.

## Configuration

| Key | Default | Notes |
|---|---|---|
| `Database:Provider` | `Sqlite` | `Sqlite` or `SqlServer` |
| `ConnectionStrings:Default` | `Data Source=app.db` | SQL Server example: `Server=localhost;Database=Starter;Trusted_Connection=True;TrustServerCertificate=True` |
| `Jwt:Secret` | placeholder | **Required outside Development.** At least 32 characters; the app refuses to start with the placeholder |
| `Jwt:Issuer`, `Jwt:Audience` | `Starter.Api`, `Starter.Client` | |
| `Jwt:ExpiryMinutes` | `10080` (7 days) | |
| `Seed:AdminUsername`, `Seed:AdminEmail`, `Seed:AdminPassword` | `admin`, `admin@example.com`, empty | The admin is created only on an empty database, and only if a password is set |
| `Seed:DemoUsers` | `0` (`25` in Development) | Number of Bogus demo users |
| `Cors:AllowedOrigins` | `http://localhost:4200` | Angular dev server |

Keep secrets out of `appsettings.json`. Locally:

```bash
cd src/Starter.Api
dotnet user-secrets set "Jwt:Secret" "<a long random string>"
dotnet user-secrets set "Seed:AdminPassword" "<a strong password>"
```

In production use environment variables, e.g. `Jwt__Secret`, `Seed__AdminPassword`.

## Switching to SQL Server

1. Set `Database:Provider` to `SqlServer`.
2. Set `ConnectionStrings:Default` to your SQL Server connection string.

That's it while the project has no migrations: the schema is created on start.

## Migrations

Until the first migration exists, the app creates the schema directly from the model (`EnsureCreated`). When the data model of your app settles, switch to migrations for the provider you'll deploy with:

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate --project src/Starter.Infrastructure --startup-project src/Starter.Api --output-dir Data/Migrations
```

From then on the app runs `Migrate()` on start. Delete any old `app.db` first, since it was created without migration history. Migrations are provider-specific: if you change provider later, generate them again for the new one.

## Roles

| Role | Permissions |
|---|---|
| Super Admin | `System.View`, `System.Edit`; never assignable |
| Administrator | Every permission except `System` |
| User | `Exercises.View`, `Exercises.Create`; given on sign-up |
| Coach | Same as User for now; coaching features add to it |

## Exercise catalog seed

`src/Starter.Infrastructure/Data/Seed/exercise-catalog.json` is embedded in the Infrastructure assembly and seeded while the shared catalog is empty. It was built once from `docs/AppData.xlsx` (sheet "Excercises per muscle": each column is the primary muscle group of its exercises, Cardio becomes the exercise type) and the muscles and equipment in `docs/seed-data.ts`. Equipment is filled in only where the exercise name states it (Barbell, Dumbbell, Cable, Machine...). Edit the JSON to correct or extend the catalog; secondary muscles are still empty.

## Adding a feature

1. Add the module to `PermissionModule` (e.g. `Exercises`, `Workouts`).
2. Add entities to `AppDbContext`, a service in Infrastructure, an endpoints file in `Starter.Api/Endpoints`, and map it in `Program.cs`.
3. Protect the endpoints with `.RequirePermission(...)` and give the `User` role the permissions regular users need (in `DbInitializer`).
4. Add tests next to the existing ones.

## Fixes from the starter

The API lives in a subfolder of this repository, so improvements made later in `dotnet-auth-starter` are ported here by hand, in small pull requests.
