import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";
import { map, take } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        const isAuth = this.authService.user$.pipe(
            take(1),
            map(user => {
                if (user) return true;
                return false;
            })
        );
        
        if (isAuth) {
            return true;
        } else {
            this.router.navigate(['/login']);
            return false;
        }
    }
}
// if (this.authService.isAuth()) {
//     return true;
// } else {
//     this.router.navigate(['/login']);
//     return false;
// }