import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-planned-workouts',
  templateUrl: './planned-workouts.html',
  styleUrl: './planned-workouts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannedWorkouts {}
