import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from './material.module';
import { Header } from "./navigation/header/header";
import { SidenavList } from "./navigation/sidenav-list/sidenav-list";
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MaterialModule, Header, SidenavList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.initAuthListener();
  }
  protected readonly title = signal('test');
  openSidenav = false;
}
