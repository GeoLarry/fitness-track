using Microsoft.EntityFrameworkCore;
using Starter.Core.Contracts;
using Starter.Core.Exceptions;
using Starter.Core.Interfaces;
using Starter.Core.Models;
using Starter.Infrastructure.Data;

namespace Starter.Infrastructure.Services;

public class ExerciseCatalogService(AppDbContext db) : IExerciseCatalogService
{
    private const int NameMaxLength = 100;
    private const int DescriptionMaxLength = 1000;
    private const int InstructionsMaxLength = 4000;

    public async Task<IReadOnlyList<ExerciseResponse>> GetExercisesAsync(int userId, CancellationToken ct = default)
    {
        List<Exercise> exercises = await VisibleTo(userId)
            .AsNoTracking()
            .Include(e => e.Muscles)
            .OrderBy(e => e.NormalizedName)
            .ToListAsync(ct);

        return exercises.Select(ToResponse).ToList();
    }

    public async Task<ExerciseResponse?> GetExerciseAsync(int id, int userId, CancellationToken ct = default)
    {
        Exercise? exercise = await VisibleTo(userId)
            .AsNoTracking()
            .Include(e => e.Muscles)
            .SingleOrDefaultAsync(e => e.Id == id, ct);

        return exercise is null ? null : ToResponse(exercise);
    }

    public async Task<ExerciseResponse> CreateExerciseAsync(int userId, CreateExerciseRequest request, CancellationToken ct = default)
    {
        string name = request.Name?.Trim() ?? "";
        if (name.Length == 0) throw new ValidationFailedException("Name is required.");
        if (name.Length > NameMaxLength) throw new ValidationFailedException($"Name must be at most {NameMaxLength} characters.");
        if (request.Description?.Length > DescriptionMaxLength) throw new ValidationFailedException($"Description must be at most {DescriptionMaxLength} characters.");
        if (request.Instructions?.Length > InstructionsMaxLength) throw new ValidationFailedException($"Instructions must be at most {InstructionsMaxLength} characters.");

        List<int> primaryIds = (request.PrimaryMuscleIds ?? []).Distinct().ToList();
        List<int> secondaryIds = (request.SecondaryMuscleIds ?? []).Distinct().ToList();
        if (primaryIds.Intersect(secondaryIds).Any())
            throw new ValidationFailedException("A muscle cannot be both primary and secondary.");

        List<int> muscleIds = primaryIds.Concat(secondaryIds).ToList();
        int knownMuscles = await db.Muscles.CountAsync(m => muscleIds.Contains(m.Id), ct);
        if (knownMuscles != muscleIds.Count) throw new ValidationFailedException("Unknown muscle.");

        if (request.TypeId is int typeId && !await db.ExerciseTypes.AnyAsync(t => t.Id == typeId, ct))
            throw new ValidationFailedException("Unknown exercise type.");
        if (request.EquipmentId is int equipmentId && !await db.Equipment.AnyAsync(e => e.Id == equipmentId, ct))
            throw new ValidationFailedException("Unknown equipment.");

        string normalizedName = name.ToUpperInvariant();
        if (await VisibleTo(userId).AnyAsync(e => e.NormalizedName == normalizedName, ct))
            throw new ValidationFailedException($"An exercise named '{name}' already exists.");

        Exercise exercise = new()
        {
            Name = name,
            NormalizedName = normalizedName,
            Description = NullIfBlank(request.Description),
            Instructions = NullIfBlank(request.Instructions),
            ExerciseTypeId = request.TypeId,
            EquipmentId = request.EquipmentId,
            CreatedByUserId = userId,
            Muscles = primaryIds.Select(id => new ExerciseMuscle { MuscleId = id, IsPrimary = true })
                .Concat(secondaryIds.Select(id => new ExerciseMuscle { MuscleId = id, IsPrimary = false }))
                .ToList()
        };

        db.Exercises.Add(exercise);
        await db.SaveChangesAsync(ct);

        return ToResponse(exercise);
    }

    public async Task<IReadOnlyList<CatalogItemResponse>> GetMusclesAsync(CancellationToken ct = default)
        => await db.Muscles.AsNoTracking().OrderBy(m => m.Name).Select(m => new CatalogItemResponse(m.Id, m.Name)).ToListAsync(ct);

    public async Task<IReadOnlyList<CatalogItemResponse>> GetEquipmentAsync(CancellationToken ct = default)
        => await db.Equipment.AsNoTracking().OrderBy(e => e.Name).Select(e => new CatalogItemResponse(e.Id, e.Name)).ToListAsync(ct);

    public async Task<IReadOnlyList<CatalogItemResponse>> GetExerciseTypesAsync(CancellationToken ct = default)
        => await db.ExerciseTypes.AsNoTracking().OrderBy(t => t.Name).Select(t => new CatalogItemResponse(t.Id, t.Name)).ToListAsync(ct);

    // The shared catalog and the user's own custom exercises; other users' custom exercises stay private.
    private IQueryable<Exercise> VisibleTo(int userId)
        => db.Exercises.Where(e => e.CreatedByUserId == null || e.CreatedByUserId == userId);

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ExerciseResponse ToResponse(Exercise e) => new(
        e.Id,
        e.Name,
        e.Description,
        e.Instructions,
        e.ExerciseTypeId,
        e.EquipmentId,
        e.Muscles.Where(m => m.IsPrimary).Select(m => m.MuscleId).ToList(),
        e.Muscles.Where(m => !m.IsPrimary).Select(m => m.MuscleId).ToList(),
        e.CreatedByUserId is not null);
}
