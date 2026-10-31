import { TestBed } from '@angular/core/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExerciseCatalogService } from './exercise-catalog.service';
import { AuthService } from '../shared/services/auth.service';
import { CurrentUser } from '../models/auth.model';
import { Exercise } from '../models/exercise.model';
import { API_URL } from '../shared/http/api-url';

describe('ExerciseCatalogService', () => {
  const exercise = (id: number, name: string): Exercise => ({
    id, name, description: null, instructions: null, typeId: null, equipmentId: null,
    primaryMuscleIds: [], secondaryMuscleIds: [], isCustom: false,
  });
  const user = (id: number) => ({ id } as CurrentUser);

  let currentUser: ReturnType<typeof signal<CurrentUser | null>>;
  let httpMock: HttpTestingController;
  let service: ExerciseCatalogService;

  // The resources load on the next change detection tick.
  const flushCatalog = (exercises: Exercise[]) => {
    TestBed.tick();
    httpMock.expectOne(`${API_URL}/exercises`).flush(exercises);
    httpMock.expectOne(`${API_URL}/muscles`).flush([{ id: 1, name: 'Quads' }, { id: 2, name: 'Glutes' }]);
    httpMock.expectOne(`${API_URL}/equipment`).flush([]);
  };

  beforeEach(() => {
    currentUser = signal<CurrentUser | null>(user(1));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { currentUser } }],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ExerciseCatalogService);
  });

  afterEach(() => httpMock.verify());

  it('loads the catalog for the signed-in user', async () => {
    flushCatalog([exercise(1, 'Bench Press')]);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.exercises.value().map(e => e.name)).toEqual(['Bench Press']);
    expect(service.muscleNames([1, 2])).toEqual(['Glutes', 'Quads']);
  });

  it('asks for nothing while signed out', () => {
    currentUser.set(null);
    TestBed.tick();

    httpMock.expectNone(`${API_URL}/exercises`);
    expect(service.exercises.value()).toEqual([]);
  });

  it('adds a created exercise in alphabetical order', async () => {
    flushCatalog([exercise(1, 'Bench Press'), exercise(2, 'Squat')]);
    await TestBed.inject(ApplicationRef).whenStable();

    const create = service.createExercise({
      name: 'Deadlift', description: null, instructions: null, typeId: null, equipmentId: null, primaryMuscleIds: [], secondaryMuscleIds: [],
    });
    const req = httpMock.expectOne(`${API_URL}/exercises`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...exercise(3, 'Deadlift'), isCustom: true });
    await create;

    expect(service.exercises.value().map(e => e.name)).toEqual(['Bench Press', 'Deadlift', 'Squat']);
  });

  it('loads again for another user', async () => {
    flushCatalog([exercise(1, 'Bench Press')]);
    await TestBed.inject(ApplicationRef).whenStable();

    currentUser.set(user(2));
    flushCatalog([exercise(1, 'Bench Press'), { ...exercise(9, 'My Own'), isCustom: true }]);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.exercises.value().map(e => e.name)).toEqual(['Bench Press', 'My Own']);
  });
});
