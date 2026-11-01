using Starter.Core.Models;

namespace Starter.Infrastructure.Services;

internal static class ExerciseQueries
{
    // The shared catalog and the user's own custom exercises; other users' custom exercises stay private.
    public static IQueryable<Exercise> VisibleTo(this IQueryable<Exercise> exercises, int userId)
        => exercises.Where(e => e.CreatedByUserId == null || e.CreatedByUserId == userId);
}
