import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkoutService } from '../workout.service';
import { workoutDuration } from '../workout-duration';
import { WorkoutPreview } from './workout-preview/workout-preview';
import { WorkoutPeriodSummary, WorkoutSummary } from '../../models/workout.model';
import { API_URL } from '../../shared/http/api-url';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { apiErrorMessage } from '../../shared/http/api-error';
import { SwipeActions } from '../../shared/swipe-actions/swipe-actions';

// The workout history, newest first, and the totals of the last week. Tap a workout for its sets,
// swipe it left to delete it.
@Component({
  selector: 'app-completed-workouts',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatIconModule, MatMenuModule, SwipeActions],
  templateUrl: './completed-workouts.html',
  styleUrls: ['../workout-list.css', './completed-workouts.css'],
})
export class CompletedWorkouts {
  private confirm = inject(ConfirmService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly workouts = inject(WorkoutService);

  readonly duration = workoutDuration;

  // Loaded each time the page opens, so a workout just finished is in it.
  private readonly summaryResource = httpResource<WorkoutPeriodSummary>(() => `${API_URL}/workouts/summary?days=7`);
  // Nothing to sum up until the first workout is done.
  readonly summary = computed(() => {
    const hasWorkouts = !this.workouts.completed.error() && this.workouts.completed.value().length > 0;
    return hasWorkouts && this.summaryResource.hasValue() ? this.summaryResource.value() : null;
  });
  // Phones show the first few muscles until asked; computers show them all (see the css).
  readonly musclesOnPhone = 3;
  readonly allMuscles = signal(false);

  openPreview(workout: WorkoutSummary) {
    this.dialog.open(WorkoutPreview, {
      data: workout,
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'full-screen-dialog'
    });
  }

  // A swiped card goes back to its place unless the workout was really deleted.
  async delete(id: number, swipe?: SwipeActions) {
    try {
      if (await this.confirm.ask({ title: 'Delete this workout from your history?', confirmLabel: 'Delete' })) {
        await this.workouts.delete(id);
        this.summaryResource.reload();
        return;
      }
    } catch (error) {
      this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
    }
    swipe?.reset();
  }
}
