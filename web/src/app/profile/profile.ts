import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [MatButtonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly user = this.authService.currentUser;
  readonly name = computed(() => {
    const user = this.user();
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username;
  });
  readonly roles = computed(() => this.user()?.roles.map(role => role.name).join(', '));

  logout() {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
