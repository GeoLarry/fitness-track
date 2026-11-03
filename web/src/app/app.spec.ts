import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { AuthService } from './shared/services/auth.service';

@Component({ template: '' })
class Blank {}

describe('App', () => {
  async function createAt(url: string) {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: '**', component: Blank }]),
        { provide: AuthService, useValue: { isAuthenticated: signal(true) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('nav')!;
  }

  const hidden = (nav: HTMLElement) => nav.classList.contains('hide-on-phone');

  it('hides the phone bar during a live workout', async () => {
    expect(hidden(await createAt('/current-workout?mode=start-workout'))).toBe(true);
  });

  it('keeps it while editing a plan', async () => {
    expect(hidden(await createAt('/current-workout?plan=3'))).toBe(false);
  });

  it('keeps it while making a new plan', async () => {
    expect(hidden(await createAt('/current-workout?mode=plan-workout'))).toBe(false);
  });

  it('keeps it on the other pages', async () => {
    expect(hidden(await createAt('/training'))).toBe(false);
  });
});
