using Starter.Core.Contracts;
using Starter.Core.Enums;
using Starter.Core.Models;

namespace Starter.Core.Interfaces;

public interface IAuthService
{
    // Throws ValidationFailedException on invalid input or a taken username/email.
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);

    // null on wrong credentials or a deactivated account (same result, not distinguishable).
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default);

    // null if the user no longer exists or is deactivated.
    Task<CurrentUserDto?> GetCurrentUserAsync(int userId, CancellationToken ct = default);
}

public interface IUserService
{
    Task<PagedResponse<UserResponse>> GetUsersAsync(int pageNumber, int pageSize, string? search, CancellationToken ct = default);
    Task<UserResponse?> GetUserByIdAsync(int id, CancellationToken ct = default);
    Task<UserResponse> CreateUserAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request, CancellationToken ct = default);
    Task<bool> DeactivateUserAsync(int id, CancellationToken ct = default);
    Task<bool> ReactivateUserAsync(int id, CancellationToken ct = default);

    // true if the user holds a role that can never be assigned through the API (Super Admin).
    // Such accounts can only be edited by callers with the System.Edit permission.
    Task<bool> IsProtectedUserAsync(int id, CancellationToken ct = default);
}

public interface IRoleService
{
    Task<IReadOnlyList<RoleResponse>> GetAllRolesAsync(CancellationToken ct = default);
    Task<RoleResponse?> GetRoleByIdAsync(int id, CancellationToken ct = default);
    Task<RoleResponse> CreateRoleAsync(CreateRoleRequest request, CancellationToken ct = default);

    // null if not found. Throws ValidationFailedException for an immutable role,
    // or a system role when the caller lacks System.Edit.
    Task<RoleResponse?> UpdateRoleAsync(int id, UpdateRoleRequest request, bool callerCanEditSystemRoles, CancellationToken ct = default);

    Task<RoleDeleteResult> DeleteRoleAsync(int id, CancellationToken ct = default);
}

public interface IExerciseCatalogService
{
    // The shared catalog plus the user's own custom exercises, by name.
    Task<IReadOnlyList<ExerciseResponse>> GetExercisesAsync(int userId, CancellationToken ct = default);

    // null if it does not exist or is another user's custom exercise.
    Task<ExerciseResponse?> GetExerciseAsync(int id, int userId, CancellationToken ct = default);

    // Throws ValidationFailedException on invalid input, unknown ids or a name the user already sees.
    Task<ExerciseResponse> CreateExerciseAsync(int userId, CreateExerciseRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<CatalogItemResponse>> GetMusclesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<CatalogItemResponse>> GetEquipmentAsync(CancellationToken ct = default);
    Task<IReadOnlyList<CatalogItemResponse>> GetExerciseTypesAsync(CancellationToken ct = default);
}

// Every method works on the caller's own workouts only: another user's workout is treated as missing.
public interface IWorkoutService
{
    // Completed: newest first. Planned: by planned day, undated last. All statuses when status is null.
    Task<IReadOnlyList<WorkoutSummaryResponse>> GetWorkoutsAsync(int userId, WorkoutStatus? status, CancellationToken ct = default);

    // null if it does not exist or belongs to another user.
    Task<WorkoutResponse?> GetWorkoutAsync(int id, int userId, CancellationToken ct = default);

    // The in-progress workout, or null when there is none.
    Task<WorkoutResponse?> GetCurrentAsync(int userId, CancellationToken ct = default);

    // Throws ValidationFailedException on invalid input, a Completed status,
    // or a new in-progress workout while another one is running.
    Task<WorkoutResponse> CreateAsync(int userId, CreateWorkoutRequest request, CancellationToken ct = default);

    // Replaces the content. null if not found; throws ValidationFailedException on invalid input.
    Task<WorkoutResponse?> SaveAsync(int id, int userId, SaveWorkoutRequest request, CancellationToken ct = default);

    // Copies a plan into a new in-progress workout; the plan stays. null if not found.
    // Throws ValidationFailedException if it is not a plan or another workout is running.
    Task<WorkoutResponse?> StartFromPlanAsync(int planId, int userId, CancellationToken ct = default);

    // null if not found. Throws ValidationFailedException if the workout is not in progress.
    Task<WorkoutResponse?> CompleteAsync(int id, int userId, CompleteWorkoutRequest request, CancellationToken ct = default);

    Task<bool> DeleteAsync(int id, int userId, CancellationToken ct = default);
}

public interface IPermissionService
{
    // Union of the permissions of all the user's roles, read from the database on every call,
    // so role changes and deactivation apply immediately, even to tokens already issued.
    // Empty set for a missing or deactivated user.
    Task<HashSet<(PermissionModule Module, PermissionAction Action)>> GetEffectivePermissionsAsync(int userId, CancellationToken ct = default);
}

public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(User user);
}

// Resolves "who is calling" from the JWT of the current request. Scoped, once per request.
public interface ICurrentUserService
{
    int? UserId { get; }
    string? Username { get; }
    bool IsAuthenticated { get; }
    Task<bool> HasPermissionAsync(PermissionModule module, PermissionAction action, CancellationToken ct = default);
}
