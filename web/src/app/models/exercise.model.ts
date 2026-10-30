// Mirrors api/src/Starter.Core/Contracts/ExerciseContracts.cs

// A muscle, a piece of equipment or an exercise type.
export interface CatalogItem {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  name: string;
  description: string | null;
  // One step per line
  instructions: string | null;
  typeId: number | null;
  equipmentId: number | null;
  primaryMuscleIds: number[];
  secondaryMuscleIds: number[];
  // true for an exercise the signed-in user created
  isCustom: boolean;
}

export interface CreateExerciseRequest {
  name: string;
  description: string | null;
  instructions: string | null;
  typeId: number | null;
  equipmentId: number | null;
  primaryMuscleIds: number[];
  secondaryMuscleIds: number[];
}
