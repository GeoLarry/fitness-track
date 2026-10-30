import { Component, Inject } from '@angular/core';
import { Exercise } from '../../../training/exercise.model';
import { TrainingService } from '../../../training/training.service';
import { MaterialModule } from '../../../material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { CustomExerciseDialog } from './custom-exercise-dialog/custom-exercise-dialog';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, shareReplay, startWith, take, takeUntil } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ExerciseInfoService } from '../../../shared/exercise-info/exercise-info.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-exercises-dialog',
  imports: [MaterialModule, AsyncPipe],
  templateUrl: './exercises-dialog.html',
  styleUrl: './exercises-dialog.css',
})
export class ExercisesDialog {

  exercises$!: Observable<Exercise[]>;
  loading$!: Observable<boolean>;

  private searchTerm$ = new BehaviorSubject<string>('');
  filteredExercises$!: Observable<Exercise[]>;

  constructor(
    private trainingService: TrainingService,
    private dialog: MatDialog,
    private destroyRef: DestroyRef,
    private dialogRef: MatDialogRef<ExercisesDialog>,
    private exerciseInfoService: ExerciseInfoService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
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
