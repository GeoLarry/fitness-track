import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Header } from "./navigation/header/header";
import { SidenavList } from "./navigation/sidenav-list/sidenav-list";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, Header, SidenavList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
