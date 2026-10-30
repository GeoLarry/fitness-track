import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
//import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export interface ExerciseRow {
  warmup: boolean;
  weight: number;
  reps: number;
  editWeight?: boolean;
  editReps?: boolean;
}

@Component({
  selector: 'app-exercise-card',
  imports: [MaterialModule, FormsModule],
  templateUrl: './exercise-card.html',
  styleUrl: './exercise-card.css',
})
export class ExerciseCard {

  @Input() exercise: any;     // incoming exercise data
  @Output() remove = new EventEmitter<void>();

  displayedColumns = ['counter', 'weight', 'reps', 'actions'];

  rows: ExerciseRow[] = [{ warmup: false, weight: 0, reps: 0 }];
  currentRow: ExerciseRow | null = null;
  dataSource = new MatTableDataSource(this.rows);

  constructor() { }

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

  // ---- SWIPE HANDLING ----
  private touchX = 0;
  swipedRow: ExerciseRow | null = null;

  touchStart(event: TouchEvent, row: ExerciseRow) {
    // this.touchX = event.touches[0].clientX;
    // this.swipedRow = row;
  }

  touchMove(event: TouchEvent) {
    // const deltaX = event.touches[0].clientX - this.touchX;

    // if (Math.abs(deltaX) > 100 && this.swipedRow) {
    //   this.deleteRow(this.swipedRow);
    //   this.swipedRow = null;
    // }
  }

  touchEnd() {
    this.swipedRow = null;
  }

  // ---- DRAG DROP SORTING ----
  dropRow(event: any) {
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
