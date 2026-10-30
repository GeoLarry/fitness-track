import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timer',
  imports: [MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './timer.html',
  styleUrl: './timer.css',
})
export class Timer implements OnDestroy {
  private cd = inject(ChangeDetectorRef);

  initialMinutes = 0;
  initialSeconds = 30;

  remaining = 30; // in seconds
  interval?: ReturnType<typeof setInterval>;
  isRunning = false;
  editing = false;

  /** Format to mm:ss */
  format(sec: number): string {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Enter edit mode */
  enableEdit() {
    this.editing = true;
  }

  /** Save edited time */
  saveEdit() {
    const total = this.initialMinutes * 60 + this.initialSeconds;
    this.remaining = total;
    this.editing = false;
  }

  toggleTimer() {
    this.isRunning = !this.isRunning;

    if (this.isRunning) {
      this.interval = setInterval(() => {
        if (this.remaining > 0) {
          this.remaining--;
          this.cd.detectChanges();
        } else {
          this.isRunning = false;
          clearInterval(this.interval);
          navigator.vibrate?.(200); // Optional haptic
        }
      }, 1000);
    } else {
      clearInterval(this.interval);
    }

  }

  reset() {
    this.remaining = this.initialMinutes * 60 + this.initialSeconds;
    this.isRunning = false;
    clearInterval(this.interval);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }
}
