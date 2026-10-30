import { Component, OnInit } from '@angular/core';
import { FirebaseSeedService } from '../initialazation/firebase-seed.seervice';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome implements OnInit {

  constructor(
    private seedService: FirebaseSeedService
  ) { }

  ngOnInit(): void {
    //this.seedService.seed();
  }

}
