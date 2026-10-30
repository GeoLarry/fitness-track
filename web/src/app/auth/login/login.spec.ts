import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Login } from './login';
import { AuthService } from '../../shared/services/auth.service';
import { MockOf } from '../../shared/testing/mock-of';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let auth: MockOf<AuthService, 'login'>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const form = (value: { username: string; password: string }) => ({ invalid: false, value }) as NgForm;

  async function setUp(returnUrl: string | null = null) {
    auth = { login: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) } } },
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('signs in with the email or username and goes to training', async () => {
    await setUp();
    auth.login.mockResolvedValue();

    await component.onSubmit(form({ username: ' jane ', password: 'Password1' }));

    expect(auth.login).toHaveBeenCalledWith({ username: 'jane', password: 'Password1' });
    expect(navigateByUrl).toHaveBeenCalledWith('/training');
  });

  it('goes back to the page that asked for the login', async () => {
    await setUp('/current-workout');
    auth.login.mockResolvedValue();

    await component.onSubmit(form({ username: 'jane', password: 'Password1' }));

    expect(navigateByUrl).toHaveBeenCalledWith('/current-workout');
  });

  it('shows a message for wrong credentials and stays on the page', async () => {
    await setUp();
    auth.login.mockRejectedValue(new HttpErrorResponse({ status: 401 }));

    await component.onSubmit(form({ username: 'jane', password: 'wrong' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Wrong email, username or password.');
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });
});
