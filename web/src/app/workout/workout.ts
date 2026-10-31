import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { NewWorkout } from "./new-workout/new-workout";
import { PlannedWorkouts } from "./planned-workouts/planned-workouts";
import { CompletedWorkouts } from "./completed-workouts/completed-workouts";

// The training page: planned, new and completed workouts. Starting a workout opens /current-workout.
@Component({
  selector: 'app-workout',
  imports: [MatTabsModule, NewWorkout, PlannedWorkouts, CompletedWorkouts],
  templateUrl: './workout.html',
  styleUrl: './workout.css',
})
export class Workout {
  // Opens on "New Workout".
  readonly selectedTabIndex = 1;
}
