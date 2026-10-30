import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Exercise, Muscle, Equipment } from '../../../exercise.model';
import { TrainingService } from '../../../training.service';
import { map, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-custom-exercise-dialog',
  standalone: true,
  imports: [MatExpansionModule, MatFormFieldModule, MatInputModule, MatListModule, MatSelectModule, MatButtonModule, FormsModule, AsyncPipe],
  templateUrl: './custom-exercise-dialog.html',
  styleUrl: './custom-exercise-dialog.css',
})
export class CustomExerciseDialog {
  private dialogRef = inject<MatDialogRef<CustomExerciseDialog>>(MatDialogRef);
  private trainingService = inject(TrainingService);

  muscles$!: Observable<Muscle[]>;
  equipment$!: Observable<Equipment[]>;

  exercise: Exercise = {
    id: crypto.randomUUID(),   // temporary id, replaced when the exercise is saved
    name: '',
    description: '',
    instructions: '',
    primaryMuscleIds: [],
    secondaryMuscleIds: [],
    equipmentId: '',
    isCustom: false,
    images: []
  };

  constructor() {
    this.muscles$ = this.trainingService.muscles$.pipe(
      map(muscles => [...muscles].sort((a, b) => a.name.localeCompare(b.name)))
    );
    this.equipment$ = this.trainingService.equipment$.pipe(
      map(equipment => [...equipment].sort((a, b) => a.name.localeCompare(b.name)))
    );

    this.trainingService.fetchMuscles();
    this.trainingService.fetchEquipment();
  }

  onEnter(event: Event) {
    event.preventDefault();

    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;

    const lines = value.split('\n').filter(l => l.trim() !== '');

    const numbered = lines.map((line, i) => {
      // Remove existing numbering if user edits
      const clean = line.replace(/^\d+\.\s*/, '');
      return `${i + 1}. ${clean}`;
    });

    this.exercise.instructions = numbered.join('\n');

    // Move cursor to end
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    });
  }

  toggle(list: string[], id: string) {
    const i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);
  }

  async save() {
    await this.trainingService.addExercise(this.exercise);
    this.dialogRef.close(this.exercise);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}