import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NgForm, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface newWorkoutOptions {
  id: string;
  message: string;
}

@Component({
  selector: 'app-new-workout',
  imports: [MatCardModule, MatFormFieldModule, MatSelectModule, MatButtonModule, FormsModule],
  templateUrl: './new-workout.html',
  styleUrl: './new-workout.css',
})
export class NewWorkout {
  private route = inject(Router);

  workoutOptions: newWorkoutOptions[] = [
    { id: 'start-workout', message: 'Start now a workout' },
    { id: 'plan-workout', message: 'Plan a workout' },
  ]

  onStartWorkout(form: NgForm) {
    const workoutOption = form.value.workout;
    if(workoutOption === 'start-workout') {
      this.route.navigate(['/current-workout'], {queryParams: { mode: 'start-workout' }});
    } else {
      this.route.navigate(['/current-workout'], {queryParams: { mode: 'plan-workout' }});
    }

  }
}
