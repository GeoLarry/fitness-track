import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../material.module';
import { FormsModule } from '@angular/forms';
import { Exercise, Muscle, Equipment } from '../../../../training/exercise.model';
import { TrainingService } from '../../../../training/training.service';
import { map, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-custom-exercise-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule, AsyncPipe],
  templateUrl: './custom-exercise-dialog.html',
  styleUrl: './custom-exercise-dialog.css',
})
export class CustomExerciseDialog {

  muscles$!: Observable<Muscle[]>;
  equipment$!: Observable<Equipment[]>;

  //private subscriptions: Subscription[] = [];

  exercise: Exercise = {
    id: crypto.randomUUID(),   // ✔ temporary ID (Firebase will override)
    name: '',
    description: '',
    instructions: '',
    primaryMuscleIds: [],
    secondaryMuscleIds: [],
    equipmentId: '',
    isCustom: false,
    images: []
    //date: new Date()
    //variableIds?: string[],
    //state: null,
    //type: null,
    //duration?: number,
    //calories?: number,
  };

  constructor(
    private dialogRef: MatDialogRef<CustomExerciseDialog>,
    private trainingService: TrainingService
  ) {
    this.muscles$ = this.trainingService.muscles$.pipe(
      map(muscles => [...muscles].sort((a, b) => a.name.localeCompare(b.name)))
    );
    this.equipment$ = this.trainingService.equipment$;

    this.trainingService.equipment$.pipe(
      map(equipment => [...equipment].sort((a, b) => a.name.localeCompare(b.name)))
    )

    this.trainingService.fetchMuscles();
    this.trainingService.fetchEquipment();
  }

  onEnter(event: any) {
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
    i === -1 ? list.push(id) : list.splice(i, 1);
  }

  async save() {
    console.log('custom exercise: ', this.exercise)
    // if (!this.exercise.name || this.isSaving) return;

    // this.isSaving = true;
    await this.trainingService.addExercise(this.exercise);
    this.dialogRef.close(this.exercise);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}