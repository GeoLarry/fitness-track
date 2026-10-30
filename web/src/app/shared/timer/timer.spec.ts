import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Timer } from './timer';

describe('Timer', () => {
  let component: Timer;
  let fixture: ComponentFixture<Timer>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [Timer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Timer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('shows 30 seconds to start with', () => {
    expect(fixture.nativeElement.textContent).toContain('00:30');
  });

  it('counts down while running and stops at zero', () => {
    component.toggleTimer();
    vi.advanceTimersByTime(3000);
    expect(component.remaining()).toBe(27);

    vi.advanceTimersByTime(30000);
    expect(component.remaining()).toBe(0);
    expect(component.isRunning()).toBe(false);
  });

  it('pauses and resumes', () => {
    component.toggleTimer();
    vi.advanceTimersByTime(2000);
    component.toggleTimer();
    vi.advanceTimersByTime(5000);

    expect(component.remaining()).toBe(28);
    expect(component.isRunning()).toBe(false);
  });

  it('starts from an edited time, carrying extra seconds into minutes', () => {
    component.enableEdit();
    component.minutes.set(1);
    component.seconds.set(75);
    component.saveEdit();

    expect(component.remaining()).toBe(135);
    expect(component.minutes()).toBe(2);
    expect(component.seconds()).toBe(15);
    expect(component.editing()).toBe(false);
  });

  it('resets to the start time and stops', () => {
    component.toggleTimer();
    vi.advanceTimersByTime(10000);
    component.reset();

    expect(component.remaining()).toBe(30);
    expect(component.isRunning()).toBe(false);
  });

  it('stops ticking when destroyed', () => {
    component.toggleTimer();
    vi.advanceTimersByTime(1000);
    fixture.destroy();
    vi.advanceTimersByTime(5000);

    expect(component.remaining()).toBe(29);
    expect(component.isRunning()).toBe(false);
  });
});
