import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CompletedWorkouts } from './completed-workouts';
import { WorkoutService } from '../workout.service';
import { WorkoutSummary } from '../../models/workout.model';

describe('CompletedWorkouts', () => {
  let fixture: ComponentFixture<CompletedWorkouts>;
  let component: CompletedWorkouts;

  const done = (id: number, name: string | null): WorkoutSummary => ({
    id, name, status: 'Completed', plannedForUtc: null, startedAtUtc: '2026-10-25T17:00:00Z',
    completedAtUtc: '2026-10-25T18:05:00Z', durationSeconds: 3900, exerciseCount: 3, setCount: 9, volumeKg: 5312.5,
  });

  async function setUp(workouts: WorkoutSummary[]) {
    const completed = { value: signal(workouts), error: signal(undefined), isLoading: signal(false) };
    await TestBed.configureTestingModule({
      imports: [CompletedWorkouts],
      providers: [{ provide: WorkoutService, useValue: { completed } }],
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
