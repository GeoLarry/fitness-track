import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwipeToDelete } from './swipe-to-delete';

@Component({
  imports: [SwipeToDelete],
  template: `
    <div appSwipeToDelete #swipe="appSwipeToDelete" class="host" (swiped)="swipes.set(swipes() + 1)">
      <span class="content" role="button" tabindex="0" (click)="clicks.set(clicks() + 1)" (keydown.enter)="clicks.set(clicks() + 1)">Text</span>
      <button type="button" class="action" (click)="swipe.reset()">Action</button>
    </div>`,
})
class Host {
  readonly swipes = signal(0);
  readonly clicks = signal(0);
}

describe('SwipeToDelete', () => {
  let host: Host;
  let element: HTMLElement;

  // jsdom has no PointerEvent; MouseEvent carries the same coordinates.
  const pointer = (target: Element, type: string, clientX: number, clientY = 0) =>
    target.dispatchEvent(new MouseEvent(type, { clientX, clientY, button: 0, bubbles: true }));

  const swipe = (target: Element, distance: number) => {
    pointer(target, 'pointerdown', 200);
    pointer(target, 'pointermove', 200 - distance / 2);
    pointer(target, 'pointermove', 200 - distance);
    pointer(target, 'pointerup', 200 - distance);
  };

  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    host = fixture.componentInstance;
    element = fixture.nativeElement.querySelector('.host');
  });

  it('keeps vertical scrolling for the browser and takes horizontal moves', () => {
    expect(element.style.touchAction).toBe('pan-y');
  });

  it('emits and stays open past the delete distance', () => {
    swipe(element, 150);

    expect(host.swipes()).toBe(1);
    expect(element.style.transform).toBe('translateX(-120px)');
  });

  it('goes back without emitting below the delete distance', () => {
    swipe(element, 60);

    expect(host.swipes()).toBe(0);
    expect(element.style.transform).toBe('');
  });

  it('leaves vertical moves to the browser', () => {
    pointer(element, 'pointerdown', 200, 0);
    pointer(element, 'pointermove', 195, 40);
    pointer(element, 'pointermove', 50, 40);
    pointer(element, 'pointerup', 50, 40);

    expect(host.swipes()).toBe(0);
    expect(element.style.transform).toBe('');
  });

  it('ignores moves to the right', () => {
    swipe(element, -150);

    expect(host.swipes()).toBe(0);
  });

  it('can start on a button without pressing it', () => {
    const action = element.querySelector<HTMLElement>('.action')!;

    swipe(action, 150);
    action.click();

    expect(host.swipes()).toBe(1);
    expect(element.style.transform).toBe('translateX(-120px)');
  });

  it('swallows the click that ends a swipe, but not the next one', () => {
    const content = element.querySelector<HTMLElement>('.content')!;

    swipe(content, 60);
    content.click();
    expect(host.clicks()).toBe(0);

    content.click();
    expect(host.clicks()).toBe(1);
  });
});
