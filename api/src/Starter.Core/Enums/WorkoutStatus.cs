namespace Starter.Core.Enums;

// A plan waits to be done (and can be started many times), an in-progress workout is being done
// right now, a completed one is in the history. Stored as text in the database.
public enum WorkoutStatus
{
    Planned,
    InProgress,
    Completed
}
