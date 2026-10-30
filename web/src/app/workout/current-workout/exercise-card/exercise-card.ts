import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Exercise } from '../../exercise.model';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

export interface ExerciseRow {
  warmup: boolean;
  weight: number;
  reps: number;
  editWeight?: boolean;
  editReps?: boolean;
}

@Component({
  selector: 'app-exercise-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatTableModule, CdkDropList, CdkDrag, CdkDragHandle, FormsModule],
  templateUrl: './exercise-card.html',
  styleUrl: './exercise-card.css',
})
export class ExerciseCard {

  @Input() exercise!: Exercise;
  @Output() remove = new EventEmitter<void>();

  displayedColumns = ['counter', 'weight', 'reps', 'actions'];

  rows: ExerciseRow[] = [{ warmup: false, weight: 0, reps: 0 }];
  currentRow: ExerciseRow | null = null;
  dataSource = new MatTableDataSource(this.rows);

  /** ------- Add Warm-up (always placed above sets) ------- */
  addWarmup() {
    const warmup: ExerciseRow = { warmup: true, weight: 0, reps: 0 };
    const sets = this.rows.filter(r => !r.warmup);
    const warmups = this.rows.filter(r => r.warmup);

    this.rows = [...warmups, warmup, ...sets];
    this.refresh();
  }

  /** ------- Add Set (always below warm-up rows) ------- */
  addSet() {
    const newSet: ExerciseRow = { warmup: false, weight: 0, reps: 0 };
    this.rows.push(newSet);
    this.refresh();
  }

  deleteRow(row: ExerciseRow) {
    this.rows = this.rows.filter(r => r !== row);
    this.refresh();
  }

  edit(row: ExerciseRow, field: 'weight' | 'reps') {
    if (field === 'weight') row.editWeight = true;
    if (field === 'reps') row.editReps = true;
  }

  stopEdit(row: ExerciseRow, field: 'weight' | 'reps') {
    if (field === 'weight') row.editWeight = false;
    if (field === 'reps') row.editReps = false;
    this.refresh();
  }

  setCurrentRow(row: ExerciseRow) {
    this.currentRow = row;
  }
  refresh() {
    this.dataSource.data = [...this.rows];
  }

  clearCard() {
    this.rows = [{ warmup: false, weight: 0, reps: 0 }];
    this.refresh();
  }
  deleteCard() {
    this.remove.emit();
  }

  /** Display set number excluding warm-ups */
  getSetNumber(i: number): number {
    return this.rows.filter(r => !r.warmup).indexOf(this.rows[i]) + 1;
  }

  // ---- DRAG DROP SORTING ----
  dropRow(event: CdkDragDrop<ExerciseRow[]>) {
    moveItemInArray(this.rows, event.previousIndex, event.currentIndex);

    // Ensure warmups ALWAYS stay above sets
    const warmups = this.rows.filter(r => r.warmup);
    const sets = this.rows.filter(r => !r.warmup);
    this.rows = [...warmups, ...sets];

    this.refresh();
  }

  onDragStart() {
    // Android + some desktop devices
    if (navigator.vibrate) {
      navigator.vibrate(10); // small buzz
    }
  }
}
