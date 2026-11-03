import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MainNav } from './main-nav';

@Component({ template: '' })
class Blank {}

describe('MainNav', () => {
  async function createAt(url: string) {
    await TestBed.configureTestingModule({
      imports: [MainNav],
      providers: [provideRouter([{ path: '**', component: Blank }])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainNav);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const current = (element: HTMLElement) => element.querySelector('[aria-current="page"]')?.textContent;

  it('links to the four sections', async () => {
    const links = Array.from((await createAt('/')).querySelectorAll('a'));

    expect(links.map(link => link.getAttribute('href'))).toEqual(['/', '/training', '/history', '/profile']);
  });

  it('marks the section in the URL, ignoring its query', async () => {
    expect(current(await createAt('/history?x=1'))).toContain('History');
  });

  it('counts a workout in progress as Training', async () => {
    expect(current(await createAt('/current-workout?mode=start-workout'))).toContain('Training');
  });
});
