import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { ExerciseCard } from './exercise-card/exercise-card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Timer } from "../../shared/timer/timer";
import { MatDialog } from '@angular/material/dialog';
import { ExercisesDialog } from './exercises-dialog/exercises-dialog';
import { Exercise } from '../../models/exercise.model';

// A card in the workout. The key tells two cards of the same exercise apart.
interface WorkoutCard {
  key: number;
  exercise: Exercise;
}

@Component({
  selector: 'app-current-workout',
  imports: [MatButtonModule, MatIconModule, Timer, ExerciseCard],
  templateUrl: './current-workout.html',
  styleUrl: './current-workout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentWorkout {
  private dialog = inject(MatDialog);

  readonly exerciseCards = signal<WorkoutCard[]>([]);
  private nextKey = 0;

  openExercisesPopup() {
    const dialogRef = this.dialog.open<ExercisesDialog, undefined, Exercise>(ExercisesDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'full-screen-dialog'
    });

    // One card per pick; the same exercise can be added twice.
    dialogRef.afterClosed().subscribe(exercise => {
      if (exercise) this.exerciseCards.update(cards => [...cards, { key: this.nextKey++, exercise }]);
    });
  }

  clearWorkout() {
    this.exerciseCards.set([]);
  }

  deleteCard(key: number) {
    this.exerciseCards.update(cards => cards.filter(c => c.key !== key));
  }
}