import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Profile } from './profile';
import { AuthService } from '../shared/services/auth.service';
import { CurrentUser } from '../models/auth.model';

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
  const logout = vi.fn();

  const user: CurrentUser = {
    id: 1,
    username: 'maria',
    email: 'maria@example.com',
    firstName: null,
    lastName: null,
    roles: [{ id: 1, name: 'User' }, { id: 2, name: 'Coach' }],
    permissions: [],
  };

  beforeEach(async () => {
    logout.mockClear();
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: signal(user), logout } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();
  });

  it('shows the user, with the username when there is no name', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(fixture.componentInstance.name()).toBe('maria');
    expect(text).toContain('maria@example.com');
    expect(text).toContain('User, Coach');
  });

  it('logs out and goes to the login page', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
