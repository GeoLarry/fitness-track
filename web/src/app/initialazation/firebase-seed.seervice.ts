import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { ExerciseTypeCollection } from './seed-data';

@Injectable({ providedIn: 'root' })
export class FirebaseSeedService {

    constructor(private firestore: Firestore) { }

    async seed() {
        const items = ExerciseTypeCollection;

        for (const item of items) {
            const docRef = await addDoc(collection(this.firestore, 'ExerciseTypeCollection'), item);
            console.log('Created item with auto ID:', docRef.id);
        }

        console.log('Seeding finished');
    }
}