using Starter.Api.Extensions;
using Starter.Core.Contracts;
using Starter.Core.Enums;
using Starter.Core.Interfaces;

namespace Starter.Api.Endpoints;

// The exercise catalog: shared exercises plus the signed-in user's custom ones, and the lists
// (muscles, equipment, exercise types) an exercise refers to by id.
public static class ExerciseEndpoints
{
    public static void MapExerciseEndpoints(this IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup("/api/exercises").WithTags("Exercises");

        group.MapGet("/", async (ICurrentUserService currentUser, IExerciseCatalogService catalog, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            IReadOnlyList<ExerciseResponse> exercises = await catalog.GetExercisesAsync(userId, ct);
            return Results.Ok(exercises);
        })
        .RequirePermission(PermissionModule.Exercises, PermissionAction.View);

        group.MapGet("/{id:int}", async (int id, ICurrentUserService currentUser, IExerciseCatalogService catalog, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            ExerciseResponse? exercise = await catalog.GetExerciseAsync(id, userId, ct);
            return exercise is null ? Results.NotFound(new { message = "Exercise not found." }) : Results.Ok(exercise);
        })
        .RequirePermission(PermissionModule.Exercises, PermissionAction.View);

        group.MapPost("/", async (CreateExerciseRequest request, ICurrentUserService currentUser, IExerciseCatalogService catalog, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            ExerciseResponse exercise = await catalog.CreateExerciseAsync(userId, request, ct);
            return Results.Created($"/api/exercises/{exercise.Id}", exercise);
        })
        .RequirePermission(PermissionModule.Exercises, PermissionAction.Create);

        app.MapGet("/api/muscles", async (IExerciseCatalogService catalog, CancellationToken ct) =>
            Results.Ok(await catalog.GetMusclesAsync(ct)))
            .WithTags("Exercises")
            .RequirePermission(PermissionModule.Exercises, PermissionAction.View);

        app.MapGet("/api/equipment", async (IExerciseCatalogService catalog, CancellationToken ct) =>
            Results.Ok(await catalog.GetEquipmentAsync(ct)))
            .WithTags("Exercises")
            .RequirePermission(PermissionModule.Exercises, PermissionAction.View);

        app.MapGet("/api/exercise-types", async (IExerciseCatalogService catalog, CancellationToken ct) =>
            Results.Ok(await catalog.GetExerciseTypesAsync(ct)))
            .WithTags("Exercises")
            .RequirePermission(PermissionModule.Exercises, PermissionAction.View);
    }
}
