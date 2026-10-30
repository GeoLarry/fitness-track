import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomExerciseDialog } from './custom-exercise-dialog';

describe('CustomExerciseDialog', () => {
  let component: CustomExerciseDialog;
  let fixture: ComponentFixture<CustomExerciseDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomExerciseDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomExerciseDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
