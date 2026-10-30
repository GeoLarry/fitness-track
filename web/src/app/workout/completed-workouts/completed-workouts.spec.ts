import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletedWorkouts } from './completed-workouts';

describe('CompletedWorkouts', () => {
  let component: CompletedWorkouts;
  let fixture: ComponentFixture<CompletedWorkouts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletedWorkouts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletedWorkouts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
