using Microsoft.EntityFrameworkCore;
using Starter.Core.Contracts;
using Starter.Core.Enums;
using Starter.Core.Exceptions;
using Starter.Core.Interfaces;
using Starter.Core.Models;
using Starter.Infrastructure.Data;

namespace Starter.Infrastructure.Services;

public class WorkoutService(AppDbContext db) : IWorkoutService
{
    private const int NameMaxLength = 100;
    private const int NotesMaxLength = 1000;
    private const int MaxExercises = 50;
    private const int MaxSetsPerExercise = 50;
    private const decimal MaxWeightKg = 1000;
    private const int MaxReps = 1000;
    private const int MaxDurationSeconds = 24 * 60 * 60;

    public async Task<IReadOnlyList<WorkoutSummaryResponse>> GetWorkoutsAsync(int userId, WorkoutStatus? status, CancellationToken ct = default)
    {
        IQueryable<Workout> query = WithContent(OwnedBy(userId)).AsNoTracking();
        if (status is WorkoutStatus wanted) query = query.Where(w => w.Status == wanted);

        // Sorted in memory: SQLite cannot sum decimals, and the lists are small.
        List<Workout> workouts = await query.ToListAsync(ct);

        return workouts
            .OrderBy(w => w.Status switch { WorkoutStatus.InProgress => 0, WorkoutStatus.Planned => 1, _ => 2 })
            .ThenBy(w => w.Status == WorkoutStatus.Planned && w.PlannedForUtc is null)
            .ThenBy(w => w.Status == WorkoutStatus.Planned ? w.PlannedForUtc : null)
            .ThenByDescending(w => w.CompletedAtUtc ?? w.StartedAtUtc ?? w.CreatedAtUtc)
            .Select(ToSummary)
            .ToList();
    }

    public async Task<WorkoutResponse?> GetWorkoutAsync(int id, int userId, CancellationToken ct = default)
    {
        Workout? workout = await WithContent(OwnedBy(userId)).AsNoTracking().SingleOrDefaultAsync(w => w.Id == id, ct);
        return workout is null ? null : ToResponse(workout);
    }

    public async Task<WorkoutResponse?> GetCurrentAsync(int userId, CancellationToken ct = default)
    {
        Workout? workout = await WithContent(OwnedBy(userId)).AsNoTracking()
            .FirstOrDefaultAsync(w => w.Status == WorkoutStatus.InProgress, ct);
        return workout is null ? null : ToResponse(workout);
    }

    public async Task<WorkoutResponse> CreateAsync(int userId, CreateWorkoutRequest request, CancellationToken ct = default)
    {
        if (request.Status == WorkoutStatus.Completed)
            throw new ValidationFailedException("A workout is created as Planned or InProgress, then completed.");
        if (request.Status == WorkoutStatus.InProgress) await EnsureNothingInProgressAsync(userId, ct);

        Workout workout = new()
        {
            UserId = userId,
            Status = request.Status,
            StartedAtUtc = request.Status == WorkoutStatus.InProgress ? DateTime.UtcNow : null
        };
        await ApplyAsync(workout, userId, new SaveWorkoutRequest(request.Name, request.Notes, request.PlannedForUtc, null, request.Exercises), ct);

        db.Workouts.Add(workout);
        await db.SaveChangesAsync(ct);

        return (await GetWorkoutAsync(workout.Id, userId, ct))!;
    }

    public async Task<WorkoutResponse?> SaveAsync(int id, int userId, SaveWorkoutRequest request, CancellationToken ct = default)
    {
        Workout? workout = await WithContent(OwnedBy(userId)).SingleOrDefaultAsync(w => w.Id == id, ct);
        if (workout is null) return null;

        await ApplyAsync(workout, userId, request, ct);
        workout.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return await GetWorkoutAsync(id, userId, ct);
    }

    public async Task<WorkoutResponse?> StartFromPlanAsync(int planId, int userId, CancellationToken ct = default)
    {
        Workout? plan = await WithContent(OwnedBy(userId)).AsNoTracking().SingleOrDefaultAsync(w => w.Id == planId, ct);
        if (plan is null) return null;
        if (plan.Status != WorkoutStatus.Planned) throw new ValidationFailedException("Only a planned workout can be started.");
        await EnsureNothingInProgressAsync(userId, ct);

        Workout workout = new()
        {
            UserId = userId,
            Name = plan.Name,
            Notes = plan.Notes,
            Status = WorkoutStatus.InProgress,
            StartedAtUtc = DateTime.UtcNow,
            SourcePlanId = plan.Id,
            Exercises = plan.Exercises.OrderBy(e => e.Position).Select(e => new WorkoutExercise
            {
                Position = e.Position,
                ExerciseId = e.ExerciseId,
                Notes = e.Notes,
                Sets = e.Sets.OrderBy(s => s.Position).Select(s => new WorkoutSet
                {
                    Position = s.Position,
                    IsWarmup = s.IsWarmup,
                    WeightKg = s.WeightKg,
                    Reps = s.Reps
                }).ToList()
            }).ToList()
        };

        db.Workouts.Add(workout);
        await db.SaveChangesAsync(ct);

        return await GetWorkoutAsync(workout.Id, userId, ct);
    }

    public async Task<WorkoutResponse?> CompleteAsync(int id, int userId, CompleteWorkoutRequest request, CancellationToken ct = default)
    {
        Workout? workout = await OwnedBy(userId).SingleOrDefaultAsync(w => w.Id == id, ct);
        if (workout is null) return null;
        if (workout.Status != WorkoutStatus.InProgress) throw new ValidationFailedException("Only a workout in progress can be completed.");

        DateTime now = DateTime.UtcNow;
        workout.Status = WorkoutStatus.Completed;
        workout.CompletedAtUtc = now;
        workout.UpdatedAtUtc = now;
        workout.DurationSeconds = Duration(request.DurationSeconds)
            ?? (workout.StartedAtUtc is DateTime started ? (int)Math.Clamp((now - started).TotalSeconds, 0, MaxDurationSeconds) : null);
        await db.SaveChangesAsync(ct);

        return await GetWorkoutAsync(id, userId, ct);
    }

    public async Task<bool> DeleteAsync(int id, int userId, CancellationToken ct = default)
    {
        if (!await OwnedBy(userId).AnyAsync(w => w.Id == id, ct)) return false;

        await OwnedBy(userId).Where(w => w.SourcePlanId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(w => w.SourcePlanId, (int?)null), ct);
        await OwnedBy(userId).Where(w => w.Id == id).ExecuteDeleteAsync(ct);
        return true;
    }

    private IQueryable<Workout> OwnedBy(int userId) => db.Workouts.Where(w => w.UserId == userId);

    private static IQueryable<Workout> WithContent(IQueryable<Workout> workouts)
        => workouts.Include(w => w.Exercises).ThenInclude(e => e.Exercise)
            .Include(w => w.Exercises).ThenInclude(e => e.Sets)
            .AsSplitQuery();

    private async Task EnsureNothingInProgressAsync(int userId, CancellationToken ct)
    {
        if (await OwnedBy(userId).AnyAsync(w => w.Status == WorkoutStatus.InProgress, ct))
            throw new ValidationFailedException("Another workout is already in progress. Complete or delete it first.");
    }

    // Validates the request and replaces the workout's fields and content with it.
    private async Task ApplyAsync(Workout workout, int userId, SaveWorkoutRequest request, CancellationToken ct)
    {
        string? name = NullIfBlank(request.Name);
        string? notes = NullIfBlank(request.Notes);
        if (name?.Length > NameMaxLength) throw new ValidationFailedException($"Name must be at most {NameMaxLength} characters.");
        if (notes?.Length > NotesMaxLength) throw new ValidationFailedException($"Notes must be at most {NotesMaxLength} characters.");

        List<WorkoutExerciseRequest> exercises = request.Exercises ?? [];
        if (exercises.Count > MaxExercises) throw new ValidationFailedException($"A workout can have at most {MaxExercises} exercises.");

        foreach (WorkoutExerciseRequest exercise in exercises)
        {
            if (exercise.Notes?.Length > NotesMaxLength) throw new ValidationFailedException($"Exercise notes must be at most {NotesMaxLength} characters.");

            List<WorkoutSetDto> sets = exercise.Sets ?? [];
            if (sets.Count > MaxSetsPerExercise) throw new ValidationFailedException($"An exercise can have at most {MaxSetsPerExercise} sets.");
            if (sets.Any(s => s.WeightKg < 0 || s.WeightKg > MaxWeightKg)) throw new ValidationFailedException($"Weight must be between 0 and {MaxWeightKg} kg.");
            if (sets.Any(s => s.Reps < 0 || s.Reps > MaxReps)) throw new ValidationFailedException($"Reps must be between 0 and {MaxReps}.");
        }

        List<int> exerciseIds = exercises.Select(e => e.ExerciseId).Distinct().ToList();
        int known = await db.Exercises.VisibleTo(userId).CountAsync(e => exerciseIds.Contains(e.Id), ct);
        if (known != exerciseIds.Count) throw new ValidationFailedException("Unknown exercise.");

        workout.Name = name;
        workout.Notes = notes;
        workout.PlannedForUtc = request.PlannedForUtc;
        if (request.DurationSeconds is not null) workout.DurationSeconds = Duration(request.DurationSeconds);

        // Removing the old rows deletes them; the new ones get their positions from the request order.
        workout.Exercises.Clear();
        workout.Exercises.AddRange(exercises.Select((exercise, index) => new WorkoutExercise
        {
            Position = index,
            ExerciseId = exercise.ExerciseId,
            Notes = NullIfBlank(exercise.Notes),
            Sets = WarmupsFirst(exercise.Sets ?? [])
                .Select((set, setIndex) => new WorkoutSet
                {
                    Position = setIndex,
                    IsWarmup = set.IsWarmup,
                    WeightKg = set.WeightKg,
                    Reps = set.Reps,
                    IsDone = set.IsDone
                }).ToList()
        }));
    }

    private static int? Duration(int? seconds)
    {
        if (seconds is < 0 or > MaxDurationSeconds) throw new ValidationFailedException("Duration must be between 0 seconds and 24 hours.");
        return seconds;
    }

    // Warm-ups always come first, keeping the order within each group.
    private static IEnumerable<WorkoutSetDto> WarmupsFirst(IEnumerable<WorkoutSetDto> sets)
        => sets.OrderBy(s => s.IsWarmup ? 0 : 1);

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static WorkoutResponse ToResponse(Workout w) => new(
        w.Id,
        w.Name,
        w.Notes,
        w.Status,
        w.PlannedForUtc,
        w.StartedAtUtc,
        w.CompletedAtUtc,
        w.DurationSeconds,
        w.SourcePlanId,
        w.UpdatedAtUtc,
        w.Exercises.OrderBy(e => e.Position).Select(e => new WorkoutExerciseResponse(
            e.ExerciseId,
            e.Exercise.Name,
            e.Notes,
            e.Sets.OrderBy(s => s.Position).Select(s => new WorkoutSetDto(s.IsWarmup, s.WeightKg, s.Reps, s.IsDone)).ToList()))
        .ToList());

    private static WorkoutSummaryResponse ToSummary(Workout w)
    {
        List<WorkoutSet> workingSets = w.Exercises.SelectMany(e => e.Sets).Where(s => !s.IsWarmup).ToList();
        return new WorkoutSummaryResponse(
            w.Id,
            w.Name,
            w.Status,
            w.PlannedForUtc,
            w.StartedAtUtc,
            w.CompletedAtUtc,
            w.DurationSeconds,
            w.Exercises.Count,
            workingSets.Count,
            workingSets.Sum(s => s.WeightKg * s.Reps));
    }
}
