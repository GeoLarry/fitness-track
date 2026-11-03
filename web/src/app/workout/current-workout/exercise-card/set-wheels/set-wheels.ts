import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { WheelPicker } from '../../../../shared/wheel-picker/wheel-picker';

export interface SetWheelsData {
  exerciseName: string;
  setLabel: string;
  weight: number;
  reps: number;
}

export interface SetWheelsResult {
  weight: number;
  reps: number;
}

const maxWeight = 500;
const maxReps = 100;
const weightSteps = [0, 25, 50, 75];

// A weight as whole kilos and hundredths, which add up without rounding errors.
export function splitWeight(weight: number): { whole: number; hundredths: number } {
  const total = Math.round((Number(weight) || 0) * 100);
  return { whole: Math.floor(total / 100), hundredths: total % 100 };
}

export const joinWeight = (whole: number, hundredths: number) => (whole * 100 + hundredths) / 100;

// e.g. 50 is ".5" and 5 is ".05".
export const hundredthsLabel = (hundredths: number) =>
  `.${hundredths.toString().padStart(2, '0').replace(/(?<=\d)0$/, '')}`;

// A saved value outside the usual range joins the list, so opening the wheels never changes it.
function withValue(values: number[], value: number): number[] {
  return values.includes(value) ? values : [...values, value].sort((a, b) => a - b);
}

const upTo = (max: number) => Array.from({ length: max + 1 }, (_, i) => i);

// Weight and reps of one set, picked on wheels.
@Component({
  selector: 'app-set-wheels',
  imports: [MatButtonModule, WheelPicker],
  templateUrl: './set-wheels.html',
  styleUrl: './set-wheels.css',
})
export class SetWheels {
  private sheet = inject<MatBottomSheetRef<SetWheels, SetWheelsResult>>(MatBottomSheetRef);
  readonly data = inject<SetWheelsData>(MAT_BOTTOM_SHEET_DATA);

  private readonly start = splitWeight(this.data.weight);
  private readonly startReps = Math.max(0, Math.floor(Number(this.data.reps) || 0));

  private readonly wholes = withValue(upTo(maxWeight), this.start.whole);
  private readonly steps = withValue(weightSteps, this.start.hundredths);
  private readonly repsOptions = withValue(upTo(maxReps), this.startReps);

  readonly wholeLabels = this.wholes.map(String);
  readonly stepLabels = this.steps.map(hundredthsLabel);
  readonly repsLabels = this.repsOptions.map(String);

  readonly wholeIndex = signal(this.wholes.indexOf(this.start.whole));
  readonly stepIndex = signal(this.steps.indexOf(this.start.hundredths));
  readonly repsIndex = signal(this.repsOptions.indexOf(this.startReps));

  readonly result = computed((): SetWheelsResult => ({
    weight: joinWeight(this.wholes[this.wholeIndex()], this.steps[this.stepIndex()]),
    reps: this.repsOptions[this.repsIndex()],
  }));

  cancel() {
    this.sheet.dismiss();
  }

  done() {
    this.sheet.dismiss(this.result());
  }
}
