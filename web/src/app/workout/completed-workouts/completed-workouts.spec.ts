import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompletedWorkouts } from './completed-workouts';
import { WorkoutService } from '../workout.service';
import { WorkoutPeriodSummary, WorkoutSummary } from '../../models/workout.model';
import { API_URL } from '../../shared/http/api-url';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { MatDialog } from '@angular/material/dialog';
import { WorkoutPreview } from './workout-preview/workout-preview';
import { SwipeActions } from '../../shared/swipe-actions/swipe-actions';

describe('CompletedWorkouts', () => {
  let fixture: ComponentFixture<CompletedWorkouts>;
  let component: CompletedWorkouts;
  let ask: ReturnType<typeof vi.fn>;
  let deleteWorkout: ReturnType<typeof vi.fn>;

  const done = (id: number, name: string | null): WorkoutSummary => ({
    id, name, status: 'Completed', plannedForUtc: null, startedAtUtc: '2026-10-25T17:00:00Z',
    completedAtUtc: '2026-10-25T18:05:00Z', durationSeconds: 3900, exerciseCount: 3, setCount: 9, volumeKg: 5312.5,
  });

  const summaryUrl = `${API_URL}/workouts/summary?days=7`;
  const week: WorkoutPeriodSummary = {
    days: 7, workoutCount: 3, durationSeconds: 10440, setCount: 51, volumeKg: 19840,
    muscles: [
      { muscleId: 1, name: 'Chest', setCount: 10, volumeKg: 3540 },
      { muscleId: 2, name: 'Back', setCount: 8, volumeKg: 2480 },
      { muscleId: 3, name: 'Quads', setCount: 8, volumeKg: 4320 },
      { muscleId: 4, name: 'Lats', setCount: 6, volumeKg: 2100 },
    ],
  };

  // The page stays unstable until its request is answered. null answers with an error.
  const flushSummary = async (body: WorkoutPeriodSummary | null) => {
    TestBed.tick();
    const request = TestBed.inject(HttpTestingController).expectOne(summaryUrl);
    if (body) request.flush(body);
    else request.flush('', { status: 500, statusText: 'Server Error' });
    await TestBed.inject(ApplicationRef).whenStable();
  };

  async function setUp(workouts: WorkoutSummary[], summary: WorkoutPeriodSummary | null = week) {
    const completed = { value: signal(workouts), error: signal(undefined), isLoading: signal(false) };
    ask = vi.fn().mockResolvedValue(true);
    deleteWorkout = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [CompletedWorkouts],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WorkoutService, useValue: { completed, delete: deleteWorkout } },
        { provide: ConfirmService, useValue: { ask } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompletedWorkouts);
    component = fixture.componentInstance;
    await flushSummary(summary);
  }

  describe('summary of the last days', () => {
    const element = () => fixture.nativeElement as HTMLElement;
    const hiddenMuscles = () => element().querySelectorAll('.muscle-hidden').length;

    it('shows the totals and the sets and kg per muscle', async () => {
      await setUp([done(1, 'Leg day')]);

      const text = element().querySelector('.summary')!.textContent;
      expect(text).toContain('Last 7 days');
      expect(text).toContain('19,840');
      expect(text).toContain('2 h 54 min');
      expect(text).toContain('51');
      expect(text).toContain('Chest');
      expect(text).toContain('3,540');
    });

    it('keeps muscles after the first few folded until asked', async () => {
      await setUp([done(1, 'Leg day')]);
      expect(hiddenMuscles()).toBe(1);

      element().querySelector<HTMLButtonElement>('.summary-more')!.click();
      await fixture.whenStable();

      expect(hiddenMuscles()).toBe(0);
      expect(element().querySelector('.summary-more')!.textContent).toContain('Show fewer muscles');
    });

    it('does not offer more muscles when they all fit', async () => {
      await setUp([done(1, 'Leg day')], { ...week, muscles: week.muscles.slice(0, 3) });

      expect(element().querySelector('.summary-more')).toBeNull();
    });

    it('shows zeros when the workouts are all older', async () => {
      await setUp([done(1, 'Leg day')], { days: 7, workoutCount: 0, durationSeconds: 0, setCount: 0, volumeKg: 0, muscles: [] });

      expect(element().querySelector('.summary')!.textContent).toContain('0 min');
    });

    it('has no summary before the first workout', async () => {
      await setUp([]);

      expect(element().querySelector('.summary')).toBeNull();
    });

    it('still lists the workouts when the summary fails', async () => {
      await setUp([done(1, 'Leg day')], null);

      expect(element().querySelector('.summary')).toBeNull();
      expect(element().textContent).toContain('Leg day');
    });

    it('reloads after a workout is deleted', async () => {
      await setUp([done(1, 'Leg day')]);

      await component.delete(1);
      await flushSummary({ ...week, workoutCount: 2 });

      expect(deleteWorkout).toHaveBeenCalledWith(1);
    });
  });

  it('lists the history with duration, sets and volume', async () => {
    await setUp([done(1, 'Leg day')]);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Leg day');
    expect(text).toContain('1 h 05 min');
    expect(text).toContain('9 sets');
    expect(text).toContain('5,312.5 kg');
  });

  it('opens the preview when a workout is tapped', async () => {
    await setUp([done(1, 'Leg day')]);
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(undefined as never);

    fixture.nativeElement.querySelector('.workout-item-open').click();

    expect(open).toHaveBeenCalledWith(WorkoutPreview, expect.objectContaining({ data: expect.objectContaining({ id: 1 }) }));
  });

  it('deletes a workout only when confirmed', async () => {
    await setUp([done(1, 'Leg day')]);

    ask.mockResolvedValue(false);
    await component.delete(1);
    expect(deleteWorkout).not.toHaveBeenCalled();

    ask.mockResolvedValue(true);
    await component.delete(1);
    expect(deleteWorkout).toHaveBeenCalledWith(1);
  });

  it('puts a swiped card back unless the workout was deleted', async () => {
    await setUp([done(1, 'Leg day')]);
    const swipe = { reset: vi.fn() } as unknown as SwipeActions;

    ask.mockResolvedValue(false);
    await component.delete(1, swipe);
    expect(swipe.reset).toHaveBeenCalledOnce();

    ask.mockResolvedValue(true);
    await component.delete(1, swipe);
    expect(swipe.reset).toHaveBeenCalledOnce();

    deleteWorkout.mockRejectedValue(new Error('offline'));
    await component.delete(1, swipe);
    expect(swipe.reset).toHaveBeenCalledTimes(2);
  });

  it('says when nothing is completed yet', async () => {
    await setUp([]);

    expect(fixture.nativeElement.textContent).toContain('No completed workouts yet');
  });

  it('formats short and long durations', async () => {
    await setUp([]);

    expect(component.duration(48 * 60)).toBe('48 min');
    expect(component.duration(null)).toBe('');
  });
});
