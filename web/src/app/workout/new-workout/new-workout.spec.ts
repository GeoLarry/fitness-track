import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NewWorkout } from './new-workout';
import { WorkoutService } from '../workout.service';
import { MockOf } from '../../shared/testing/mock-of';
import { Workout } from '../../models/workout.model';

describe('NewWorkout', () => {
  let workouts: MockOf<WorkoutService, 'getCurrent'>;

  async function create() {
    await TestBed.configureTestingModule({
      imports: [NewWorkout],
      providers: [provideRouter([]), { provide: WorkoutService, useValue: workouts }],
    }).compileComponents();

    const fixture = TestBed.createComponent(NewWorkout);
    await fixture.whenStable();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'));
  }

  beforeEach(() => {
    workouts = { getCurrent: vi.fn() };
  });

  it('offers to start when no workout is in progress', async () => {
    workouts.getCurrent.mockResolvedValue(null);

    expect((await create())[0].textContent).toContain('Start workout');
  });

  it('offers to resume the workout in progress', async () => {
    workouts.getCurrent.mockResolvedValue({ id: 5 } as Workout);

    expect((await create())[0].textContent).toContain('Resume workout');
  });

  it('still offers to start when the check fails', async () => {
    workouts.getCurrent.mockRejectedValue(new Error('offline'));

    expect((await create())[0].textContent).toContain('Start workout');
  });

  it('links to a live workout and to a new plan', async () => {
    workouts.getCurrent.mockResolvedValue(null);

    const links = await create();

    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/current-workout?mode=start-workout',
      '/current-workout?mode=plan-workout',
    ]);
    expect(links[1].textContent).toContain('Plan a workout');
  });
});
