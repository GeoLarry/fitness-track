import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Exercise, Muscle } from '../../training/exercise.model';
import { Observable, map } from 'rxjs';
import { TrainingService } from '../../training/training.service';
import { AsyncPipe } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  standalone: true,
  selector: 'app-exercise-info-dialog',
  templateUrl: './exercise-info.html',
  styleUrls: ['./exercise-info.css'],
  imports: [MaterialModule, AsyncPipe]
})
export class ExerciseInfoDialog {

  currentImage = 0;
  instructionsList: string[] = [];

  muscles$!: Observable<Muscle[]>;
  primaryMuscles$!: Observable<Muscle[]>;
  secondaryMuscles$!: Observable<Muscle[]>;
  loading$!: Observable<boolean>;

  constructor(
    private trainingService: TrainingService,
    private dialogRef: MatDialogRef<ExerciseInfoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Exercise
  ) { }

  ngOnInit() {
    /* Loading State */
    this.loading$ = this.trainingService.loadingState$;

    /* Instructions */
    if (this.data.instructions) {
      this.instructionsList = this.data.instructions
        .split('\n')
        .map(l => l.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);
    }
    /* muscles worked */
    const muscles$ = this.trainingService.muscles$;
    this.trainingService.fetchMuscles();

    this.primaryMuscles$ = muscles$.pipe(
      map(muscles =>
        muscles.filter(m =>
          this.data.primaryMuscleIds?.includes(m.id)
        )
      )
    );

    this.secondaryMuscles$ = muscles$.pipe(
      map(muscles =>
        muscles.filter(m =>
          this.data.secondaryMuscleIds?.includes(m.id)
        )
      )
    );
  }

  close() {
    this.dialogRef.close();
  }

  nextImage() {
    if (!this.data.images?.length) return;
    this.currentImage =
      (this.currentImage + 1) % this.data.images.length;
  }
}