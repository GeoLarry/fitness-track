import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseInfo } from './exercise-info';

describe('ExerciseInfo', () => {
  let component: ExerciseInfo;
  let fixture: ComponentFixture<ExerciseInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciseInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
