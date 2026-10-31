import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ExerciseCatalogService } from '../../workout/exercise-catalog.service';
import { Exercise } from '../../models/exercise.model';

// Full-screen details of one exercise: equipment, muscles worked and the steps.
@Component({
  selector: 'app-exercise-info-dialog',
  templateUrl: './exercise-info.html',
  styleUrls: ['./exercise-info.css'],
  imports: [MatCardModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseInfoDialog {
  private catalog = inject(ExerciseCatalogService);
  private dialogRef = inject<MatDialogRef<ExerciseInfoDialog>>(MatDialogRef);
  readonly data = inject<Exercise>(MAT_DIALOG_DATA);

  readonly primaryMuscles = computed(() => this.catalog.muscleNames(this.data.primaryMuscleIds));
  readonly secondaryMuscles = computed(() => this.catalog.muscleNames(this.data.secondaryMuscleIds));
  readonly equipment = computed(() => this.catalog.equipment.value().find(e => e.id === this.data.equipmentId)?.name ?? null);

  // Stored one step per line, possibly numbered ("1. ...").
  readonly instructions = (this.data.instructions ?? '')
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  close() {
    this.dialogRef.close();
  }
}
