using Starter.Api.Extensions;
using Starter.Core.Contracts;
using Starter.Core.Enums;
using Starter.Core.Interfaces;

namespace Starter.Api.Endpoints;

// The signed-in user's workouts: plans, the one in progress and the completed history.
// Another user's workout answers 404, as if it did not exist.
public static class WorkoutEndpoints
{
    private static readonly object NotFound = new { message = "Workout not found." };

    public static void MapWorkoutEndpoints(this IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup("/api/workouts").WithTags("Workouts");

        group.MapGet("/", async (WorkoutStatus? status, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            return Results.Ok(await workouts.GetWorkoutsAsync(userId, status, ct));
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.View);

        // 204 when no workout is in progress.
        group.MapGet("/current", async (ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            WorkoutResponse? workout = await workouts.GetCurrentAsync(userId, ct);
            return workout is null ? Results.NoContent() : Results.Ok(workout);
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.View);

        // Totals of the last days, 7 unless asked otherwise.
        group.MapGet("/summary", async (int? days, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            return Results.Ok(await workouts.GetSummaryAsync(userId, days ?? 7, ct));
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.View);

        group.MapGet("/{id:int}", async (int id, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            WorkoutResponse? workout = await workouts.GetWorkoutAsync(id, userId, ct);
            return workout is null ? Results.NotFound(NotFound) : Results.Ok(workout);
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.View);

        group.MapPost("/", async (CreateWorkoutRequest request, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            WorkoutResponse workout = await workouts.CreateAsync(userId, request, ct);
            return Results.Created($"/api/workouts/{workout.Id}", workout);
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.Create);

        group.MapPut("/{id:int}", async (int id, SaveWorkoutRequest request, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            WorkoutResponse? workout = await workouts.SaveAsync(id, userId, request, ct);
            return workout is null ? Results.NotFound(NotFound) : Results.Ok(workout);
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.Edit);

        // Starts a new in-progress workout from a plan; the plan stays.
        group.MapPost("/{id:int}/start", async (int id, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            WorkoutResponse? workout = await workouts.StartFromPlanAsync(id, userId, ct);
            return workout is null ? Results.NotFound(NotFound) : Results.Created($"/api/workouts/{workout.Id}", workout);
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.Create);

        group.MapPost("/{id:int}/complete", async (int id, CompleteWorkoutRequest? request, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            WorkoutResponse? workout = await workouts.CompleteAsync(id, userId, request ?? new CompleteWorkoutRequest(null), ct);
            return workout is null ? Results.NotFound(NotFound) : Results.Ok(workout);
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.Edit);

        group.MapDelete("/{id:int}", async (int id, ICurrentUserService currentUser, IWorkoutService workouts, CancellationToken ct) =>
        {
            if (currentUser.UserId is not int userId) return Results.Unauthorized();

            return await workouts.DeleteAsync(id, userId, ct) ? Results.NoContent() : Results.NotFound(NotFound);
        })
        .RequirePermission(PermissionModule.Workouts, PermissionAction.Delete);
    }
}
