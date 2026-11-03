import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { apiErrorMessage, safeReturnUrl } from '../../shared/http/api-error';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async onSubmit(form: NgForm) {
    if (form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.authService.login({ username: form.value.username.trim(), password: form.value.password });
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl ? safeReturnUrl(returnUrl) : '/training');
    } catch (error) {
      // The API answers a wrong username or password with a bare 401.
      this.error.set(error instanceof HttpErrorResponse && error.status === 401
        ? 'Wrong email, username or password.'
        : apiErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }
}
