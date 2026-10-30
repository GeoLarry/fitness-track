import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-completed-workouts',
  templateUrl: './completed-workouts.html',
  styleUrl: './completed-workouts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedWorkouts {}
