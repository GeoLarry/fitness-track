import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkoutService } from '../workout.service';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { apiErrorMessage } from '../../shared/http/api-error';
import { SwipeActions } from '../../shared/swipe-actions/swipe-actions';

// The user's plans: swipe right to start one (a copy, the plan stays), swipe left to delete it, tap to edit it.
@Component({
  selector: 'app-planned-workouts',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatMenuModule, SwipeActions],
  templateUrl: './planned-workouts.html',
  styleUrl: '../workout-list.css',
})
export class PlannedWorkouts {
  private confirm = inject(ConfirmService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  readonly workouts = inject(WorkoutService);

  // Only one workout can run at a time, so a running one is offered instead of a new one.
  // A swiped card goes back to its place unless the page changes.
  async start(id: number, swipe?: SwipeActions) {
    try {
      if (await this.workouts.getCurrent()) {
        if (await this.confirm.ask({
          title: 'A workout is already in progress', message: 'Finish or cancel it before starting this plan.',
          confirmLabel: 'Open workout', cancelLabel: 'Close',
        })) {
          await this.router.navigate(['/current-workout']);
          return;
        }
      } else if (await this.confirm.ask({ title: 'Start this plan?', message: 'Your plan stays as it is.', confirmLabel: 'Start' })) {
        await this.workouts.startPlan(id);
        await this.router.navigate(['/current-workout']);
        return;
      }
    } catch (error) {
      this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
    }
    swipe?.reset();
  }

  edit(id: number) {
    void this.router.navigate(['/current-workout'], { queryParams: { plan: id } });
  }

  async delete(id: number, swipe?: SwipeActions) {
    try {
      if (await this.confirm.ask({ title: 'Delete this plan?', confirmLabel: 'Delete' })) {
        await this.workouts.delete(id);
        return;
      }
    } catch (error) {
      this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
    }
    swipe?.reset();
  }
}
