// Mirrors api/src/Starter.Core/Contracts/WorkoutContracts.cs

// A plan for later, the workout being done now, or one in the history.
export type WorkoutStatus = 'Planned' | 'InProgress' | 'Completed';

export interface WorkoutSet {
  isWarmup: boolean;
  weightKg: number;
  reps: number;
  isDone: boolean;
}

// The list order is the order of the exercises in the workout.
export interface WorkoutExerciseRequest {
  exerciseId: number;
  notes: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutExercise {
  exerciseId: number;
  exerciseName: string;
  notes: string | null;
  sets: WorkoutSet[];
}

// Replaces the whole content of a workout.
export interface SaveWorkoutRequest {
  name: string | null;
  notes: string | null;
  plannedForUtc: string | null;
  durationSeconds: number | null;
  exercises: WorkoutExerciseRequest[];
}

// Status is Planned or InProgress; a workout is completed afterwards.
export interface CreateWorkoutRequest {
  status: Exclude<WorkoutStatus, 'Completed'>;
  name: string | null;
  notes: string | null;
  plannedForUtc: string | null;
  exercises: WorkoutExerciseRequest[];
}

export interface Workout {
  id: number;
  name: string | null;
  notes: string | null;
  status: WorkoutStatus;
  plannedForUtc: string | null;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  durationSeconds: number | null;
  sourcePlanId: number | null;
  updatedAtUtc: string;
  exercises: WorkoutExercise[];
}

// Sets and volume on one muscle. A set counts for every primary muscle of its exercise.
export interface MuscleSummary {
  muscleId: number;
  name: string;
  setCount: number;
  volumeKg: number;
}

// Totals of the workouts completed in the last days, working sets only. Most sets first.
export interface WorkoutPeriodSummary {
  days: number;
  workoutCount: number;
  durationSeconds: number;
  setCount: number;
  volumeKg: number;
  muscles: MuscleSummary[];
}

// A row in a list. Sets and volume (kg × reps) count working sets only.
export interface WorkoutSummary {
  id: number;
  name: string | null;
  status: WorkoutStatus;
  plannedForUtc: string | null;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  durationSeconds: number | null;
  exerciseCount: number;
  setCount: number;
  volumeKg: number;
}
