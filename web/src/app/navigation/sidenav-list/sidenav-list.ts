import { Component, OnInit, EventEmitter, Output, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterLinkWithHref } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidenav-list',
  imports: [MatListModule, MatIconModule, MatButtonModule, RouterLinkWithHref],
  templateUrl: './sidenav-list.html',
  styleUrl: './sidenav-list.css',
})
export class SidenavList implements OnInit {
  private authService = inject(AuthService);

  @Output() closeSidenav = new EventEmitter<void>();
  authSubscription = new Subscription();
  isAuth = false;

  ngOnInit() {
    this.authSubscription = this.authService.authChange.subscribe(authStatus => {
      this.isAuth = authStatus;
    });
  }

  onClose() {
    this.closeSidenav.emit();
  }

  onLogout() {
    this.authService.logout();
    this.onClose();
  }

}
