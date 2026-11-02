import { DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

// How far (px) a finger moves before it counts as a swipe, and how far left it deletes.
const startDistance = 10;
const deleteDistance = 120;

// Lets the element be dragged to the left by touch or mouse. Past the delete distance it stays
// open and emits `swiped`; the parent asks the user, then removes the element or calls reset().
@Directive({
  selector: '[appSwipeToDelete]',
  exportAs: 'appSwipeToDelete',
  host: {
    '[style.touch-action]': '"pan-y"',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'reset()',
  },
})
export class SwipeToDelete {
  readonly swiped = output<void>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private start: { x: number; y: number } | null = null;
  private swiping = false;
  private ignoreClick = false;

  constructor() {
    // Capture phase: the click that ends a swipe must not reach the element's content,
    // including a button at the right edge, where a swipe to the left naturally starts.
    const onClick = (event: MouseEvent) => {
      if (!this.ignoreClick) return;
      this.ignoreClick = false;
      event.stopPropagation();
    };
    this.element.addEventListener('click', onClick, { capture: true });
    inject(DestroyRef).onDestroy(() => this.element.removeEventListener('click', onClick, { capture: true }));
  }

  onPointerDown(event: PointerEvent) {
    this.ignoreClick = false;
    if (event.button !== 0) return;
    this.start = { x: event.clientX, y: event.clientY };
  }

  onPointerMove(event: PointerEvent) {
    if (!this.start) return;
    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;

    if (!this.swiping) {
      if (Math.abs(dx) < startDistance && Math.abs(dy) < startDistance) return;
      // Scrolling, or a move to the right: leave it to the browser.
      if (dx >= 0 || Math.abs(dy) >= Math.abs(dx)) {
        this.start = null;
        return;
      }
      this.swiping = true;
      this.element.setPointerCapture(event.pointerId);
    }
    this.moveTo(Math.min(0, dx), false);
  }

  onPointerUp(event: PointerEvent) {
    const start = this.start;
    const swiping = this.swiping;
    this.start = null;
    this.swiping = false;
    if (!start || !swiping) return;

    this.ignoreClick = true;
    if (event.clientX - start.x <= -deleteDistance) {
      this.moveTo(-deleteDistance, true);
      this.swiped.emit();
    } else {
      this.moveTo(0, true);
    }
  }

  // Back to its place, e.g. when the user answers no.
  reset() {
    this.start = null;
    this.swiping = false;
    this.moveTo(0, true);
  }

  private moveTo(x: number, animate: boolean) {
    this.element.style.transition = animate ? 'transform 200ms ease-out' : 'none';
    this.element.style.transform = x === 0 ? '' : `translateX(${x}px)`;
  }
}
