import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './shared/http/auth.interceptor';
import { AuthService } from './shared/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // computed: a back press cancelled by a route guard leaves the browser history as it was.
    provideRouter(routes, withRouterConfig({ canceledNavigationResolution: 'computed' })),
    // Restore a stored session before the first route runs, so guards and the header know who is signed in
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ]
};
