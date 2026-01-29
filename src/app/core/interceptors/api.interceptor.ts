import { HttpInterceptorFn } from '@angular/common/http';

// Point Angular requests to the local backend (proxied /api -> http://localhost:3000).
// Using a relative base keeps builds clean and works with the dev proxy.
const API_BASE = '/api';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiReq = req.clone({ url: `${API_BASE}${req.url}` });
  return next(apiReq);
};
