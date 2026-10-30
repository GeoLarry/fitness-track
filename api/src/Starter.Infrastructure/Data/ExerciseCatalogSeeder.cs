using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Starter.Core.Models;

namespace Starter.Infrastructure.Data;

// Seeds the shared exercise catalog from Data/Seed/exercise-catalog.json (an embedded resource),
// built from docs/AppData.xlsx and docs/seed-data.ts. Runs only while the shared catalog is empty.
public static class ExerciseCatalogSeeder
{
    private const string ResourceName = "Starter.Infrastructure.Data.Seed.exercise-catalog.json";

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Exercises.AnyAsync(e => e.CreatedByUserId == null, ct)) return;

        CatalogSeed seed = await ReadSeedAsync(ct);

        Dictionary<string, ExerciseType> types = await EnsureAsync(db.ExerciseTypes, seed.ExerciseTypes, name => new ExerciseType { Name = name }, t => t.Name, ct);
        Dictionary<string, Equipment> equipment = await EnsureAsync(db.Equipment, seed.Equipment, name => new Equipment { Name = name }, e => e.Name, ct);
        Dictionary<string, Muscle> muscles = await EnsureAsync(db.Muscles, seed.Muscles, name => new Muscle { Name = name }, m => m.Name, ct);
        await db.SaveChangesAsync(ct);

        db.Exercises.AddRange(seed.Exercises.Select(e => new Exercise
        {
            Name = e.Name,
            NormalizedName = e.Name.ToUpperInvariant(),
            ExerciseType = e.Type is null ? null : types[e.Type],
            Equipment = e.Equipment is null ? null : equipment[e.Equipment],
            Muscles = (e.PrimaryMuscles ?? []).Select(m => new ExerciseMuscle { Muscle = muscles[m], IsPrimary = true })
                .Concat((e.SecondaryMuscles ?? []).Select(m => new ExerciseMuscle { Muscle = muscles[m], IsPrimary = false }))
                .ToList()
        }));

        await db.SaveChangesAsync(ct);
    }

    // Adds the names that are missing and returns every row by name, so a rerun on a partly seeded database works.
    private static async Task<Dictionary<string, T>> EnsureAsync<T>(DbSet<T> set, IEnumerable<string> names, Func<string, T> create, Func<T, string> nameOf, CancellationToken ct)
        where T : class
    {
        Dictionary<string, T> existing = (await set.ToListAsync(ct)).ToDictionary(nameOf);
        foreach (string name in names.Where(n => !existing.ContainsKey(n)))
        {
            T item = create(name);
            set.Add(item);
            existing[name] = item;
        }
        return existing;
    }

    private static async Task<CatalogSeed> ReadSeedAsync(CancellationToken ct)
    {
        await using Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Embedded resource {ResourceName} is missing.");

        return await JsonSerializer.DeserializeAsync<CatalogSeed>(stream, new JsonSerializerOptions(JsonSerializerDefaults.Web), ct)
            ?? throw new InvalidOperationException("The exercise catalog seed is empty.");
    }

    private sealed record CatalogSeed(List<string> ExerciseTypes, List<string> Equipment, List<string> Muscles, List<ExerciseSeed> Exercises);

    private sealed record ExerciseSeed(string Name, string? Type, string? Equipment, List<string>? PrimaryMuscles, List<string>? SecondaryMuscles);
}
