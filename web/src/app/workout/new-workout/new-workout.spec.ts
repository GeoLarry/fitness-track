import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewWorkout } from './new-workout';

describe('NewWorkout', () => {
  let component: NewWorkout;
  let fixture: ComponentFixture<NewWorkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewWorkout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewWorkout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
