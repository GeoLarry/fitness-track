import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Exercise, Muscle } from '../../workout/exercise.model';
import { Observable, map } from 'rxjs';
import { TrainingService } from '../../workout/training.service';
import { AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-exercise-info-dialog',
  templateUrl: './exercise-info.html',
  styleUrls: ['./exercise-info.css'],
  imports: [MatCardModule, MatButtonModule, AsyncPipe]
})
export class ExerciseInfoDialog implements OnInit {
  private trainingService = inject(TrainingService);
  private dialogRef = inject<MatDialogRef<ExerciseInfoDialog>>(MatDialogRef);
  data = inject<Exercise>(MAT_DIALOG_DATA);


  currentImage = 0;
  instructionsList: string[] = [];

  muscles$!: Observable<Muscle[]>;
  primaryMuscles$!: Observable<Muscle[]>;
  secondaryMuscles$!: Observable<Muscle[]>;
  loading$!: Observable<boolean>;

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