import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { map, Observable, of, Subject, switchMap } from "rxjs";
import { AuthData } from "./auth-data.model";
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "@angular/fire/auth";
import { AUTH_ERRORS_EN } from "./auth-error-messages";
import { UIService } from "./shared/ui";
import { User } from "./user.model";
import { doc, docData, Firestore, serverTimestamp, setDoc } from "@angular/fire/firestore";

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);
    private uiService = inject(UIService);

    user$;
    isAdmin$;
    isCoach$;
    userProfile$: Observable<User | null>;
    authChange = new Subject<boolean>();
    private isAuthenticated = false;


    constructor() {
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
                this.authChange.next(false);
                this.router.navigate(['/login']);
                this.isAuthenticated = false;
            }
        });
    }

    async register(authData: AuthData) {
        const credentials = await createUserWithEmailAndPassword(
            this.auth, authData.email, authData.password
        );

        const userProfile: User = {
            userId: credentials.user.uid,
            email: authData.email,
            role: 'user',
            active: true,
            createdAt: serverTimestamp()
        }

        await setDoc(
            doc(
                this.firestore, 'userCollection', credentials.user.uid
            ),
            userProfile
        ).then(() => {
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
