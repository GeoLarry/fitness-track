import { Component, signal } from '@angular/core';
import { ExerciseCard } from './exercise-card/exercise-card';
import { MaterialModule } from '../../material.module';
import { FormsModule } from '@angular/forms';
import { Timer } from "../../shared/timer/timer";
import { MatDialog } from '@angular/material/dialog';
import { ExercisesDialog } from './exercises-dialog/exercises-dialog';
import { Exercise } from '../../training/exercise.model';

@Component({
  selector: 'app-current-workout',
  imports: [MaterialModule, FormsModule, Timer, ExerciseCard],//DragDropModule
  templateUrl: './current-workout.html',
  styleUrl: './current-workout.css',
})
export class CurrentWorkout {

  exerciseCards = signal<ExerciseCard[]>([]);// ← this will hold chosen exercises  

  constructor(private dialog: MatDialog) { }

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

  deleteCard(card: ExerciseCard) {
    this.exerciseCards.update(cards => cards.filter(c => c !== card));
  }
}