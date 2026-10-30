import { TestBed } from '@angular/core/testing';

import { ExerciseInfoService } from './exercise-info.service';

describe('ExerciseInfoService', () => {
  let service: ExerciseInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciseInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
