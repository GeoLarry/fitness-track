import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { MainNav } from './navigation/main-nav/main-nav';
import { AuthService } from './shared/services/auth.service';

// A plan is edited on the same route as a live workout, through ?plan=<id> or ?mode=plan-workout.
function isLiveWorkout(url: string): boolean {
  const [path, query] = url.split('?');
  const params = new URLSearchParams(query);
  return path === '/current-workout' && !params.has('plan') && params.get('mode') !== 'plan-workout';
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainNav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  readonly isAuth = inject(AuthService).isAuthenticated;

  private readonly url = toSignal(
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  readonly liveWorkout = computed(() => isLiveWorkout(this.url()));
}
