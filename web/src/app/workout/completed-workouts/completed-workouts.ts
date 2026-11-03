import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkoutService } from '../workout.service';
import { workoutDuration } from '../workout-duration';
import { WorkoutPreview } from './workout-preview/workout-preview';
import { WorkoutSummary } from '../../models/workout.model';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { apiErrorMessage } from '../../shared/http/api-error';
import { SwipeActions } from '../../shared/swipe-actions/swipe-actions';

// The workout history, newest first. Tap a workout for its sets, swipe it left to delete it.
@Component({
  selector: 'app-completed-workouts',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatIconModule, MatMenuModule, SwipeActions],
  templateUrl: './completed-workouts.html',
  styleUrl: '../workout-list.css',
})
export class CompletedWorkouts {
  private confirm = inject(ConfirmService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly workouts = inject(WorkoutService);

  readonly duration = workoutDuration;

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
        return;
      }
    } catch (error) {
      this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
    }
    swipe?.reset();
  }
}
