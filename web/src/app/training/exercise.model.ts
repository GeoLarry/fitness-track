export interface Workout {
    id: string;
    name: string;
    duration: number;
    excerciseIds?: string[];
}

export interface Exercise {
    id: string;
    name: string;
    description?: string;
    instructions?: string;
    type?: ExerciseType;
    variableIds?: string[];
    primaryMuscleIds?: string[];
    secondaryMuscleIds?: string[];
    isCustom?: boolean;
    images?: string[];
    date?: Date;
    equipmentId?: string;
    duration?: number;
    calories?: number;
    state?: 'completed' | 'cancelled' | null;
}

export interface ExerciseType {
    id: string;
    name: string;
}

export interface ExerciseVariables {
    id: string;
    name: string;
    extraIds?: string[];
}

export interface Extras {
    id: string;
    name: string;
}

export interface Muscle {
    id: string;
    name: string;
}

export interface Equipment {
    id: string;
    name: string;
}