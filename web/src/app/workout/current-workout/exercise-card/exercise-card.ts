import { Component, ElementRef, Injector, afterNextRender, inject, input, model, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { Exercise } from '../../../models/exercise.model';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import { ExerciseInfoService } from '../../../shared/exercise-info/exercise-info.service';
import { SwipeActions } from '../../../shared/swipe-actions/swipe-actions';
import { ExerciseCatalogService } from '../../exercise-catalog.service';

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

const moveDuration = 220;
const moveEasing = 'cubic-bezier(0.2, 0, 0, 1)';

// One exercise in the current workout: its warm-ups and sets.
@Component({
  selector: 'app-exercise-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatTableModule, FormsModule, SwipeActions],
  templateUrl: './exercise-card.html',
  styleUrl: './exercise-card.css',
})
export class ExerciseCard {
  private catalog = inject(ExerciseCatalogService);
  private confirm = inject(ConfirmService);
  private exerciseInfo = inject(ExerciseInfoService);
  private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private injector = inject(Injector);

  readonly exercise = input.required<Exercise>();
  readonly remove = output<void>();

  readonly displayedColumns = ['counter', 'weight', 'reps', 'actions'];

  // Two-way: the workout passes saved sets in and hears about every change.
  readonly rows = model<ExerciseRow[]>([newSet()]);
  readonly currentRow = signal<ExerciseRow | null>(null);
  private readonly editing = signal<{ row: ExerciseRow; field: EditableField } | null>(null);

  // A workout that resumed before the catalog loaded only has the exercise's name, so look it up now.
  showInfo() {
    const exercise = this.exercise();
    this.exerciseInfo.open(this.catalog.exercises.value().find(e => e.id === exercise.id) ?? exercise);
  }

  addWarmup() {
    this.rows.update(rows => warmupsFirst([...rows, { warmup: true, weight: 0, reps: 0 }]));
  }

  addSet() {
    this.rows.update(rows => [...rows, newSet()]);
  }

  // A swiped row goes back to its place unless it was really deleted.
  async deleteRow(row: ExerciseRow | null, swipe?: SwipeActions) {
    if (!row || !await this.confirm.ask({ title: row.warmup ? 'Delete this warm-up?' : 'Delete this set?', confirmLabel: 'Delete' })) {
      swipe?.reset();
      return;
    }
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
  setValue(row: ExerciseRow, field: EditableField, value: number) {
    row[field] = value;
    this.rows.update(rows => [...rows]);
  }

  stopEdit() {
    this.editing.set(null);
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

    const rowElements = this.element.querySelectorAll<HTMLElement>('tr[mat-row]');
    const tapped = rowElements[index];
    const neighbour = rowElements[index + step];
    const tappedTop = tapped?.getBoundingClientRect().top;
    const neighbourTop = neighbour?.getBoundingClientRect().top;

    this.rows.update(rows => {
      const moved = [...rows];
      [moved[index], moved[index + step]] = [moved[index + step], moved[index]];
      return moved;
    });

    if (!tapped || !neighbour || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    afterNextRender(() => {
      this.slideFrom(neighbour, neighbourTop, false);
      this.slideFrom(tapped, tappedTop, true);
    }, { injector: this.injector });
  }

  // Plays a row's jump from its old position to its new one. The tapped row passes over the other.
  private slideFrom(row: HTMLElement, oldTop: number, lifted: boolean) {
    const from = `translateY(${oldTop - row.getBoundingClientRect().top}px)`;
    const raised = lifted ? { zIndex: 1, backgroundColor: 'var(--mat-sys-surface-container-highest)' } : {};
    row.animate?.([
      { transform: from, ...raised },
      { transform: 'none', ...raised, offset: 0.8 },
      { transform: 'none', ...(lifted ? { zIndex: 1, backgroundColor: 'transparent' } : {}) },
    ], { duration: moveDuration, easing: moveEasing });
  }
}
