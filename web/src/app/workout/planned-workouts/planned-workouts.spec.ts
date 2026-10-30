import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlannedWorkouts } from './planned-workouts';

describe('PlannedWorkouts', () => {
  let component: PlannedWorkouts;
  let fixture: ComponentFixture<PlannedWorkouts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlannedWorkouts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlannedWorkouts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
