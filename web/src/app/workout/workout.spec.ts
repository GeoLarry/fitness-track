import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Workout } from './workout';
import { WorkoutService } from './workout.service';

describe('Workout', () => {
  async function create(tab: string | null) {
    await TestBed.configureTestingModule({
      imports: [Workout],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(tab ? { tab } : {}) } } },
        { provide: WorkoutService, useValue: {} },
      ],
    }).overrideComponent(Workout, { set: { template: '' } }).compileComponents();

    return TestBed.createComponent(Workout).componentInstance;
  }

  it('opens on New Workout', async () => {
    expect((await create(null)).selectedTabIndex).toBe(1);
  });

  it('opens the tab named in the URL', async () => {
    expect((await create('planned')).selectedTabIndex).toBe(0);
  });

  it('opens the history after a workout is done', async () => {
    expect((await create('completed')).selectedTabIndex).toBe(2);
  });
});
