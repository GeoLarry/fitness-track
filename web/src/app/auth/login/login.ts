import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { FormsModule, NgForm } from '@angular/forms';

import { AuthService } from '../auth.service';
import { UIService } from '../shared/ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [MaterialModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {

  loadingSubscriptions: Subscription;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private uiService: UIService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.loadingSubscriptions = this.uiService.loadingStateChanged.subscribe(isLoading => {
      this.isLoading = isLoading;
      this.cd.detectChanges();
    });
  }

  onSubmit(form: NgForm) {
    this.authService.login({
      email: form.value.email,
      password: form.value.password
    });
  }

  ngOnDestroy(): void {
    if (this.loadingSubscriptions) {
      this.loadingSubscriptions.unsubscribe();
    }
  }
}
