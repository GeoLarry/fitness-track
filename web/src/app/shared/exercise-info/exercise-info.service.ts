import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Exercise } from '../../training/exercise.model';
import { ExerciseInfoDialog } from './exercise-info';

@Injectable({ providedIn: 'root' })
export class ExerciseInfoService {

  constructor(private dialog: MatDialog) {}

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