import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CompletedWorkouts } from './completed-workouts';
import { WorkoutService } from '../workout.service';
import { WorkoutSummary } from '../../models/workout.model';
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

  async function setUp(workouts: WorkoutSummary[]) {
    const completed = { value: signal(workouts), error: signal(undefined), isLoading: signal(false) };
    ask = vi.fn().mockResolvedValue(true);
    deleteWorkout = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [CompletedWorkouts],
      providers: [
        { provide: WorkoutService, useValue: { completed, delete: deleteWorkout } },
        { provide: ConfirmService, useValue: { ask } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompletedWorkouts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

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
