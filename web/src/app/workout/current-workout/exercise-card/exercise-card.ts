import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Exercise } from '../../../models/exercise.model';

// One warm-up or working set. Weight and reps are edited in place.
export interface ExerciseRow {
  warmup: boolean;
  weight: number;
  reps: number;
}

type EditableField = 'weight' | 'reps';

const newSet = (): ExerciseRow => ({ warmup: false, weight: 0, reps: 0 });

// Warm-ups always come first, whatever order rows were added or dragged in.
const warmupsFirst = (rows: ExerciseRow[]) => [...rows.filter(r => r.warmup), ...rows.filter(r => !r.warmup)];

// One exercise in the current workout: its warm-ups and sets.
@Component({
  selector: 'app-exercise-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatTableModule, CdkDropList, CdkDrag, CdkDragHandle, FormsModule],
  templateUrl: './exercise-card.html',
  styleUrl: './exercise-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseCard {
  readonly exercise = input.required<Exercise>();
  readonly remove = output<void>();

  readonly displayedColumns = ['counter', 'weight', 'reps', 'actions'];

  readonly rows = signal<ExerciseRow[]>([newSet()]);
  readonly currentRow = signal<ExerciseRow | null>(null);
  private readonly editing = signal<{ row: ExerciseRow; field: EditableField } | null>(null);

  addWarmup() {
    this.rows.update(rows => warmupsFirst([...rows, { warmup: true, weight: 0, reps: 0 }]));
  }

  addSet() {
    this.rows.update(rows => [...rows, newSet()]);
  }

  deleteRow(row: ExerciseRow | null) {
    this.rows.update(rows => rows.filter(r => r !== row));
  }

  isEditing(row: ExerciseRow, field: EditableField): boolean {
    const editing = this.editing();
    return editing?.row === row && editing.field === field;
  }

  edit(row: ExerciseRow, field: EditableField) {
    this.editing.set({ row, field });
  }

  stopEdit() {
    this.editing.set(null);
  }

  clearCard() {
    this.rows.set([newSet()]);
  }

  deleteCard() {
    this.remove.emit();
  }

  // Set number counting working sets only, e.g. warm-up, warm-up, 1, 2.
  getSetNumber(index: number): number {
    const rows = this.rows();
    return rows.filter(r => !r.warmup).indexOf(rows[index]) + 1;
  }

  dropRow(event: CdkDragDrop<ExerciseRow[]>) {
    this.rows.update(rows => {
      const moved = [...rows];
      moveItemInArray(moved, event.previousIndex, event.currentIndex);
      return warmupsFirst(moved);
    });
  }

  onDragStart() {
    // A short buzz on devices that support it (Android, some desktops).
    navigator.vibrate?.(10);
  }
}
