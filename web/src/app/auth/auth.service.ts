import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { map, Observable, of, Subject, switchMap } from "rxjs";
import { AuthData } from "./auth-data.model";
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "@angular/fire/auth";
import { TrainingService } from "../training/training.service";
import { AUTH_ERRORS_EN } from "./auth-error-messages";
import { UIService } from "./shared/ui";
import { User } from "./user.model";
import { doc, docData, Firestore, serverTimestamp, setDoc } from "@angular/fire/firestore";
import { Training } from "../training/training";

@Injectable({
    providedIn: 'root'
})

export class AuthService {

    user$;
    isAdmin$;
    isCoach$;
    userProfile$: Observable<User | null>;
    authChange = new Subject<boolean>();
    private isAuthenticated: boolean = false;


    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private router: Router,
        private trainingService: TrainingService,
        private uiService: UIService
    ) {
        this.user$ = authState(this.auth);

        this.userProfile$ = this.user$.pipe(switchMap(
            (user: User) => {
                if (!user) {
                    return of(null);
                } else {
                    return docData(
                        doc(this.firestore, 'userCollection', user.userId), { idField: 'userId' }
                    ) as Observable<User>;
                }
            }
        ))

        this.isAdmin$ = this.userProfile$.pipe(
            map(user => user?.role === 'admin')
        )

        this.isCoach$ = this.userProfile$.pipe(
            map(user => user?.role === 'coach')
        )
    }

    initAuthListener() {
        authState(this.auth).subscribe(user => {
            if (user) {
                this.isAuthenticated = true;
                this.authChange.next(true);
                this.router.navigate(['/training']);
            } else {
                this.trainingService.cancelSubscriptions();
                this.authChange.next(false);
                this.router.navigate(['/login']);
                this.isAuthenticated = false;
            }
        });
    }

    async register(authData: AuthData) { //displayName
        const credentials = await createUserWithEmailAndPassword(
            this.auth, authData.email, authData.password
        );

        const userProfile: User = {
            userId: credentials.user.uid,
            email: authData.email,
            //displayName,
            role: 'user',
            active: true,
            createdAt: serverTimestamp()
        }

        await setDoc(
            doc(
                this.firestore, 'userCollection', credentials.user.uid
            ),
            userProfile
        ).then(result => {
            this.uiService.loadingStateChanged.next(false);
        })
            .catch(error => {
                this.uiService.loadingStateChanged.next(false);
                this.uiService.showSnackbar(this.getAuthErrorMessage(error.code), null, 3000)
                this.authChange.next(false);
                this.router.navigate(['/login']);
                this.isAuthenticated = false;
            })
    }

    login(authData: AuthData) {
        return signInWithEmailAndPassword(this.auth, authData.email, authData.password);
    }

    logout() {
        signOut(this.auth);
    }

    getAuthErrorMessage(errorCode: string): string {
        return AUTH_ERRORS_EN[errorCode] || 'An unknown error occurred. Please try again.';
    }

}

// authChange = new Subject<boolean>();
// private isAuthenticated: boolean = false;

// constructor(
//     private router: Router,
//     private auth: Auth,
//     private trainingService: TrainingService,
//     private uiService: UIService
// ) { }

// initAuthListener() {
//     authState(this.auth).subscribe(user => {
//         if (user) {
//             this.isAuthenticated = true;
//             this.authChange.next(true);
//             this.router.navigate(['/training']);
//         } else {
//             this.trainingService.cancelSubscriptions();
//             this.authChange.next(false);
//             this.router.navigate(['/login']);
//             this.isAuthenticated = false;
//         }
//     });
// }

// getAuthErrorMessage(errorCode: string): string {
//     return AUTH_ERRORS_EN[errorCode] || 'An unknown error occurred. Please try again.';
// }

// registerUser(authData: AuthData) {
//     this.uiService.loadingStateChanged.next(true);
//     createUserWithEmailAndPassword(this.auth, authData.email, authData.password)
//         .then(result => {
//             this.uiService.loadingStateChanged.next(false);
//         })
//         .catch(error => {
//             this.uiService.loadingStateChanged.next(false);
//             this.uiService.showSnackbar(this.getAuthErrorMessage(error.code), null, 3000)
//         })
// }

// login(authData: AuthData) {
//     this.uiService.loadingStateChanged.next(true);
//     signInWithEmailAndPassword(this.auth, authData.email, authData.password)
//         .then(result => {
//             this.uiService.loadingStateChanged.next(false);
//         })
//         .catch(error => {
//             this.uiService.loadingStateChanged.next(false);
//             this.uiService.showSnackbar(this.getAuthErrorMessage(error.code), null, 3000)
//         })
// }

// logout() {
//     signOut(this.auth);
// }

// isAuth() {
//     return this.isAuthenticated;
// }