import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { NewWorkout } from "./new-workout/new-workout";
import { PlannedWorkouts } from "./planned-workouts/planned-workouts";
import { CompletedWorkouts } from "./completed-workouts/completed-workouts";
import { CurrentWorkout } from "./current-workout/current-workout";

@Component({
  selector: 'app-workout',
  imports: [MatTabsModule, NewWorkout, PlannedWorkouts, CompletedWorkouts, CurrentWorkout],
  templateUrl: './workout.html',
  styleUrl: './workout.css',
})
export class Workout {
  ongoingWorkout = false;
  selectedTabIndex = 1;
}
