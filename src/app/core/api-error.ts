import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = error.error?.message;
      if (error.status === 0 || error.status === 504)
        message = 'Cannot reach the server. Check your connection and try again.';
      if (!message)
        message =
          error.status === 404
            ? 'This record could not be found.'
            : 'Something went wrong. Please try again.';
      return throwError(() => new Error(message));
    }),
  );
