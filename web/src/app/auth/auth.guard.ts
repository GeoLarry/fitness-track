import { Injectable, inject } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { map, take } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate() {

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