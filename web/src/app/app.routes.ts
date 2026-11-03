import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { guestGuard } from './shared/guards/guest.guard';

import { Welcome } from './welcome/welcome';
import { Signup } from './auth/signup/signup';
import { Login } from './auth/login/login';
import { Workout } from './workout/workout';
import { CurrentWorkout } from './workout/current-workout/current-workout';
import { unsavedChangesGuard } from './workout/current-workout/unsaved-changes.guard';
import { CompletedWorkouts } from './workout/completed-workouts/completed-workouts';
import { Profile } from './profile/profile';

export const routes: Routes = [
    { path: '', component: Welcome, canActivate: [authGuard] },
    { path: 'signup', component: Signup, canActivate: [guestGuard] },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'training', component: Workout, canActivate: [authGuard] },
    { path: 'current-workout', component: CurrentWorkout, canActivate: [authGuard], canDeactivate: [unsavedChangesGuard] },
    { path: 'history', component: CompletedWorkouts, canActivate: [authGuard] },
    { path: 'profile', component: Profile, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
