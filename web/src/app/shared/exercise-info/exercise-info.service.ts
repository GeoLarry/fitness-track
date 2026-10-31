import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Exercise } from '../../models/exercise.model';
import { ExerciseInfoDialog } from './exercise-info';

@Injectable({ providedIn: 'root' })
export class ExerciseInfoService {
  private dialog = inject(MatDialog);

  open(exercise: Exercise) {
    this.dialog.open(ExerciseInfoDialog, {
      data: exercise,
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'exercise-info-dialog'
    });
  }
}
