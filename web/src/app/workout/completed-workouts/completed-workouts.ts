import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkoutService } from '../workout.service';
import { apiErrorMessage } from '../../shared/http/api-error';

// The workout history, newest first.
@Component({
  selector: 'app-completed-workouts',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatIconModule],
  templateUrl: './completed-workouts.html',
  styleUrl: '../workout-list.css',
})
export class CompletedWorkouts {
  private snackBar = inject(MatSnackBar);
  readonly workouts = inject(WorkoutService);

  // e.g. "1 h 05 min" or "48 min".
  duration(seconds: number | null): string {
    if (seconds === null) return '';
    const minutes = Math.round(seconds / 60);
    return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${(minutes % 60).toString().padStart(2, '0')} min` : `${minutes} min`;
  }

  async delete(id: number) {
    if (!confirm('Delete this workout from your history?')) return;
    try {
      await this.workouts.delete(id);
    } catch (error) {
      this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
    }
  }
}
