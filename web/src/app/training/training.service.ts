import { BehaviorSubject, Observable, Subject, Subscription, take } from "rxjs";
import { DestroyRef, inject, Injectable } from "@angular/core";
import { Equipment, Exercise, Muscle } from "./exercise.model";
import { Firestore, collection, collectionData, addDoc, doc } from "@angular/fire/firestore";

@Injectable({
    providedIn: 'root'
})
export class TrainingService {

    //workout objects
    private availiableExercises: Exercise[] = [];
    private availiableMuscles: Muscle[] = [];
    private availiableEquipment: Equipment[] = [];

    //training objects
    fExercisesChanged = new Subject<Exercise[]>();
    exerciseChanged = new Subject<Exercise>();
    exercisesChanged = new Subject<Exercise[]>();
    private runningExercise: Exercise;
    private finishedExercises: Exercise[] = [];

    private fbSubscruptions: Subscription[] = [];

    // loadingState = new Subject<boolean>();
    // musclesChanged = new Subject<Muscle[]>();
    // equipmentChanged = new Subject<Equipment[]>();
    // private fetchAvailiableExercisesSubscruption: Subscription;
    // private destroyRef = inject(DestroyRef);

    /* ---------------- STATE ---------------- */

    private loadingSubject = new BehaviorSubject<boolean>(false);
    loadingState$ = this.loadingSubject.asObservable();

    private exercisesSubject = new BehaviorSubject<Exercise[]>([]);
    exercises$ = this.exercisesSubject.asObservable();

    private musclesSubject = new BehaviorSubject<Muscle[]>([]);
    muscles$ = this.musclesSubject.asObservable();

    private equipmentSubject = new BehaviorSubject<Equipment[]>([]);
    equipment$ = this.equipmentSubject.asObservable();

    private runningExerciseSubject = new BehaviorSubject<Exercise | null>(null);
    runningExercise$ = this.runningExerciseSubject.asObservable();

    constructor(private firestore: Firestore) { }

    /* Workout section */

    fetchExercises() {
        //console.log('FETCH START');
        this.loadingSubject.next(true);
        const ref = collection(this.firestore, 'exerciseCollection');
        return collectionData(ref, { idField: 'id' })
            .subscribe({
                next: (exercises) => {
                    //console.log('FETCH NEXT', exercises);
                    this.availiableExercises = exercises as Exercise[];
                    this.exercisesSubject.next([...this.availiableExercises]);
                    this.loadingSubject.next(false);
                },
                error: (err) => {
                    // console.error('FETCH ERROR', err);
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
                    this.availiableMuscles = muscles as Muscle[];
                    this.musclesSubject.next([...this.availiableMuscles]);
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
                    this.availiableEquipment = equipment as Equipment[];
                    this.equipmentSubject.next([...this.availiableEquipment]);
                    this.loadingSubject.next(false);
                }, error: (err) => {
                    console.log(err);
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

    /* Training section */
    private addDataToDB(exercise: Exercise) {
        const collRef = collection(this.firestore, 'finishedExercises');
        return addDoc(collRef, exercise);
    }

    startExercise(selectedId: string) {
        this.runningExercise = this.availiableExercises.find(exercise => exercise.id === selectedId);
        this.exerciseChanged.next({ ...this.runningExercise });
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

    fetchCompletedOrCancelledExercises() {
        const colRef = collection(this.firestore, 'finishedExercises')
        return this.fbSubscruptions.push(
            collectionData(colRef, { idField: 'id' })
                //.pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(finishedExercises => {
                    this.finishedExercises = [...finishedExercises] as Exercise[];
                    this.fExercisesChanged.next([...this.finishedExercises]);
                }))
    }

    cancelSubscriptions() {
        this.fbSubscruptions.forEach(sub => sub.unsubscribe());
    }
}