import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [MaterialModule, RouterLinkWithHref],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {

  @Output() sidenavToggle = new EventEmitter<void>();
  authSubscription = new Subscription();
  isAuth: boolean = false;

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authSubscription = this.authService.authChange.subscribe(authStatus => {
      this.isAuth = authStatus;
    });
  }

  onToggleSidenav() {
    this.sidenavToggle.emit();
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
