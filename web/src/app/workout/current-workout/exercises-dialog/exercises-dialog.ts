import { Component, inject } from '@angular/core';
import { Exercise } from '../../exercise.model';
import { TrainingService } from '../../training.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { CustomExerciseDialog } from './custom-exercise-dialog/custom-exercise-dialog';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, shareReplay, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ExerciseInfoService } from '../../../shared/exercise-info/exercise-info.service';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-exercises-dialog',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatListModule, AsyncPipe],
  templateUrl: './exercises-dialog.html',
  styleUrl: './exercises-dialog.css',
})
export class ExercisesDialog {
  private trainingService = inject(TrainingService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject<MatDialogRef<ExercisesDialog>>(MatDialogRef);
  private exerciseInfoService = inject(ExerciseInfoService);
  data = inject(MAT_DIALOG_DATA);

  exercises$!: Observable<Exercise[]>;
  loading$!: Observable<boolean>;

  private searchTerm$ = new BehaviorSubject<string>('');
  filteredExercises$!: Observable<Exercise[]>;

  constructor() {
    this.exercises$ = this.trainingService.exercises$.pipe(map(
      exercises => [...exercises].sort((a, b) => a.name.localeCompare(b.name))
    ));
    this.loading$ = this.trainingService.loadingState$
      .pipe(
        startWith(true),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true })
      );

    // Combine search term with exercises
    this.filteredExercises$ = combineLatest([this.exercises$, this.searchTerm$]).pipe(
      map(([exercises, search]) =>
        exercises
          .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    );

    this.trainingService.fetchExercises();
  }

  setSearch(value: string) {
    this.searchTerm$.next(value);
  }

  selectExercise(exercise: Exercise) {
    this.dialogRef.close(exercise); // 👈 return selected exercise
  }

  createCustomExercise() {
    const ref = this.dialog.open(CustomExerciseDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'exercise-info-dialog'
    });

    ref.afterClosed().subscribe((exercise) => {
      if (exercise) {
        // return it to parent (CurrentWorkout)
        this.dialogRef.close(exercise);
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  openInfo(exercise: Exercise, event: MouseEvent) {
    event.stopPropagation();
    this.exerciseInfoService.open(exercise);
  }
}
