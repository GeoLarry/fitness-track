import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData } from '@angular/fire/firestore';
import { Observable, Subject } from 'rxjs';
import { Exercise } from './exercise.model';

@Injectable({ providedIn: 'root' })
export class FirebaseService {

    exerciseChanged = new Subject<Exercise>();
    private runningExercise: Exercise;
    exercises: Exercise[] = [];

    constructor(private firestore: Firestore) { }

    fetchExercises(): Observable<any[]> {
        const ref = collection(this.firestore, 'availiableExercises');
        return collectionData(ref, { idField: 'id' });
    }
    private addDataToDB(exercise: Exercise) {
        const collRef = collection(this.firestore, 'finishedExercises');
        return addDoc(collRef, exercise);
    }
    
    completeExercise() {
        this.addDataToDB({
            ...this.runningExercise,
            date: new Date(),
            state: 'completed'
        });
        this.runningExercise = null;
        this.exerciseChanged.next(null);
    }

    cancelExercise(progress: number) {
        this.addDataToDB({
            ...this.runningExercise,
            duration: this.runningExercise.duration * (progress / 100),
            calories: this.runningExercise.calories * (progress / 100),
            date: new Date(),
            state: 'cancelled'
        });
        this.runningExercise = null;
        this.exerciseChanged.next(null);
    }

    getRunningExercise() {
        return { ...this.runningExercise };
    }

    getCompletedOrCancelledExercises() {
        return this.exercises.slice();
    }

}