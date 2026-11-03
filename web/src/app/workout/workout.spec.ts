import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Workout } from './workout';

describe('Workout', () => {
  it('shows starting a workout and the plans on one page, without tabs', async () => {
    await TestBed.configureTestingModule({ imports: [Workout] })
      .overrideComponent(Workout, { set: { imports: [], schemas: [CUSTOM_ELEMENTS_SCHEMA] } })
      .compileComponents();

    const fixture = TestBed.createComponent(Workout);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-new-workout')).not.toBeNull();
    expect(element.querySelector('app-planned-workouts')).not.toBeNull();
    expect(element.querySelector('mat-tab-group')).toBeNull();
  });
});
