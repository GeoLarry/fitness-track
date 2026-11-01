using Bogus;
using Microsoft.EntityFrameworkCore;
using Starter.Core.Enums;
using Starter.Core.Models;

namespace Starter.Infrastructure.Data;

// Demo workouts for local development and demos: a push/pull/legs history over the last weeks,
// with weights that go up over time, plus a couple of plans. Runs only with demo users on,
// on a database without workouts.
public static class WorkoutSeeder
{
    private const int DemoAthletes = 5;
    private const int HistoryDays = 42;

    // Exercise name and a starting working weight in kg for an average demo athlete.
    private static readonly (string Name, (string Exercise, decimal StartKg)[] Exercises)[] Days =
    [
        ("Push day", [("Bench Press", 60), ("Overhead Press", 35), ("Dumbbell Lateral Raise", 8)]),
        ("Pull day", [("Deadlift", 90), ("Barbell Row", 50), ("Pull-Up", 0), ("Barbell Curl", 25)]),
        ("Leg day", [("Squat", 70), ("Romanian Deadlift", 60), ("Leg Press", 120)])
    ];

    public static async Task SeedAsync(AppDbContext db, SeedOptions seed, CancellationToken ct = default)
    {
        if (seed.DemoUsers <= 0 || await db.Workouts.AnyAsync(ct)) return;

        List<string> names = Days.SelectMany(d => d.Exercises.Select(e => e.Exercise)).Distinct().ToList();
        Dictionary<string, int> exerciseIds = await db.Exercises
            .Where(e => e.CreatedByUserId == null && names.Contains(e.Name))
            .ToDictionaryAsync(e => e.Name, e => e.Id, ct);

        // The admin first, then a few active demo users.
        List<int> userIds = await db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.Id)
            .Select(u => u.Id)
            .Take(DemoAthletes + 1)
            .ToListAsync(ct);

        // Fixed seed so every fresh database gets the same workouts.
        Faker faker = new() { Random = new Randomizer(42) };
        DateTime today = DateTime.UtcNow.Date;
        List<Workout> workouts = new();

        foreach (int userId in userIds)
        {
            decimal strength = faker.Random.Decimal(0.7m, 1.3m);
            int count = faker.Random.Int(6, 10);

            for (int i = 0; i < count; i++)
            {
                var day = Days[i % Days.Length];
                int week = i / Days.Length;
                DateTime started = today.AddDays(-HistoryDays + i * HistoryDays / count)
                    .AddHours(faker.Random.Int(7, 20)).AddMinutes(faker.Random.Int(0, 59));
                int duration = faker.Random.Int(45, 75) * 60;

                workouts.Add(new Workout
                {
                    UserId = userId,
                    Name = day.Name,
                    Status = WorkoutStatus.Completed,
                    StartedAtUtc = started,
                    CompletedAtUtc = started.AddSeconds(duration),
                    DurationSeconds = duration,
                    CreatedAtUtc = started,
                    UpdatedAtUtc = started.AddSeconds(duration),
                    Exercises = Exercises(day.Exercises, exerciseIds, kg => Progress(kg, strength, week), faker, done: true)
                });
            }

            // Plans for the next days, at the weights the athlete has reached.
            int weeks = count / Days.Length + 1;
            workouts.Add(Plan(userId, Days[0], today.AddDays(1), exerciseIds, strength, weeks, faker));
            workouts.Add(Plan(userId, Days[2], null, exerciseIds, strength, weeks, faker));
        }

        db.Workouts.AddRange(workouts);
        await db.SaveChangesAsync(ct);
    }

    private static Workout Plan(int userId, (string Name, (string Exercise, decimal StartKg)[] Exercises) day, DateTime? plannedFor,
        Dictionary<string, int> exerciseIds, decimal strength, int weeks, Faker faker) => new()
    {
        UserId = userId,
        Name = day.Name,
        Status = WorkoutStatus.Planned,
        PlannedForUtc = plannedFor,
        Exercises = Exercises(day.Exercises, exerciseIds, kg => Progress(kg, strength, weeks), faker, done: false)
    };

    // One warm-up at half the weight for the first, heavy lift, then three working sets.
    private static List<WorkoutExercise> Exercises((string Exercise, decimal StartKg)[] exercises, Dictionary<string, int> exerciseIds,
        Func<decimal, decimal> workingWeight, Faker faker, bool done)
        => exercises
            .Where(e => exerciseIds.ContainsKey(e.Exercise))
            .Select((e, index) =>
            {
                decimal weight = e.StartKg == 0 ? 0 : workingWeight(e.StartKg);
                List<WorkoutSet> sets = new();
                if (index == 0) sets.Add(new WorkoutSet { IsWarmup = true, WeightKg = RoundToPlate(weight / 2), Reps = 10, IsDone = done });
                for (int s = 0; s < 3; s++)
                    sets.Add(new WorkoutSet { WeightKg = weight, Reps = faker.Random.Int(5, 10), IsDone = done });

                for (int p = 0; p < sets.Count; p++) sets[p].Position = p;
                return new WorkoutExercise { Position = index, ExerciseId = exerciseIds[e.Exercise], Sets = sets };
            })
            .ToList();

    // The big lifts go up 2.5 kg a week; the small ones stay.
    private static decimal Progress(decimal startKg, decimal strength, int week)
        => RoundToPlate(startKg * strength + (startKg >= 30 ? week * 2.5m : 0));

    private static decimal RoundToPlate(decimal kg) => Math.Round(kg / 2.5m) * 2.5m;
}
