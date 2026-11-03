import { Component } from '@angular/core';
import { NewWorkout } from "./new-workout/new-workout";
import { PlannedWorkouts } from "./planned-workouts/planned-workouts";

// The training page: start a workout or a plan, and the saved plans. Starting a workout opens /current-workout.
@Component({
  selector: 'app-workout',
  imports: [NewWorkout, PlannedWorkouts],
  templateUrl: './workout.html',
  styleUrl: './workout.css',
})
export class Workout {}
