import { Component } from '@angular/core';
import { MaterialModule } from "../../material.module";
import { FormsModule, NgForm } from "@angular/forms";

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  imports: [MaterialModule, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit() { }

  onSubmit(form: NgForm) {
    this.authService.register({
      email: form.value.email,
      password: form.value.password
    });
  }

}
