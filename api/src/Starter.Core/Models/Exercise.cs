namespace Starter.Core.Models;

// An exercise in the catalog. Shared exercises come from the seed; a custom exercise belongs
// to the user who created it and only that user sees it.
public class Exercise
{
    public int Id { get; set; }
    public required string Name { get; set; }

    // Upper-invariant copy used to keep names unique per owner, case-insensitively.
    public required string NormalizedName { get; set; }

    public string? Description { get; set; }

    // One step per line.
    public string? Instructions { get; set; }

    public int? ExerciseTypeId { get; set; }
    public ExerciseType? ExerciseType { get; set; }

    public int? EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }

    // null for the shared catalog.
    public int? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<ExerciseMuscle> Muscles { get; set; } = new();
}

public class ExerciseMuscle
{
    public int ExerciseId { get; set; }
    public int MuscleId { get; set; }
    public Muscle Muscle { get; set; } = null!;

    // Primary muscles do the work; secondary ones assist.
    public bool IsPrimary { get; set; }
}

public class Muscle
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

public class Equipment
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

// E.g. Strength or Cardio.
public class ExerciseType
{
    public int Id { get; set; }
    public required string Name { get; set; }
}
