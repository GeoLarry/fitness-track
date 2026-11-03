import { Injectable, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../shared/http/api-url';
import { AuthService } from '../shared/services/auth.service';
import { CreateWorkoutRequest, SaveWorkoutRequest, Workout, WorkoutSummary } from '../models/workout.model';

// The signed-in user's workouts on the API: the plans and history lists, the workout in progress,
// and every change to them. Writes reload the lists they affect so every tab stays current.
@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly userId = () => this.auth.currentUser()?.id;

  // Plans by day (undated last), history newest first: the order the API sends.
  readonly planned = httpResource<WorkoutSummary[]>(
    () => this.userId() ? `${API_URL}/workouts?status=Planned` : undefined, { defaultValue: [] });
  readonly completed = httpResource<WorkoutSummary[]>(
    () => this.userId() ? `${API_URL}/workouts?status=Completed` : undefined, { defaultValue: [] });

  // The workout in progress, or null when there is none (the API answers 204).
  async getCurrent(): Promise<Workout | null> {
    return await firstValueFrom(this.http.get<Workout | null>(`${API_URL}/workouts/current`)) ?? null;
  }

  get(id: number): Promise<Workout> {
    return firstValueFrom(this.http.get<Workout>(`${API_URL}/workouts/${id}`));
  }

  async create(request: CreateWorkoutRequest): Promise<Workout> {
    const workout = await firstValueFrom(this.http.post<Workout>(`${API_URL}/workouts`, request));
    if (workout.status === 'Planned') this.planned.reload();
    return workout;
  }

  async save(id: number, request: SaveWorkoutRequest): Promise<Workout> {
    const workout = await firstValueFrom(this.http.put<Workout>(`${API_URL}/workouts/${id}`, request));
    this.reloadList(workout);
    return workout;
  }

  // A new workout in progress with the plan's exercises and sets; the plan stays.
  startPlan(planId: number): Promise<Workout> {
    return firstValueFrom(this.http.post<Workout>(`${API_URL}/workouts/${planId}/start`, null));
  }

  // Without a duration the API works it out from the start time.
  async complete(id: number): Promise<Workout> {
    const workout = await firstValueFrom(this.http.post<Workout>(`${API_URL}/workouts/${id}/complete`, {}));
    this.completed.reload();
    return workout;
  }

  async delete(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${API_URL}/workouts/${id}`));
    this.planned.update(list => list.filter(w => w.id !== id));
    this.completed.update(list => list.filter(w => w.id !== id));
  }

  private reloadList(workout: Workout) {
    if (workout.status === 'Planned') this.planned.reload();
    if (workout.status === 'Completed') this.completed.reload();
  }
}
