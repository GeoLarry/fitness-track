namespace Starter.Core.Contracts;

// A muscle, a piece of equipment or an exercise type.
public record CatalogItemResponse(int Id, string Name);

public record ExerciseResponse(
    int Id,
    string Name,
    string? Description,
    string? Instructions,
    int? TypeId,
    int? EquipmentId,
    IReadOnlyList<int> PrimaryMuscleIds,
    IReadOnlyList<int> SecondaryMuscleIds,
    // true for an exercise the signed-in user created.
    bool IsCustom);

// A custom exercise for the signed-in user.
public record CreateExerciseRequest(
    string Name,
    string? Description,
    string? Instructions,
    int? TypeId,
    int? EquipmentId,
    List<int>? PrimaryMuscleIds,
    List<int>? SecondaryMuscleIds);
