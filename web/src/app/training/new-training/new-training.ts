import { Component, OnInit, OnDestroy } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { TrainingService } from '../training.service';
import { Exercise } from '../exercise.model';
import { NgForm, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-training',
  imports: [MaterialModule, FormsModule],
  templateUrl: './new-training.html',
  styleUrl: './new-training.css',
})
export class NewTraining implements OnInit, OnDestroy {

  exerciseSubscription: Subscription;
  exercises: Exercise[];

  constructor(
    private trainingService: TrainingService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.exerciseSubscription = this.trainingService.exercisesChanged.subscribe(exercises => {
        this.exercises = exercises;
      });
      this.trainingService.fetchExercises();
    }, 0);
  }

  onStartTraining(form: NgForm) {
    this.trainingService.startExercise(form.value.exercise);
  }

  ngOnDestroy(): void {
    if (this.exerciseSubscription) {
      this.exerciseSubscription.unsubscribe();
    }
  }

}
