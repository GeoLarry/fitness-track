import { CanDeactivateFn } from '@angular/router';
import { CurrentWorkout } from './current-workout';

// Covers every way out of the screen: the browser's back, a link and the side column.
export const unsavedChangesGuard: CanDeactivateFn<CurrentWorkout> = workout => workout.canLeave();
