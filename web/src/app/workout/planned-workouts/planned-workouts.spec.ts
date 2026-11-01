import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { PlannedWorkouts } from './planned-workouts';
import { WorkoutService } from '../workout.service';
import { WorkoutSummary } from '../../models/workout.model';

describe('PlannedWorkouts', () => {
  let fixture: ComponentFixture<PlannedWorkouts>;
  let component: PlannedWorkouts;
  let startPlan: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const plan = (id: number, name: string | null, plannedForUtc: string | null): WorkoutSummary => ({
    id, name, status: 'Planned', plannedForUtc, startedAtUtc: null, completedAtUtc: null,
    durationSeconds: null, exerciseCount: 3, setCount: 9, volumeKg: 0,
  });

  async function setUp(plans: WorkoutSummary[]) {
    startPlan = vi.fn();
    const planned = { value: signal(plans), error: signal(undefined), isLoading: signal(false) };
    await TestBed.configureTestingModule({
      imports: [PlannedWorkouts],
      providers: [provideRouter([]), { provide: WorkoutService, useValue: { planned, startPlan } }],
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

  it('opens a plan for editing', async () => {
    await setUp([plan(1, 'Push day', null)]);

    component.edit(1);

    expect(navigate).toHaveBeenCalledWith(['/current-workout'], { queryParams: { plan: 1 } });
  });
});
