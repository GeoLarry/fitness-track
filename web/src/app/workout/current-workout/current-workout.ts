import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Timer } from '../../shared/timer/timer';
import { ExerciseCard, ExerciseRow, newSet } from './exercise-card/exercise-card';
import { ExercisesDialog } from './exercises-dialog/exercises-dialog';
import { Exercise } from '../../models/exercise.model';
import { SaveWorkoutRequest, Workout, WorkoutExercise, WorkoutSet } from '../../models/workout.model';
import { WorkoutService } from '../workout.service';
import { ExerciseCatalogService } from '../exercise-catalog.service';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { apiErrorMessage } from '../../shared/http/api-error';

// A card in the workout. The key tells two cards of the same exercise apart.
interface WorkoutCard {
  key: number;
  exercise: Exercise;
  rows: ExerciseRow[];
}

// "live": the workout in progress, resumed if one is running. "plan": a plan, new or ?plan=<id>.
type Mode = 'live' | 'plan';

const pad = (n: number) => n.toString().padStart(2, '0');

// A live workout saves itself this long after the last change, and retries this long after a failure.
const autosaveDelay = 1000;
const autosaveRetryDelay = 10000;

@Component({
  selector: 'app-current-workout',
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule, Timer, ExerciseCard],
  templateUrl: './current-workout.html',
  styleUrl: './current-workout.css',
})
export class CurrentWorkout {
  private confirm = inject(ConfirmService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private workouts = inject(WorkoutService);
  private catalog = inject(ExerciseCatalogService);

  readonly mode: Mode;
  readonly exerciseCards = signal<WorkoutCard[]>([]);
  readonly name = signal('');
  // yyyy-mm-dd from the date field, or '' for no day.
  readonly plannedFor = signal('');
  readonly loading = signal(true);
  readonly busy = signal(false);

  private readonly workoutId = signal<number | null>(null);
  private readonly startedAt = signal<number | null>(null);
  private readonly now = signal(Date.now());
  private nextKey = 0;

  // Live: what the autosave is doing, shown under the time.
  readonly saveState = signal<'saved' | 'saving' | 'failed'>('saved');

  // What the last save or load held, to notice changes that still need saving.
  private savedRequest = '';
  // Set once the workout is finished or deleted: nothing may save over it, and leaving asks nothing.
  private closed = false;
  // One save at a time: each waits for the one before it and then sends the latest state.
  private saveQueue: Promise<unknown> = Promise.resolve();
  private autosaveTimer?: ReturnType<typeof setTimeout>;
  private saveError: unknown = null;

  // Time since the workout started: m:ss, with the hours in front once it passes an hour.
  readonly elapsed = computed(() => {
    const started = this.startedAt();
    if (started === null) return '';
    const seconds = Math.max(0, Math.floor((this.now() - started) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) % 60;
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds % 60)}` : `${minutes}:${pad(seconds % 60)}`;
  });

  constructor() {
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    const planId = Number(params.get('plan')) || null;
    this.mode = planId !== null || params.get('mode') === 'plan-workout' ? 'plan' : 'live';

    const clock = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(clock));

    if (this.mode === 'live') this.startAutosave();

    void this.load(planId);
  }

  openExercisesPopup() {
    const dialogRef = this.dialog.open<ExercisesDialog, undefined, Exercise>(ExercisesDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'full-screen-dialog'
    });

    // One card per pick; the same exercise can be added twice.
    dialogRef.afterClosed().subscribe(exercise => {
      if (exercise) this.exerciseCards.update(cards => [...cards, { key: this.nextKey++, exercise, rows: [newSet()] }]);
    });
  }

  // Live: deletes the workout in progress; a plan it came from stays. Plan: leaves without saving.
  async cancel() {
    const live = this.mode === 'live';
    const confirmed = await this.confirm.ask(live
      ? { title: 'Cancel this workout?', message: 'It will be deleted and will not appear in your history.', confirmLabel: 'Delete workout', cancelLabel: 'Keep training' }
      : { title: 'Leave without saving?', message: 'Changes since your last save will be lost.', confirmLabel: 'Leave' });
    if (!confirmed) return;

    this.closed = true;
    clearTimeout(this.autosaveTimer);
    const id = this.workoutId();
    if (live && id !== null) {
      this.busy.set(true);
      try {
        await this.saveQueue;
        await this.workouts.delete(id);
      } catch (error) {
        this.closed = false;
        this.autosaveIfChanged();
        this.showError(error);
        return;
      } finally {
        this.busy.set(false);
      }
    }

    await this.router.navigate(['/training']);
  }

  // Asked by the route guard. A live workout saves what is left, and one without exercises goes away.
  async canLeave(): Promise<boolean> {
    if (this.closed) return true;

    if (this.mode === 'live') {
      if (this.exerciseCards().length === 0) {
        await this.deleteEmptyWorkout();
        return true;
      }
      clearTimeout(this.autosaveTimer);
      if (await this.save()) return true;
    } else if (!this.hasChanges()) {
      return true;
    }

    return this.confirm.ask({ title: 'Leave without saving?', message: 'Changes since your last save will be lost.', confirmLabel: 'Leave' });
  }

  deleteCard(key: number) {
    this.exerciseCards.update(cards => cards.filter(c => c.key !== key));
  }

  updateRows(key: number, rows: ExerciseRow[]) {
    this.exerciseCards.update(cards => cards.map(c => c.key === key ? { ...c, rows } : c));
  }

  async onSave() {
    if (await this.saveNow()) this.snackBar.open('Saved', undefined, { duration: 2000 });
  }

  // Live: saves and completes the workout, then shows the history. Plan: saves it, then shows the plans.
  async done() {
    if (this.mode === 'live' && this.exerciseCards().length === 0) {
      this.snackBar.open('Add an exercise before finishing, or use X to cancel the workout.', 'OK', { duration: 5000 });
      return;
    }

    const confirmed = await this.confirm.ask(this.mode === 'live'
      ? { title: 'Finish this workout?', message: 'It will be saved and moved to your completed workouts.', confirmLabel: 'Finish' }
      : { title: 'Save this plan and close?', confirmLabel: 'Save' });
    if (!confirmed || !await this.saveNow()) return;

    this.closed = true;
    clearTimeout(this.autosaveTimer);
    if (this.mode === 'live') {
      try {
        this.busy.set(true);
        await this.saveQueue;
        await this.workouts.complete(this.workoutId()!);
      } catch (error) {
        this.closed = false;
        this.autosaveIfChanged();
        this.showError(error);
        return;
      } finally {
        this.busy.set(false);
      }
    }

    await this.router.navigate([this.mode === 'live' ? '/history' : '/training']);
  }

  private async load(planId: number | null) {
    try {
      if (planId !== null) {
        this.fill(await this.workouts.get(planId));
      } else if (this.mode === 'live') {
        const current = await this.workouts.getCurrent()
          ?? await this.workouts.create({ status: 'InProgress', name: null, notes: null, plannedForUtc: null, exercises: [] });
        this.fill(current);
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.savedRequest = JSON.stringify(this.request());
      this.loading.set(false);
    }
  }

  private fill(workout: Workout) {
    this.workoutId.set(workout.id);
    this.name.set(workout.name ?? '');
    this.plannedFor.set(workout.plannedForUtc?.slice(0, 10) ?? '');
    this.startedAt.set(workout.startedAtUtc ? Date.parse(workout.startedAtUtc) : null);
    this.exerciseCards.set(workout.exercises.map(e => ({
      key: this.nextKey++,
      exercise: this.exerciseFor(e),
      rows: e.sets.length > 0 ? e.sets.map(s => ({ warmup: s.isWarmup, weight: s.weightKg, reps: s.reps })) : [newSet()]
    })));
  }

  // The catalog entry when it has loaded; the name from the workout is enough for the card otherwise.
  private exerciseFor(e: WorkoutExercise): Exercise {
    return this.catalog.exercises.value().find(x => x.id === e.exerciseId) ?? {
      id: e.exerciseId, name: e.exerciseName, description: null, instructions: null, typeId: null, equipmentId: null,
      primaryMuscleIds: [], secondaryMuscleIds: [], isCustom: false,
    };
  }

  // Saves on every change, and straight away when the page goes to the background or is closed.
  private startAutosave() {
    effect(() => {
      if (!this.loading()) this.autosaveIfChanged();
    });

    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') this.saveChangesNow();
    };
    const saveChanges = () => this.saveChangesNow();
    document.addEventListener('visibilitychange', saveWhenHidden);
    window.addEventListener('pagehide', saveChanges);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.autosaveTimer);
      document.removeEventListener('visibilitychange', saveWhenHidden);
      window.removeEventListener('pagehide', saveChanges);
    });
  }

  private autosaveIfChanged() {
    if (this.closed || !this.hasChanges()) return;
    this.saveState.set('saving');
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => this.saveChangesNow(), autosaveDelay);
  }

  private saveChangesNow() {
    clearTimeout(this.autosaveTimer);
    void this.save();
  }

  private hasChanges(): boolean {
    return JSON.stringify(this.request()) !== this.savedRequest;
  }

  // What the save button and Done do: always writes, and says so when it fails.
  private async saveNow(): Promise<boolean> {
    clearTimeout(this.autosaveTimer);
    this.busy.set(true);
    const saved = await this.save(true);
    this.busy.set(false);
    if (!saved) this.showError(this.saveError);
    return saved;
  }

  private save(always = false): Promise<boolean> {
    const saved = this.saveQueue.then(() => this.write(always));
    this.saveQueue = saved;
    return saved;
  }

  // Sends the state as it is now. A new plan is created on its first save; everything else is updated in place.
  private async write(always: boolean): Promise<boolean> {
    if (this.closed || (!always && !this.hasChanges())) return true;

    const id = this.workoutId();
    // A live workout that could not load has nothing to save into yet.
    if (id === null && this.mode === 'live' && !always) return false;

    const request = this.request();
    this.saveState.set('saving');
    try {
      if (id === null) {
        const created = await this.workouts.create({ status: 'Planned', ...request });
        this.workoutId.set(created.id);
      } else {
        await this.workouts.save(id, request);
      }
      this.savedRequest = JSON.stringify(request);
      this.saveState.set(this.hasChanges() ? 'saving' : 'saved');
      return true;
    } catch (error) {
      this.saveError = error;
      this.saveState.set('failed');
      if (this.mode === 'live' && !this.closed) {
        clearTimeout(this.autosaveTimer);
        this.autosaveTimer = setTimeout(() => this.saveChangesNow(), autosaveRetryDelay);
      }
      return false;
    }
  }

  // Best effort: the user is leaving anyway, and an empty workout can still be resumed or cancelled later.
  private async deleteEmptyWorkout() {
    this.closed = true;
    clearTimeout(this.autosaveTimer);
    const id = this.workoutId();
    if (id === null) return;
    try {
      await this.saveQueue;
      await this.workouts.delete(id);
    } catch {
      // Nothing to lose.
    }
  }

  private request(): SaveWorkoutRequest {
    const whole = (value: number) => Math.max(0, Number(value) || 0);
    return {
      name: this.name().trim() || null,
      notes: null,
      plannedForUtc: this.mode === 'plan' && this.plannedFor() ? `${this.plannedFor()}T00:00:00Z` : null,
      durationSeconds: null,
      exercises: this.exerciseCards().map(card => ({
        exerciseId: card.exercise.id,
        notes: null,
        sets: card.rows.map((row): WorkoutSet => ({
          isWarmup: row.warmup,
          weightKg: whole(row.weight),
          reps: Math.floor(whole(row.reps)),
          // There is no "done" tick yet: a live set with reps counts as done.
          isDone: this.mode === 'live' && whole(row.reps) > 0,
        })),
      })),
    };
  }

  private showError(error: unknown) {
    this.snackBar.open(apiErrorMessage(error), 'OK', { duration: 5000 });
  }
}
