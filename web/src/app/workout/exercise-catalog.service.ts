import { Injectable, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../shared/http/api-url';
import { AuthService } from '../shared/services/auth.service';
import { CatalogItem, CreateExerciseRequest, Exercise } from '../models/exercise.model';

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

// The exercise catalog from the API: shared exercises plus the signed-in user's custom ones,
// and the muscles and equipment they refer to. Loaded once per signed-in user and kept for the session.
@Injectable({ providedIn: 'root' })
export class ExerciseCatalogService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // Keyed on the user, so signing in as someone else loads their custom exercises instead.
  private readonly userId = () => this.auth.currentUser()?.id;

  readonly exercises = httpResource<Exercise[]>(() => this.userId() ? `${API_URL}/exercises` : undefined, { defaultValue: [] });
  readonly muscles = httpResource<CatalogItem[]>(() => this.userId() ? `${API_URL}/muscles` : undefined, { defaultValue: [] });
  readonly equipment = httpResource<CatalogItem[]>(() => this.userId() ? `${API_URL}/equipment` : undefined, { defaultValue: [] });

  // Saves a custom exercise and adds it to the list in alphabetical order.
  async createExercise(request: CreateExerciseRequest): Promise<Exercise> {
    const created = await firstValueFrom(this.http.post<Exercise>(`${API_URL}/exercises`, request));
    this.exercises.update(list => [...list, created].sort(byName));
    return created;
  }

  muscleNames(ids: readonly number[]): string[] {
    return this.muscles.value().filter(m => ids.includes(m.id)).map(m => m.name).sort();
  }
}
