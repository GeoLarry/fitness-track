import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, NgForm } from '@angular/forms';

import { AuthService } from '../auth.service';
import { UIService } from '../shared/ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule, MatProgressSpinnerModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private uiService = inject(UIService);
  private cd = inject(ChangeDetectorRef);

  loadingSubscriptions: Subscription;
  isLoading = false;

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
