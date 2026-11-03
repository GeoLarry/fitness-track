import { Component, ElementRef, afterNextRender, input, model, viewChild } from '@angular/core';

// Must match the row height in wheel-picker.css.
const rowHeight = 48;

// The row at a scroll position, within the list.
export function wheelIndexAt(scrollTop: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(scrollTop / rowHeight)));
}

// A vertical wheel of values: the one in the middle is selected. Scrolls by touch, mouse or the arrow keys.
@Component({
  selector: 'app-wheel-picker',
  templateUrl: './wheel-picker.html',
  styleUrl: './wheel-picker.css',
})
export class WheelPicker {
  readonly label = input.required<string>();
  readonly values = input.required<readonly string[]>();
  readonly index = model(0);

  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  constructor() {
    afterNextRender(() => this.scrollToIndex());
  }

  onScroll() {
    this.index.set(wheelIndexAt(this.list().nativeElement.scrollTop, this.values().length));
  }

  onKeydown(event: KeyboardEvent) {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;

    event.preventDefault();
    this.index.set(Math.max(0, Math.min(this.values().length - 1, this.index() + step)));
    this.scrollToIndex();
  }

  // Also when a scroll ends: a mouse wheel can stop between rows, where the snap does not always act.
  scrollToIndex() {
    this.list().nativeElement.scrollTop = this.index() * rowHeight;
  }
}
