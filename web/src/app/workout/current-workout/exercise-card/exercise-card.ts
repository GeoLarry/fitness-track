import { Component, inject, input, model, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { Exercise } from '../../../models/exercise.model';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';

// One warm-up or working set. Weight and reps are edited in place.
export interface ExerciseRow {
  warmup: boolean;
  weight: number;
  reps: number;
}

type EditableField = 'weight' | 'reps';

export const newSet = (): ExerciseRow => ({ warmup: false, weight: 0, reps: 0 });

// Warm-ups always come first, whatever order rows were added in.
export const warmupsFirst = (rows: ExerciseRow[]) => [...rows.filter(r => r.warmup), ...rows.filter(r => !r.warmup)];

// One exercise in the current workout: its warm-ups and sets.
@Component({
  selector: 'app-exercise-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatTableModule, FormsModule],
  templateUrl: './exercise-card.html',
  styleUrl: './exercise-card.css',
})
export class ExerciseCard {
  private confirm = inject(ConfirmService);

  readonly exercise = input.required<Exercise>();
  readonly remove = output<void>();

  readonly displayedColumns = ['counter', 'weight', 'reps', 'actions'];

  // Two-way: the workout passes saved sets in and hears about every change.
  readonly rows = model<ExerciseRow[]>([newSet()]);
  readonly currentRow = signal<ExerciseRow | null>(null);
  private readonly editing = signal<{ row: ExerciseRow; field: EditableField } | null>(null);

  addWarmup() {
    this.rows.update(rows => warmupsFirst([...rows, { warmup: true, weight: 0, reps: 0 }]));
  }

  addSet() {
    this.rows.update(rows => [...rows, newSet()]);
  }

  async deleteRow(row: ExerciseRow | null) {
    if (!row || !await this.confirm.ask({ title: row.warmup ? 'Delete this warm-up?' : 'Delete this set?', confirmLabel: 'Delete' })) return;
    this.rows.update(rows => rows.filter(r => r !== row));
  }

  isEditing(row: ExerciseRow, field: EditableField): boolean {
    const editing = this.editing();
    return editing?.row === row && editing.field === field;
  }

  edit(row: ExerciseRow, field: EditableField) {
    this.editing.set({ row, field });
  }

  // Weight and reps are edited on the row itself; a new array tells the workout they changed.
  stopEdit() {
    this.editing.set(null);
    this.rows.update(rows => [...rows]);
  }

  async clearCard() {
    const confirmed = await this.confirm.ask({
      title: `Clear ${this.exercise().name}?`, message: 'All its sets go back to a single empty set.', confirmLabel: 'Clear',
    });
    if (confirmed) this.rows.set([newSet()]);
  }

  async deleteCard() {
    const confirmed = await this.confirm.ask({
      title: `Delete ${this.exercise().name}?`, message: 'The exercise and its sets leave this workout.', confirmLabel: 'Delete',
    });
    if (confirmed) this.remove.emit();
  }

  // Set number counting working sets only, e.g. warm-up, warm-up, 1, 2.
  getSetNumber(index: number): number {
    const rows = this.rows();
    return rows.filter(r => !r.warmup).indexOf(rows[index]) + 1;
  }

  // Warm-ups stay above the sets, so a row only swaps with a neighbour of its own kind.
  canMove(index: number, step: -1 | 1): boolean {
    const rows = this.rows();
    const neighbour = rows[index + step];
    return !!neighbour && neighbour.warmup === rows[index]?.warmup;
  }

  moveRow(index: number, step: -1 | 1) {
    if (!this.canMove(index, step)) return;
    this.rows.update(rows => {
      const moved = [...rows];
      [moved[index], moved[index + step]] = [moved[index + step], moved[index]];
      return moved;
    });
  }
}
