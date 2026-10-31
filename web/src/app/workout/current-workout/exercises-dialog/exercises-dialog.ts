import { Component, computed, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CustomExerciseDialog } from './custom-exercise-dialog/custom-exercise-dialog';
import { ExerciseInfoService } from '../../../shared/exercise-info/exercise-info.service';
import { ExerciseCatalogService } from '../../exercise-catalog.service';
import { Exercise } from '../../../models/exercise.model';

// Full-screen picker: search the catalog, pick an exercise, or create a custom one.
// Closes with the chosen exercise, or nothing when cancelled.
@Component({
  selector: 'app-exercises-dialog',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatListModule],
  templateUrl: './exercises-dialog.html',
  styleUrl: './exercises-dialog.css',
})
export class ExercisesDialog {
  private catalog = inject(ExerciseCatalogService);
  private dialog = inject(MatDialog);
  private dialogRef = inject<MatDialogRef<ExercisesDialog, Exercise>>(MatDialogRef);
  private exerciseInfoService = inject(ExerciseInfoService);

  readonly search = signal('');
  readonly isLoading = this.catalog.exercises.isLoading;
  readonly loadFailed = computed(() => this.catalog.exercises.error() !== undefined);

  readonly filteredExercises = computed(() => {
    const term = this.search().trim().toLowerCase();
    const exercises = this.catalog.exercises.value();
    return term ? exercises.filter(e => e.name.toLowerCase().includes(term)) : exercises;
  });

  selectExercise(exercise: Exercise) {
    this.dialogRef.close(exercise);
  }

  createCustomExercise() {
    const ref = this.dialog.open<CustomExerciseDialog, undefined, Exercise>(CustomExerciseDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'exercise-info-dialog'
    });

    // A saved custom exercise goes straight into the workout.
    ref.afterClosed().subscribe(exercise => {
      if (exercise) this.dialogRef.close(exercise);
    });
  }

  retry() {
    this.catalog.exercises.reload();
  }

  close() {
    this.dialogRef.close();
  }

  openInfo(exercise: Exercise) {
    this.exerciseInfoService.open(exercise);
  }
}
