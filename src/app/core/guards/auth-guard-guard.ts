import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem("access_token") || null;
  if(!token){
    router.navigate(["/auth/login"]);
    return false;
  }
  return true;
};
