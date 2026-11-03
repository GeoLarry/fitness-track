import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

// The main navigation: a bar below on phones, a column on the left on computers (see main-nav.css).
@Component({
  selector: 'app-main-nav',
  imports: [MatIconModule, RouterLink],
  templateUrl: './main-nav.html',
  styleUrl: './main-nav.css',
})
export class MainNav {
  private router = inject(Router);

  private readonly path = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url.split(/[?#]/)[0]),
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] },
  );

  // A workout in progress counts as Training.
  readonly links = computed(() => [
    { label: 'Home', icon: 'home', url: '/', paths: ['/'] },
    { label: 'Training', icon: 'fitness_center', url: '/training', paths: ['/training', '/current-workout'] },
    { label: 'History', icon: 'history', url: '/history', paths: ['/history'] },
    { label: 'Profile', icon: 'person', url: '/profile', paths: ['/profile'] },
  ].map(link => ({ ...link, active: link.paths.includes(this.path()) })));
}
