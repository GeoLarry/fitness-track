import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExercisesDialog } from './exercises-dialog';

describe('ExercisesDialog', () => {
  let component: ExercisesDialog;
  let fixture: ComponentFixture<ExercisesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExercisesDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExercisesDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
