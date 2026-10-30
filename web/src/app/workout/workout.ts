import { Component, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from "../material.module";
import { NewWorkout } from "./new-workout/new-workout";
import { PlannedWorkouts } from "./planned-workouts/planned-workouts";
import { CompletedWorkouts } from "./completed-workouts/completed-workouts";
import { CurrentWorkout } from "./current-workout/current-workout";

@Component({
  selector: 'app-workout',
  imports: [MaterialModule, NewWorkout, PlannedWorkouts, CompletedWorkouts, CurrentWorkout],
  templateUrl: './workout.html',
  styleUrl: './workout.css',
})
export class Workout implements OnInit, OnDestroy {
  ongoingWorkout: boolean = false;
  selectedTabIndex = 1;

  constructor() { }

  ngOnInit(): void {
    //throw new Error('Method not implemented.');
  }
  ngOnDestroy(): void {
    //throw new Error('Method not implemented.');
  }

}
