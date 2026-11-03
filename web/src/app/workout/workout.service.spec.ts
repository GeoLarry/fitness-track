import { TestBed } from '@angular/core/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkoutService } from './workout.service';
import { AuthService } from '../shared/services/auth.service';
import { CurrentUser } from '../models/auth.model';
import { SaveWorkoutRequest, Workout, WorkoutSummary } from '../models/workout.model';
import { API_URL } from '../shared/http/api-url';

describe('WorkoutService', () => {
  const workout = (id: number, status: Workout['status']): Workout => ({
    id, name: null, notes: null, status, plannedForUtc: null, startedAtUtc: null, completedAtUtc: null,
    durationSeconds: null, sourcePlanId: null, updatedAtUtc: '2026-11-01T10:00:00Z', exercises: [],
  });
  const summary = (id: number, status: WorkoutSummary['status']): WorkoutSummary => ({
    id, name: null, status, plannedForUtc: null, startedAtUtc: null, completedAtUtc: null,
    durationSeconds: null, exerciseCount: 0, setCount: 0, volumeKg: 0,
  });
  const plannedUrl = `${API_URL}/workouts?status=Planned`;
  const completedUrl = `${API_URL}/workouts?status=Completed`;

  let currentUser: ReturnType<typeof signal<CurrentUser | null>>;
  let httpMock: HttpTestingController;
  let service: WorkoutService;

  const flushLists = async (planned: WorkoutSummary[], completed: WorkoutSummary[]) => {
    TestBed.tick();
    httpMock.expectOne(plannedUrl).flush(planned);
    httpMock.expectOne(completedUrl).flush(completed);
    await TestBed.inject(ApplicationRef).whenStable();
  };

  beforeEach(() => {
    currentUser = signal<CurrentUser | null>({ id: 1 } as CurrentUser);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { currentUser } }],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(WorkoutService);
  });

  afterEach(() => httpMock.verify());

  it('loads the plans and the history of the signed-in user', async () => {
    await flushLists([summary(1, 'Planned')], [summary(2, 'Completed')]);

    expect(service.planned.value().map(w => w.id)).toEqual([1]);
    expect(service.completed.value().map(w => w.id)).toEqual([2]);
  });

  it('asks for nothing while signed out', () => {
    currentUser.set(null);
    TestBed.tick();

    httpMock.expectNone(plannedUrl);
    httpMock.expectNone(completedUrl);
  });

  it('reads no workout in progress as null', async () => {
    await flushLists([], []);

    const current = service.getCurrent();
    httpMock.expectOne(`${API_URL}/workouts/current`).flush(null, { status: 204, statusText: 'No Content' });

    expect(await current).toBeNull();
  });

  it('saves the whole workout with PUT', async () => {
    await flushLists([], []);
    const request: SaveWorkoutRequest = {
      name: 'Push', notes: null, plannedForUtc: null, durationSeconds: null,
      exercises: [{ exerciseId: 40, notes: null, sets: [{ isWarmup: false, weightKg: 60, reps: 8, isDone: true }] }],
    };

    const saved = service.save(7, request);
    const req = httpMock.expectOne(`${API_URL}/workouts/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(workout(7, 'InProgress'));

    expect((await saved).id).toBe(7);
  });

  it('completes a workout and reloads the history', async () => {
    await flushLists([], []);

    const completed = service.complete(7);
    const req = httpMock.expectOne(`${API_URL}/workouts/7/complete`);
    expect(req.request.method).toBe('POST');
    req.flush(workout(7, 'Completed'));
    await completed;

    TestBed.tick();
    httpMock.expectOne(completedUrl).flush([summary(7, 'Completed')]);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(service.completed.value().map(w => w.id)).toEqual([7]);
  });

  it('starts a plan as a new workout', async () => {
    await flushLists([], []);

    const started = service.startPlan(3);
    const req = httpMock.expectOne(`${API_URL}/workouts/3/start`);
    expect(req.request.method).toBe('POST');
    req.flush(workout(9, 'InProgress'));

    expect((await started).id).toBe(9);
  });

  it('removes a deleted workout from the lists', async () => {
    await flushLists([summary(1, 'Planned')], [summary(2, 'Completed')]);

    const deleted = service.delete(1);
    httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${API_URL}/workouts/1`).flush(null, { status: 204, statusText: 'No Content' });
    await deleted;

    expect(service.planned.value()).toEqual([]);
    expect(service.completed.value().map(w => w.id)).toEqual([2]);
  });
});
