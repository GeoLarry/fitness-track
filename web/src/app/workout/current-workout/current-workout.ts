import { Component, signal, inject } from '@angular/core';
import { ExerciseCard } from './exercise-card/exercise-card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Timer } from "../../shared/timer/timer";
import { MatDialog } from '@angular/material/dialog';
import { ExercisesDialog } from './exercises-dialog/exercises-dialog';
import { Exercise } from '../exercise.model';

@Component({
  selector: 'app-current-workout',
  imports: [MatButtonModule, MatIconModule, FormsModule, Timer, ExerciseCard],
  templateUrl: './current-workout.html',
  styleUrl: './current-workout.css',
})
export class CurrentWorkout {
  private dialog = inject(MatDialog);

  exerciseCards = signal<Exercise[]>([]);

  /** Open exercises dialog */
  openExercisesPopup() {
    const dialogRef = this.dialog.open(ExercisesDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'full-screen-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      // Add the selected exercise to the mat-cards list
      this.exerciseCards.update(cards => [...cards, result])
    });
  }

  deleteCard(card: Exercise) {
    this.exerciseCards.update(cards => cards.filter(c => c !== card));
  }
}