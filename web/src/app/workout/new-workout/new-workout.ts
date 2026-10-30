import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { NgForm, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface newWorkoutOptions {
  id: string;
  message: string;
}

@Component({
  selector: 'app-new-workout',
  imports: [MaterialModule, FormsModule],
  templateUrl: './new-workout.html',
  styleUrl: './new-workout.css',
})
export class NewWorkout implements OnInit {
  workoutOptions: newWorkoutOptions[] = [
    { id: 'start-workout', message: 'Start now a workout' },
    { id: 'plan-workout', message: 'Plan a workout' },
  ]
  constructor(private route: Router) { }

  ngOnInit() {

  }

  onStartWorkout(form: NgForm) {
    let workoutOption = form.value.workout;
    if(workoutOption === 'start-workout') {
      this.route.navigate(['/current-workout'], {queryParams: { mode: 'start-workout' }});
    } else {
      this.route.navigate(['/current-workout'], {queryParams: { mode: 'plan-workout' }});
    }

  }
}
