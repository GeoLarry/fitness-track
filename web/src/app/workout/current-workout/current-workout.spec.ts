import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentWorkout } from './current-workout';

describe('CurrentWorkout', () => {
  let component: CurrentWorkout;
  let fixture: ComponentFixture<CurrentWorkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentWorkout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentWorkout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
