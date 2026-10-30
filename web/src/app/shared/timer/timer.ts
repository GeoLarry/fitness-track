import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timer',
  imports: [MaterialModule, FormsModule],
  templateUrl: './timer.html',
  styleUrl: './timer.css',
})
export class Timer implements OnDestroy {
  initialMinutes = 0;
  initialSeconds = 30;

  remaining = 30; // in seconds
  interval: any;
  isRunning = false;
  editing = false; // edit mode for min/sec

  constructor(private cd: ChangeDetectorRef) { }

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
