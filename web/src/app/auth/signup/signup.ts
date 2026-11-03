import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { apiErrorMessage } from '../../shared/http/api-error';

@Component({
  selector: 'app-signup',
  imports: [MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // A new account is signed in straight away and starts on the training page.
  async onSubmit(form: NgForm) {
    if (form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.authService.register({
        username: form.value.username.trim(),
        email: form.value.email.trim(),
        password: form.value.password,
        firstName: null,
        lastName: null,
      });
      await this.router.navigate(['/training']);
    } catch (error) {
      // e.g. "This username is already taken."
      this.error.set(apiErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }
}
