import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutExercise, WorkoutSet, WorkoutSummary } from '../../../models/workout.model';
import { apiErrorMessage } from '../../../shared/http/api-error';
import { WorkoutService } from '../../workout.service';
import { workoutDuration } from '../../workout-duration';

// Full-screen, read-only view of a finished workout: the totals from the list, then every exercise and set.
@Component({
  selector: 'app-workout-preview',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatIconModule],
  templateUrl: './workout-preview.html',
  styleUrl: './workout-preview.css',
})
export class WorkoutPreview {
  private dialogRef = inject<MatDialogRef<WorkoutPreview>>(MatDialogRef);
  private workouts = inject(WorkoutService);

  readonly workout = inject<WorkoutSummary>(MAT_DIALOG_DATA);
  readonly duration = workoutDuration;
  readonly exercises = signal<WorkoutExercise[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  // Set number counting working sets only, e.g. warm-up, warm-up, 1, 2.
  setNumber(sets: WorkoutSet[], index: number): number {
    return sets.slice(0, index + 1).filter(s => !s.isWarmup).length;
  }

  close() {
    this.dialogRef.close();
  }

  private async load() {
    try {
      const workout = await this.workouts.get(this.workout.id);
      this.exercises.set(workout.exercises);
    } catch (error) {
      this.error.set(apiErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
