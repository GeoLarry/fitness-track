import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PastTrainings } from './past-trainings';

describe('PastTrainings', () => {
  let component: PastTrainings;
  let fixture: ComponentFixture<PastTrainings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PastTrainings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PastTrainings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
