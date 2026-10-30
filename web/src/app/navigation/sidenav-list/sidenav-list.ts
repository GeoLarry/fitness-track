import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidenav-list',
  imports: [MaterialModule, RouterLinkWithHref],
  templateUrl: './sidenav-list.html',
  styleUrl: './sidenav-list.css',
})
export class SidenavList implements OnInit {

  @Output() closeSidenav = new EventEmitter<void>();
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

  onClose() {
    this.closeSidenav.emit();
  }

  onLogout() {
    this.authService.logout();
    this.onClose();
  }

}
