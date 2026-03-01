import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token');
  console.log('[authInterceptor] token present?', !!token, 'starts:', token?.slice(0, 15));
  if (!token) return next(req);

  const authHeader = token ? `Bearer ${token}` : null;
  console.log('[authInterceptor] authHeader starts:', authHeader?.slice(0, 25));

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  console.log('[authInterceptor] added Authorization?', authReq.headers.has('Authorization'));
  return next(authReq);
};