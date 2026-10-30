import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ExerciseCatalogService } from '../../../exercise-catalog.service';
import { Exercise } from '../../../../models/exercise.model';
import { apiErrorMessage } from '../../../../shared/http/api-error';

// Creates a custom exercise for the signed-in user and closes with it once saved.
@Component({
  selector: 'app-custom-exercise-dialog',
  imports: [MatExpansionModule, MatFormFieldModule, MatInputModule, MatListModule, MatSelectModule, MatButtonModule, FormsModule],
  templateUrl: './custom-exercise-dialog.html',
  styleUrl: './custom-exercise-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomExerciseDialog {
  private dialogRef = inject<MatDialogRef<CustomExerciseDialog, Exercise>>(MatDialogRef);
  private catalog = inject(ExerciseCatalogService);

  readonly muscles = this.catalog.muscles.value;
  readonly equipment = this.catalog.equipment.value;

  readonly name = signal('');
  readonly description = signal('');
  readonly instructions = signal('');
  readonly equipmentId = signal<number | null>(null);
  readonly primaryMuscleIds = signal<number[]>([]);
  readonly secondaryMuscleIds = signal<number[]>([]);

  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  // Enter starts a new numbered step instead of a plain line break.
  onEnter(event: Event) {
    event.preventDefault();
    const textarea = event.target as HTMLTextAreaElement;

    const steps = textarea.value
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(step => step !== '')
      .map((step, i) => `${i + 1}. ${step}`);

    this.instructions.set([...steps, `${steps.length + 1}. `].join('\n'));

    // Move the cursor to the end once the new value is rendered.
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    });
  }

  // A muscle is either primary or secondary: picking it in one list removes it from the other.
  toggleMuscle(kind: 'primary' | 'secondary', id: number) {
    const [list, other] = kind === 'primary'
      ? [this.primaryMuscleIds, this.secondaryMuscleIds]
      : [this.secondaryMuscleIds, this.primaryMuscleIds];

    list.update(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
    other.update(ids => ids.filter(i => i !== id));
  }

  async save() {
    if (!this.name().trim() || this.isSaving()) return;

    this.isSaving.set(true);
    this.error.set(null);
    try {
      const exercise = await this.catalog.createExercise({
        name: this.name().trim(),
        description: this.description().trim() || null,
        // Without the empty step a final Enter leaves behind.
        instructions: this.instructions().replace(/(^|\n)\d+\.\s*$/, '').trim() || null,
        typeId: null,
        equipmentId: this.equipmentId(),
        primaryMuscleIds: this.primaryMuscleIds(),
        secondaryMuscleIds: this.secondaryMuscleIds(),
      });
      this.dialogRef.close(exercise);
    } catch (error) {
      // e.g. "An exercise named 'Bench Press' already exists."
      this.error.set(apiErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
