import { Component, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from '../material.module';
import { Subscription } from 'rxjs';
import { PastTrainings } from "./past-trainings/past-trainings";
import { CurrentTraining } from "./current-training/current-training";
import { NewTraining } from "./new-training/new-training";
import { TrainingService } from './training.service';


@Component({
  selector: 'app-training',
  imports: [MaterialModule, PastTrainings, CurrentTraining, NewTraining],
  templateUrl: './training.html',
  styleUrl: './training.css',
})
export class Training implements OnInit {
  ongoingTraining = false;
  exerciseSubscription: Subscription;

  constructor(private trainingService: TrainingService) { }

  ngOnInit() {
    this.exerciseSubscription = this.trainingService.exerciseChanged.subscribe(
      exercise => {
        if (exercise) {
          this.ongoingTraining = true;
        } else {
          this.ongoingTraining = false;
        }
      });
  }
  ngOnDestroy(): void {
    if (this.exerciseSubscription) {
      this.exerciseSubscription.unsubscribe();
    }
  }

}
