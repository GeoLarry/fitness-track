import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutService } from '../workout.service';

// The two ways to begin: a workout now, or a plan for later. Opening a live workout resumes the one in progress.
@Component({
  selector: 'app-new-workout',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './new-workout.html',
  styleUrl: './new-workout.css',
})
export class NewWorkout {
  private workouts = inject(WorkoutService);

  readonly inProgress = signal(false);

  constructor() {
    void this.checkInProgress();
  }

  // On failure the button keeps saying Start, and it still resumes a workout in progress.
  private async checkInProgress() {
    try {
      this.inProgress.set(await this.workouts.getCurrent() !== null);
    } catch {
      this.inProgress.set(false);
    }
  }
}
