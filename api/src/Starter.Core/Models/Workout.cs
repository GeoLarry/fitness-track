using Starter.Core.Enums;

namespace Starter.Core.Models;

// A workout of one user: a plan, the workout being done now or a completed one.
public class Workout
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string? Name { get; set; }
    public string? Notes { get; set; }
    public WorkoutStatus Status { get; set; }

    // The day a plan is meant for, if any.
    public DateTime? PlannedForUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }

    // From the timer of the web app; worked out from StartedAtUtc when it is not sent.
    public int? DurationSeconds { get; set; }

    // The plan this workout was started from. Set to null when the plan is deleted.
    public int? SourcePlanId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<WorkoutExercise> Exercises { get; set; } = new();
}

// One exercise in a workout. The same exercise can appear more than once.
public class WorkoutExercise
{
    public int Id { get; set; }
    public int WorkoutId { get; set; }
    public int Position { get; set; }

    public int ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;

    public string? Notes { get; set; }

    public List<WorkoutSet> Sets { get; set; } = new();
}

// A warm-up or working set. Warm-ups always come first.
public class WorkoutSet
{
    public int Id { get; set; }
    public int WorkoutExerciseId { get; set; }
    public int Position { get; set; }

    public bool IsWarmup { get; set; }
    public decimal WeightKg { get; set; }
    public int Reps { get; set; }
    public bool IsDone { get; set; }
}
