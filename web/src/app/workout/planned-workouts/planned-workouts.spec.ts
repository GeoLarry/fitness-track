import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { PlannedWorkouts } from './planned-workouts';
import { WorkoutService } from '../workout.service';
import { WorkoutSummary } from '../../models/workout.model';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { SwipeActions } from '../../shared/swipe-actions/swipe-actions';

describe('PlannedWorkouts', () => {
  let fixture: ComponentFixture<PlannedWorkouts>;
  let component: PlannedWorkouts;
  let startPlan: ReturnType<typeof vi.fn>;
  let getCurrent: ReturnType<typeof vi.fn>;
  let deletePlan: ReturnType<typeof vi.fn>;
  let ask: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const plan = (id: number, name: string | null, plannedForUtc: string | null): WorkoutSummary => ({
    id, name, status: 'Planned', plannedForUtc, startedAtUtc: null, completedAtUtc: null,
    durationSeconds: null, exerciseCount: 3, setCount: 9, volumeKg: 0,
  });

  async function setUp(plans: WorkoutSummary[]) {
    startPlan = vi.fn();
    getCurrent = vi.fn().mockResolvedValue(null);
    deletePlan = vi.fn().mockResolvedValue(undefined);
    ask = vi.fn().mockResolvedValue(true);
    const planned = { value: signal(plans), error: signal(undefined), isLoading: signal(false) };
    await TestBed.configureTestingModule({
      imports: [PlannedWorkouts],
      providers: [
        provideRouter([]),
        { provide: WorkoutService, useValue: { planned, startPlan, getCurrent, delete: deletePlan } },
        { provide: ConfirmService, useValue: { ask } },
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PlannedWorkouts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('lists the plans with their day', async () => {
    await setUp([plan(1, 'Push day', '2026-11-03T00:00:00Z'), plan(2, null, null)]);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Push day');
    expect(text).toContain('Tue 3 Nov');
    expect(text).toContain('Untitled plan');
    expect(text).toContain('Any day');
  });

  it('says when there are no plans', async () => {
    await setUp([]);

    expect(fixture.nativeElement.textContent).toContain('No plans yet');
  });

  it('starts a plan and opens the workout', async () => {
    await setUp([plan(1, 'Push day', null)]);
    startPlan.mockResolvedValue({ id: 9 });

    await component.start(1);

    expect(startPlan).toHaveBeenCalledWith(1);
    expect(navigate).toHaveBeenCalledWith(['/current-workout']);
  });

  it('does not start a plan when the user says no, and puts a swiped card back', async () => {
    await setUp([plan(1, 'Push day', null)]);
    ask.mockResolvedValue(false);
    const swipe = { reset: vi.fn() } as unknown as SwipeActions;

    await component.start(1, swipe);

    expect(startPlan).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(swipe.reset).toHaveBeenCalledOnce();
  });

  it('offers the running workout instead of starting a second one', async () => {
    await setUp([plan(1, 'Push day', null)]);
    getCurrent.mockResolvedValue({ id: 9 });

    await component.start(1);

    expect(ask).toHaveBeenCalledWith(expect.objectContaining({ title: 'A workout is already in progress', confirmLabel: 'Open workout' }));
    expect(startPlan).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/current-workout']);
  });

  it('stays on the list when the running workout is not opened', async () => {
    await setUp([plan(1, 'Push day', null)]);
    getCurrent.mockResolvedValue({ id: 9 });
    ask.mockResolvedValue(false);
    const swipe = { reset: vi.fn() } as unknown as SwipeActions;

    await component.start(1, swipe);

    expect(navigate).not.toHaveBeenCalled();
    expect(swipe.reset).toHaveBeenCalledOnce();
  });

  it('puts a swiped card back when starting fails', async () => {
    await setUp([plan(1, 'Push day', null)]);
    startPlan.mockRejectedValue(new Error('offline'));
    const swipe = { reset: vi.fn() } as unknown as SwipeActions;

    await component.start(1, swipe);

    expect(navigate).not.toHaveBeenCalled();
    expect(swipe.reset).toHaveBeenCalledOnce();
  });

  it('opens a plan for editing when its card is tapped', async () => {
    await setUp([plan(1, 'Push day', null)]);

    fixture.nativeElement.querySelector('.workout-item-open').click();

    expect(navigate).toHaveBeenCalledWith(['/current-workout'], { queryParams: { plan: 1 } });
    expect(ask).not.toHaveBeenCalled();
  });

  it('deletes a plan only when confirmed', async () => {
    await setUp([plan(1, 'Push day', null)]);

    ask.mockResolvedValue(false);
    await component.delete(1);
    expect(deletePlan).not.toHaveBeenCalled();

    ask.mockResolvedValue(true);
    await component.delete(1);
    expect(deletePlan).toHaveBeenCalledWith(1);
  });

  it('opens a plan for editing', async () => {
    await setUp([plan(1, 'Push day', null)]);

    component.edit(1);

    expect(navigate).toHaveBeenCalledWith(['/current-workout'], { queryParams: { plan: 1 } });
  });
});
