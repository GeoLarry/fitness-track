import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Signup } from './signup';
import { AuthService } from '../../shared/services/auth.service';
import { MockOf } from '../../shared/testing/mock-of';

describe('Signup', () => {
  let fixture: ComponentFixture<Signup>;
  let component: Signup;
  let auth: MockOf<AuthService, 'register'>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const form = { invalid: false, value: { username: 'jane', email: ' jane@example.com ', password: 'Password1', agree: true } } as NgForm;

  beforeEach(async () => {
    auth = { register: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates the account and goes to training', async () => {
    auth.register.mockResolvedValue();

    await component.onSubmit(form);

    expect(auth.register).toHaveBeenCalledWith({ username: 'jane', email: 'jane@example.com', password: 'Password1', firstName: null, lastName: null });
    expect(navigate).toHaveBeenCalledWith(['/training']);
  });

  it('shows the reason the API gives', async () => {
    auth.register.mockRejectedValue(new HttpErrorResponse({ status: 400, error: { message: 'This username is already taken.' } }));

    await component.onSubmit(form);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('This username is already taken.');
    expect(navigate).not.toHaveBeenCalled();
  });
});
