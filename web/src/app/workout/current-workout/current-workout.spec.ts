import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrentWorkout } from './current-workout';
import { WorkoutService } from '../workout.service';
import { ExerciseCatalogService } from '../exercise-catalog.service';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { MockOf } from '../../shared/testing/mock-of';
import { Workout } from '../../models/workout.model';

describe('CurrentWorkout', () => {
  let fixture: ComponentFixture<CurrentWorkout>;
  let component: CurrentWorkout;
  let workouts: MockOf<WorkoutService, 'getCurrent' | 'get' | 'create' | 'save' | 'complete' | 'delete'>;
  let ask: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const workout = (overrides: Partial<Workout>): Workout => ({
    id: 5, name: null, notes: null, status: 'InProgress', plannedForUtc: null, startedAtUtc: '2026-11-01T10:00:00Z',
    completedAtUtc: null, durationSeconds: null, sourcePlanId: null, updatedAtUtc: '2026-11-01T10:00:00Z', exercises: [],
    ...overrides,
  });
  const benchPress = {
    exerciseId: 40, exerciseName: 'Bench Press', notes: null,
    sets: [{ isWarmup: true, weightKg: 40, reps: 10, isDone: true }, { isWarmup: false, weightKg: 70, reps: 8, isDone: false }],
  };

  async function setUp(params: Record<string, string>) {
    await TestBed.configureTestingModule({
      imports: [CurrentWorkout],
      providers: [
        provideRouter([]),
        { provide: WorkoutService, useValue: workouts },
        { provide: ConfirmService, useValue: { ask } },
        { provide: ExerciseCatalogService, useValue: { exercises: { value: () => [] } } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(params) } } },
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(CurrentWorkout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(() => {
    workouts = { getCurrent: vi.fn(), get: vi.fn(), create: vi.fn(), save: vi.fn(), complete: vi.fn(), delete: vi.fn() };
    ask = vi.fn().mockResolvedValue(true);
  });

  it('resumes the workout in progress with its sets', async () => {
    workouts.getCurrent.mockResolvedValue(workout({ name: 'Push day', exercises: [benchPress] }));

    await setUp({ mode: 'start-workout' });

    expect(workouts.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Bench Press');
    expect(fixture.nativeElement.textContent).toContain('Push day');
    expect(component.exerciseCards()[0].rows).toEqual([
      { warmup: true, weight: 40, reps: 10 },
      { warmup: false, weight: 70, reps: 8 },
    ]);
  });

  it('starts a new workout when none is in progress', async () => {
    workouts.getCurrent.mockResolvedValue(null);
    workouts.create.mockResolvedValue(workout({}));

    await setUp({ mode: 'start-workout' });

    expect(workouts.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'InProgress', exercises: [] }));
  });

  it('saves, completes and shows the history on Done', async () => {
    workouts.getCurrent.mockResolvedValue(workout({ exercises: [benchPress] }));
    workouts.save.mockResolvedValue(workout({}));
    workouts.complete.mockResolvedValue(workout({ status: 'Completed' }));
    await setUp({ mode: 'start-workout' });

    await component.done();

    expect(workouts.save).toHaveBeenCalledWith(5, expect.objectContaining({
      exercises: [{
        exerciseId: 40, notes: null,
        sets: [{ isWarmup: true, weightKg: 40, reps: 10, isDone: true }, { isWarmup: false, weightKg: 70, reps: 8, isDone: true }],
      }],
    }));
    expect(workouts.complete).toHaveBeenCalledWith(5);
    expect(navigate).toHaveBeenCalledWith(['/history']);
  });

  it('does not finish a workout without exercises and says why', async () => {
    workouts.getCurrent.mockResolvedValue(workout({}));
    await setUp({ mode: 'start-workout' });
    const snackBar = vi.spyOn(TestBed.inject(MatSnackBar), 'open');

    await component.done();

    expect(snackBar).toHaveBeenCalledWith(expect.stringContaining('Add an exercise'), 'OK', expect.anything());
    expect(ask).not.toHaveBeenCalled();
    expect(workouts.save).not.toHaveBeenCalled();
    expect(workouts.complete).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does nothing on Done when the user says no', async () => {
    workouts.getCurrent.mockResolvedValue(workout({ exercises: [benchPress] }));
    await setUp({ mode: 'start-workout' });
    ask.mockResolvedValue(false);

    await component.done();

    expect(workouts.save).not.toHaveBeenCalled();
    expect(workouts.complete).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('deletes the workout in progress and leaves on cancel', async () => {
    workouts.getCurrent.mockResolvedValue(workout({ exercises: [benchPress] }));
    workouts.delete.mockResolvedValue();
    await setUp({ mode: 'start-workout' });

    await component.cancel();

    expect(workouts.delete).toHaveBeenCalledWith(5);
    expect(workouts.complete).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/training']);
  });

  it('keeps the workout when the user says no to cancelling', async () => {
    workouts.getCurrent.mockResolvedValue(workout({ exercises: [benchPress] }));
    await setUp({ mode: 'start-workout' });
    ask.mockResolvedValue(false);

    await component.cancel();

    expect(workouts.delete).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.exerciseCards().length).toBe(1);
  });

  it('stays on the page when cancelling fails', async () => {
    workouts.getCurrent.mockResolvedValue(workout({}));
    workouts.delete.mockRejectedValue(new Error('offline'));
    await setUp({ mode: 'start-workout' });

    await component.cancel();

    expect(navigate).not.toHaveBeenCalled();
    expect(component.busy()).toBe(false);
  });

  it('leaves a plan without deleting or saving it on cancel', async () => {
    workouts.get.mockResolvedValue(workout({ id: 3, status: 'Planned', startedAtUtc: null }));
    await setUp({ plan: '3' });

    await component.cancel();

    expect(workouts.delete).not.toHaveBeenCalled();
    expect(workouts.save).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/training']);
  });

  it('stays on the page when saving fails', async () => {
    workouts.getCurrent.mockResolvedValue(workout({ exercises: [benchPress] }));
    workouts.save.mockRejectedValue(new Error('offline'));
    await setUp({ mode: 'start-workout' });

    await component.done();

    expect(workouts.complete).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('creates a new plan on its first save, then updates it', async () => {
    workouts.create.mockResolvedValue(workout({ id: 8, status: 'Planned' }));
    workouts.save.mockResolvedValue(workout({ id: 8, status: 'Planned' }));
    await setUp({ mode: 'plan-workout' });
    component.name.set(' Leg day ');
    component.plannedFor.set('2026-11-03');

    await component.onSave();
    await component.done();

    expect(workouts.getCurrent).not.toHaveBeenCalled();
    expect(workouts.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'Planned', name: 'Leg day', plannedForUtc: '2026-11-03T00:00:00Z',
    }));
    expect(workouts.save).toHaveBeenCalledWith(8, expect.objectContaining({ name: 'Leg day' }));
    expect(workouts.complete).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/training']);
  });

  describe('autosave', () => {
    const changeReps = (reps: number) => {
      component.updateRows(component.exerciseCards()[0].key, [{ warmup: false, weight: 80, reps }]);
      TestBed.tick();
    };
    const savedReps = (call: number) => workouts.save.mock.calls[call][1].exercises[0].sets[0].reps;

    async function setUpLive() {
      workouts.getCurrent.mockResolvedValue(workout({ exercises: [benchPress] }));
      workouts.save.mockResolvedValue(workout({}));
      await setUp({ mode: 'start-workout' });
      vi.useFakeTimers();
      TestBed.tick();
    }

    afterEach(() => vi.useRealTimers());

    it('saves nothing when nothing changed', async () => {
      await setUpLive();

      await vi.advanceTimersByTimeAsync(5000);

      expect(workouts.save).not.toHaveBeenCalled();
    });

    it('saves once, a second after the last of several changes', async () => {
      await setUpLive();

      changeReps(1);
      await vi.advanceTimersByTimeAsync(500);
      changeReps(2);
      await vi.advanceTimersByTimeAsync(999);
      expect(workouts.save).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(workouts.save).toHaveBeenCalledTimes(1);
      expect(savedReps(0)).toBe(2);
      expect(component.saveState()).toBe('saved');
    });

    it('waits for a running save, then sends the newer state', async () => {
      await setUpLive();
      let finishFirst!: (value: Workout) => void;
      workouts.save.mockReturnValueOnce(new Promise<Workout>(resolve => finishFirst = resolve));

      changeReps(1);
      await vi.advanceTimersByTimeAsync(1000);
      changeReps(2);
      await vi.advanceTimersByTimeAsync(1000);
      expect(workouts.save).toHaveBeenCalledTimes(1);

      finishFirst(workout({}));
      await vi.advanceTimersByTimeAsync(0);

      expect(workouts.save).toHaveBeenCalledTimes(2);
      expect(savedReps(1)).toBe(2);
    });

    it('says when a save failed and tries again', async () => {
      await setUpLive();
      workouts.save.mockRejectedValueOnce(new Error('offline'));

      changeReps(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(component.saveState()).toBe('failed');

      await vi.advanceTimersByTimeAsync(10000);
      expect(workouts.save).toHaveBeenCalledTimes(2);
      expect(component.saveState()).toBe('saved');
    });

    it('saves straight away when the page is closed', async () => {
      await setUpLive();

      changeReps(1);
      window.dispatchEvent(new Event('pagehide'));
      await vi.advanceTimersByTimeAsync(0);

      expect(workouts.save).toHaveBeenCalledTimes(1);
    });

    it('finishes after the save that is running', async () => {
      await setUpLive();
      workouts.complete.mockResolvedValue(workout({ status: 'Completed' }));
      let finishSave!: (value: Workout) => void;
      workouts.save.mockReturnValueOnce(new Promise<Workout>(resolve => finishSave = resolve));

      changeReps(1);
      await vi.advanceTimersByTimeAsync(1000);
      const done = component.done();
      await vi.advanceTimersByTimeAsync(0);
      expect(workouts.complete).not.toHaveBeenCalled();

      finishSave(workout({}));
      await vi.advanceTimersByTimeAsync(0);
      await done;

      expect(workouts.complete).toHaveBeenCalledTimes(1);
    });

    it('does not save over a cancelled workout', async () => {
      await setUpLive();
      workouts.delete.mockResolvedValue(undefined);

      changeReps(1);
      await component.cancel();
      await vi.advanceTimersByTimeAsync(5000);

      expect(workouts.delete).toHaveBeenCalledWith(5);
      expect(workouts.save).not.toHaveBeenCalled();
    });

    it('does not autosave a plan', async () => {
      workouts.get.mockResolvedValue(workout({ status: 'Planned', exercises: [benchPress] }));
      await setUp({ plan: '5' });
      vi.useFakeTimers();

      changeReps(1);
      await vi.advanceTimersByTimeAsync(5000);

      expect(workouts.save).not.toHaveBeenCalled();
    });
  });

  describe('leaving', () => {
    const live = async (exercises = [benchPress]) => {
      workouts.getCurrent.mockResolvedValue(workout({ exercises }));
      await setUp({ mode: 'start-workout' });
      ask.mockClear();
    };
    const change = () => component.updateRows(component.exerciseCards()[0].key, [{ warmup: false, weight: 80, reps: 8 }]);

    it('saves a live workout and leaves without asking', async () => {
      await live();
      workouts.save.mockResolvedValue(workout({}));
      change();

      expect(await component.canLeave()).toBe(true);
      expect(workouts.save).toHaveBeenCalledTimes(1);
      expect(ask).not.toHaveBeenCalled();
    });

    it('asks when the save fails, and stays if the user says no', async () => {
      await live();
      workouts.save.mockRejectedValue(new Error('offline'));
      ask.mockResolvedValue(false);
      change();

      expect(await component.canLeave()).toBe(false);
      expect(ask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Leave without saving?' }));
    });

    it('deletes a live workout without exercises', async () => {
      await live([]);
      workouts.delete.mockResolvedValue(undefined);

      expect(await component.canLeave()).toBe(true);
      expect(workouts.delete).toHaveBeenCalledWith(5);
      expect(ask).not.toHaveBeenCalled();
    });

    it('leaves even if deleting the empty workout fails', async () => {
      await live([]);
      workouts.delete.mockRejectedValue(new Error('offline'));

      expect(await component.canLeave()).toBe(true);
    });

    it('does not ask again after cancelling', async () => {
      await live();
      workouts.delete.mockResolvedValue(undefined);
      await component.cancel();
      ask.mockClear();

      expect(await component.canLeave()).toBe(true);
      expect(ask).not.toHaveBeenCalled();
    });

    it('asks before losing changes to a plan', async () => {
      workouts.get.mockResolvedValue(workout({ status: 'Planned', exercises: [benchPress] }));
      await setUp({ plan: '5' });
      ask.mockClear();
      ask.mockResolvedValue(false);

      expect(await component.canLeave()).toBe(true);
      expect(ask).not.toHaveBeenCalled();

      change();
      expect(await component.canLeave()).toBe(false);
      expect(workouts.save).not.toHaveBeenCalled();
    });
  });

  describe('elapsed time', () => {
    afterEach(() => vi.useRealTimers());

    const elapsedAfter = async (seconds: number) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.parse('2026-11-01T10:00:00Z') + seconds * 1000);
      workouts.getCurrent.mockResolvedValue(workout({}));
      await setUp({ mode: 'start-workout' });
      return component.elapsed();
    };

    it('shows minutes and seconds under an hour', async () => {
      expect(await elapsedAfter(32 * 60 + 18)).toBe('32:18');
    });

    it('adds the hours from one hour on', async () => {
      expect(await elapsedAfter(3600 + 2 * 60 + 5)).toBe('1:02:05');
    });
  });

  it('opens a plan for editing', async () => {
    workouts.get.mockResolvedValue(workout({ id: 3, status: 'Planned', name: 'Leg day', plannedForUtc: '2026-11-03T00:00:00Z', startedAtUtc: null }));

    await setUp({ plan: '3' });

    expect(workouts.get).toHaveBeenCalledWith(3);
    expect(component.mode).toBe('plan');
    expect(component.name()).toBe('Leg day');
    expect(component.plannedFor()).toBe('2026-11-03');
  });
});
