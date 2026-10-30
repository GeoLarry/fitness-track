import { BehaviorSubject } from "rxjs";
import { Injectable, inject } from "@angular/core";
import { Equipment, Exercise, Muscle } from "./exercise.model";
import { Firestore, collection, collectionData, addDoc } from "@angular/fire/firestore";

// The exercise catalog: exercises, muscles and equipment, read from Firestore.
@Injectable({
    providedIn: 'root'
})
export class TrainingService {
    private firestore = inject(Firestore);

    private loadingSubject = new BehaviorSubject<boolean>(false);
    loadingState$ = this.loadingSubject.asObservable();

    private exercisesSubject = new BehaviorSubject<Exercise[]>([]);
    exercises$ = this.exercisesSubject.asObservable();

    private musclesSubject = new BehaviorSubject<Muscle[]>([]);
    muscles$ = this.musclesSubject.asObservable();

    private equipmentSubject = new BehaviorSubject<Equipment[]>([]);
    equipment$ = this.equipmentSubject.asObservable();

    fetchExercises() {
        this.loadingSubject.next(true);
        const ref = collection(this.firestore, 'exerciseCollection');
        return collectionData(ref, { idField: 'id' })
            .subscribe({
                next: (exercises) => {
                    this.exercisesSubject.next(exercises as Exercise[]);
                    this.loadingSubject.next(false);
                },
                error: (err) => {
                    console.error(err);
                    this.loadingSubject.next(false);
                }
            })
    }

    fetchMuscles() {
        this.loadingSubject.next(true);
        return collectionData(
            collection(this.firestore, 'MuscleCollection'),
            { idField: 'id' }
        )
            .subscribe({
                next: (muscles) => {
                    this.musclesSubject.next(muscles as Muscle[]);
                    this.loadingSubject.next(false);
                }, error: (err) => {
                    console.error(err);
                    this.loadingSubject.next(false);
                }
            });
    }

    fetchEquipment() {
        this.loadingSubject.next(true);
        return collectionData(
            collection(this.firestore, 'EquipmentCollection'),
            { idField: 'id' }
        )
            .subscribe({
                next: (equipment) => {
                    this.equipmentSubject.next(equipment as Equipment[]);
                    this.loadingSubject.next(false);
                }, error: (err) => {
                    console.error(err);
                    this.loadingSubject.next(false);
                }
            })
    }

    async addExercise(exercise: Exercise) {
        const ref = collection(this.firestore, 'exerciseCollection');
        await addDoc(ref, {
            ...exercise,
            date: new Date()
        });
    }
}
