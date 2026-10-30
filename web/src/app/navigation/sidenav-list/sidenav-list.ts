import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-sidenav-list',
  imports: [MatListModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './sidenav-list.html',
  styleUrl: './sidenav-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavList {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly closeSidenav = output<void>();
  readonly isAuth = this.authService.isAuthenticated;

  onClose() {
    this.closeSidenav.emit();
  }

  onLogout() {
    this.authService.logout();
    this.onClose();
    this.router.navigate(['/login']);
  }
}
