import { DestroyRef, Directive, ElementRef, inject, input, output } from '@angular/core';

// How far (px) a finger moves before it counts as a swipe, and how far it goes to trigger the action.
const startDistance = 10;
const actionDistance = 120;

// Lets the element be dragged sideways by touch or mouse: to the left, and to the right with
// `allowRight`. Past the action distance it stays open and emits; the parent asks the user,
// then removes the element, navigates away or calls reset().
@Directive({
  selector: '[appSwipeActions]',
  exportAs: 'appSwipeActions',
  host: {
    '[style.touch-action]': '"pan-y"',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'reset()',
  },
})
export class SwipeActions {
  readonly allowRight = input(false);
  readonly swipedLeft = output<void>();
  readonly swipedRight = output<void>();

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
    // Dragging inside a field moves its cursor or selects its text.
    if (event.button !== 0 || (event.target as Element).closest('input, textarea')) return;
    this.start = { x: event.clientX, y: event.clientY };
  }

  onPointerMove(event: PointerEvent) {
    if (!this.start) return;
    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;

    if (!this.swiping) {
      if (Math.abs(dx) < startDistance && Math.abs(dy) < startDistance) return;
      // Scrolling, or a direction this element does not swipe in: leave it to the browser.
      if ((dx > 0 && !this.allowRight()) || Math.abs(dy) >= Math.abs(dx)) {
        this.start = null;
        return;
      }
      this.swiping = true;
      this.element.setPointerCapture(event.pointerId);
    }
    // Stops at the action distance, so the end of what lies behind the element never shows.
    const furthestRight = this.allowRight() ? actionDistance : 0;
    this.moveTo(Math.max(-actionDistance, Math.min(furthestRight, dx)), false);
  }

  onPointerUp(event: PointerEvent) {
    const start = this.start;
    const swiping = this.swiping;
    this.start = null;
    this.swiping = false;
    if (!start || !swiping) return;

    this.ignoreClick = true;
    const dx = event.clientX - start.x;
    if (dx <= -actionDistance) {
      this.moveTo(-actionDistance, true);
      this.swipedLeft.emit();
    } else if (dx >= actionDistance && this.allowRight()) {
      this.moveTo(actionDistance, true);
      this.swipedRight.emit();
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
