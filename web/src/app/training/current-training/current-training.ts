import { ChangeDetectorRef, Component, NgZone, OnInit, EventEmitter, Output } from '@angular/core';
import { MaterialModule } from "../../material.module";
import { StopTraining } from './stop-training.component';
import { MatDialog } from '@angular/material/dialog';
import { TrainingService } from '../training.service';

@Component({
  selector: 'app-current-training',
  imports: [MaterialModule],
  templateUrl: './current-training.html',
  styleUrl: './current-training.css',
})
export class CurrentTraining implements OnInit {
  @Output() trainingExit = new EventEmitter();
  progress = 0;
  timer!: number | any;

  constructor(
    private trainingService: TrainingService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.startOrResume();
    }, 0);
  }

  startOrResume() {
    const step = this.trainingService.getRunningExercise().duration / 100 * 1000;
    this.timer = setInterval(() => {
      this.progress = this.progress + 1;
      this.cd.detectChanges();
      if (this.progress >= 100) {
        this.trainingService.completeExercise();
        clearInterval(this.timer);
        this.trainingExit.emit();
      }
    }, step);
  }

  onStop() {
    clearInterval(this.timer);
    const dialogRef = this.dialog.open(StopTraining, {
      data: {
        progress: this.progress
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        setTimeout(() => {
          this.trainingService.cancelExercise(this.progress);
        }, 0);
         this.trainingExit.emit();
      } else {
        this.startOrResume();
      }
    });
  }
}
