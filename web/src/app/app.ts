import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNav } from './navigation/main-nav/main-nav';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainNav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly isAuth = inject(AuthService).isAuthenticated;
}
