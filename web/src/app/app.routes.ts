import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

//Components
import { Welcome } from './welcome/welcome';
import { Signup } from './auth/signup/signup';
import { Login } from './auth/login/login';
import { Workout } from './workout/workout';
import { CurrentWorkout } from './workout/current-workout/current-workout';
import { PlannedWorkouts } from './workout/planned-workouts/planned-workouts';
import { CompletedWorkouts } from './workout/completed-workouts/completed-workouts';

export const routes: Routes = [
    { path: '', component: Welcome, canActivate: [AuthGuard] },
    { path: 'signup', component: Signup },
    { path: 'login', component: Login },
    { path: 'training', component: Workout, canActivate: [AuthGuard] },
    { path: 'current-workout', component: CurrentWorkout, canActivate: [AuthGuard] },
    { path: 'planned-workout', component: PlannedWorkouts, canActivate: [AuthGuard] },
    { path: 'completed-workout', component: CompletedWorkouts, canActivate: [AuthGuard] }
];
