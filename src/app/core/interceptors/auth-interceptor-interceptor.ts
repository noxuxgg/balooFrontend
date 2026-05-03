import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export const authInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  console.log("********* AUTHINTERCEPTOR ACTIVADO **********");
  const token = localStorage.getItem("access_token");
  const router = inject(Router)
  const peticion = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  })

  return next(peticion).pipe(tap(() => {},
    (error: any) =>{
      if(error instanceof HttpErrorResponse){
        if(error.status !== 401){
          return;
        }
        localStorage.removeItem("access_token");
        router.navigate(["/auth/login"]);
      }
    }
))
  return next(req);
};
