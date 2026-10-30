import { AfterViewInit, Component, OnDestroy, OnInit, viewChild, ViewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { MaterialModule } from "../../material.module";
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

import { Exercise } from '../exercise.model';
import { TrainingService } from '../training.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-past-trainings',
  imports: [MaterialModule, DatePipe, DecimalPipe],
  templateUrl: './past-trainings.html',
  styleUrl: './past-trainings.css',
})
export class PastTrainings implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  displayedColumns = ['date', 'name', 'calories', 'duration', 'state'];
  dataSource = new MatTableDataSource<Exercise>();
  private exChangedSubscription: Subscription;

  constructor(private trainingService: TrainingService) { }

  ngOnInit() {
    setTimeout(() => {
      this.exChangedSubscription = this.trainingService.fExercisesChanged.subscribe(finishedExercises => this.dataSource.data = finishedExercises)
      this.trainingService.fetchCompletedOrCancelledExercises();
    }, 0);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }, 0);

  }

  doFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    if (this.exChangedSubscription) {
      this.exChangedSubscription.unsubscribe();
    }
  }
}
