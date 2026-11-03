import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { NewWorkout } from "./new-workout/new-workout";
import { PlannedWorkouts } from "./planned-workouts/planned-workouts";
import { CompletedWorkouts } from "./completed-workouts/completed-workouts";

const tabs = ['planned', 'new', 'completed'];

// The training page: planned, new and completed workouts. Starting a workout opens /current-workout.
@Component({
  selector: 'app-workout',
  imports: [MatTabsModule, NewWorkout, PlannedWorkouts, CompletedWorkouts],
  templateUrl: './workout.html',
  styleUrl: './workout.css',
})
export class Workout {
  // ?tab=planned|new|completed; opens on "New Workout" otherwise.
  readonly selectedTabIndex = tabIndex(inject(ActivatedRoute).snapshot.queryParamMap.get('tab'));
}

function tabIndex(tab: string | null): number {
  const index = tabs.indexOf(tab ?? '');
  return index === -1 ? tabs.indexOf('new') : index;
}
