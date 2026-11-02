import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkoutService } from '../workout.service';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { apiErrorMessage } from '../../shared/http/api-error';

// The user's plans: start one (a copy, the plan stays), edit or delete it.
@Component({
  selector: 'app-planned-workouts',
  imports: [DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './planned-workouts.html',
  styleUrl: '../workout-list.css',
})
export class PlannedWorkouts {
  private confirm = inject(ConfirmService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  readonly workouts = inject(WorkoutService);

  async start(id: number) {
    try {
      await this.workouts.startPlan(id);
      await this.router.navigate(['/current-workout']);
    } catch (error) {
      this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
    }
  }

  edit(id: number) {
    void this.router.navigate(['/current-workout'], { queryParams: { plan: id } });
  }

  async delete(id: number) {
    try {
      if (await this.confirm.ask({ title: 'Delete this plan?', confirmLabel: 'Delete' })) await this.workouts.delete(id);
    } catch (error) {
      this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
    }
  }
}
