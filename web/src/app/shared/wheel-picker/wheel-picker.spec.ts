import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WheelPicker, wheelIndexAt } from './wheel-picker';

describe('WheelPicker', () => {
  let fixture: ComponentFixture<WheelPicker>;
  let wheel: HTMLElement;

  const press = (key: string) => wheel.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(WheelPicker);
    fixture.componentRef.setInput('label', 'Reps');
    fixture.componentRef.setInput('values', ['0', '1', '2']);
    fixture.componentRef.setInput('index', 1);
    await fixture.whenStable();
    wheel = fixture.nativeElement.querySelector('.wheel');
  });

  it('marks the selected value and says it to screen readers', () => {
    expect(fixture.nativeElement.querySelector('.wheel-selected').textContent).toBe('1');
    expect(wheel.getAttribute('aria-label')).toBe('Reps');
    expect(wheel.getAttribute('aria-valuetext')).toBe('1');
  });

  it('moves with the arrow keys and stops at the ends', () => {
    press('ArrowDown');
    expect(fixture.componentInstance.index()).toBe(2);

    press('ArrowDown');
    expect(fixture.componentInstance.index()).toBe(2);

    press('ArrowUp');
    press('ArrowUp');
    press('ArrowUp');
    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('ignores other keys', () => {
    press('a');

    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('selects the value the scroll stopped at', () => {
    wheel.scrollTop = 96;
    wheel.dispatchEvent(new Event('scroll'));

    expect(fixture.componentInstance.index()).toBe(2);
  });

  it('settles on the selected row when a scroll ends', () => {
    wheel.scrollTop = 90;
    wheel.dispatchEvent(new Event('scroll'));
    wheel.dispatchEvent(new Event('scrollend'));

    expect(wheel.scrollTop).toBe(96);
  });

  it('finds the nearest row, within the list', () => {
    expect(wheelIndexAt(0, 3)).toBe(0);
    expect(wheelIndexAt(70, 3)).toBe(1);
    expect(wheelIndexAt(73, 3)).toBe(2);
    expect(wheelIndexAt(1000, 3)).toBe(2);
    expect(wheelIndexAt(-20, 3)).toBe(0);
  });
});
