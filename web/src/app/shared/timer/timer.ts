import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

// Rest timer: counts down from a time the user can edit (tap the time), then buzzes.
@Component({
  selector: 'app-timer',
  imports: [MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './timer.html',
  styleUrl: './timer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Timer {
  readonly minutes = signal(0);
  readonly seconds = signal(30);

  readonly remaining = signal(30);
  readonly isRunning = signal(false);
  readonly editing = signal(false);

  private interval?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Format to mm:ss */
  format(sec: number): string {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  enableEdit() {
    this.editing.set(true);
  }

  // Seconds above 59 carry over into minutes; negative or empty values count as 0.
  saveEdit() {
    this.remaining.set(this.startTime());
    this.minutes.set(Math.floor(this.remaining() / 60));
    this.seconds.set(this.remaining() % 60);
    this.editing.set(false);
  }

  toggleTimer() {
    if (this.isRunning()) {
      this.stop();
      return;
    }

    this.isRunning.set(true);
    this.interval = setInterval(() => {
      if (this.remaining() > 0) {
        this.remaining.update(r => r - 1);
      } else {
        this.stop();
        navigator.vibrate?.(200);
      }
    }, 1000);
  }

  reset() {
    this.stop();
    this.remaining.set(this.startTime());
  }

  private startTime(): number {
    const whole = (value: number) => Math.max(0, Math.floor(Number(value) || 0));
    return whole(this.minutes()) * 60 + whole(this.seconds());
  }

  private stop() {
    clearInterval(this.interval);
    this.interval = undefined;
    this.isRunning.set(false);
  }
}
