using Starter.Core.Enums;

namespace Starter.Core.Contracts;

public record WorkoutSetDto(bool IsWarmup, decimal WeightKg, int Reps, bool IsDone);

// The exercises of a workout in the order they are done; the list order is the position.
public record WorkoutExerciseRequest(int ExerciseId, string? Notes, List<WorkoutSetDto>? Sets);

public record WorkoutExerciseResponse(int ExerciseId, string ExerciseName, string? Notes, IReadOnlyList<WorkoutSetDto> Sets);

// Replaces the whole content of a workout. Warm-ups are moved above the working sets.
public record SaveWorkoutRequest(
    string? Name,
    string? Notes,
    DateTime? PlannedForUtc,
    int? DurationSeconds,
    List<WorkoutExerciseRequest>? Exercises);

// Status is Planned (a plan for later) or InProgress (starts now).
public record CreateWorkoutRequest(
    WorkoutStatus Status,
    string? Name,
    string? Notes,
    DateTime? PlannedForUtc,
    List<WorkoutExerciseRequest>? Exercises);

// Without a duration it is worked out from the start time.
public record CompleteWorkoutRequest(int? DurationSeconds);

public record WorkoutResponse(
    int Id,
    string? Name,
    string? Notes,
    WorkoutStatus Status,
    DateTime? PlannedForUtc,
    DateTime? StartedAtUtc,
    DateTime? CompletedAtUtc,
    int? DurationSeconds,
    int? SourcePlanId,
    DateTime UpdatedAtUtc,
    IReadOnlyList<WorkoutExerciseResponse> Exercises);

// Sets and volume on one muscle. A set counts for every primary muscle of its exercise.
public record MuscleSummaryResponse(int MuscleId, string Name, int SetCount, decimal VolumeKg);

// Totals of the workouts completed in the last days, working sets only.
// Most sets first. Exercises without a primary muscle only count in the totals.
public record WorkoutPeriodSummaryResponse(
    int Days,
    int WorkoutCount,
    int DurationSeconds,
    int SetCount,
    decimal VolumeKg,
    IReadOnlyList<MuscleSummaryResponse> Muscles);

// A row in a list of workouts. Volume is kg × reps of the working sets.
public record WorkoutSummaryResponse(
    int Id,
    string? Name,
    WorkoutStatus Status,
    DateTime? PlannedForUtc,
    DateTime? StartedAtUtc,
    DateTime? CompletedAtUtc,
    int? DurationSeconds,
    int ExerciseCount,
    int SetCount,
    decimal VolumeKg);
