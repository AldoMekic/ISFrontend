import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type HttpOptions = {
  headers?:
    | HttpHeaders
    | { [header: string]: string | string[] };
  params?:
    | HttpParams
    | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  context?: HttpContext;
  reportProgress?: boolean;
  // IMPORTANT: keep observe typed (body only)
  observe?: 'body';
  responseType?: 'json';
  withCredentials?: boolean;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly base = environment.apiBaseUrl.replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  private url(path: string) {
    return `${this.base}/${path.replace(/^\/+/, '')}`;
  }

  get<T>(path: string, options: HttpOptions = {}): Observable<T> {
    return this.http.get<T>(this.url(path), { ...options, observe: 'body', responseType: 'json' });
  }

  post<T>(path: string, body: any, options: HttpOptions = {}): Observable<T> {
    return this.http.post<T>(this.url(path), body, { ...options, observe: 'body', responseType: 'json' });
  }

  put<T>(path: string, body: any, options: HttpOptions = {}): Observable<T> {
    return this.http.put<T>(this.url(path), body, { ...options, observe: 'body', responseType: 'json' });
  }

  delete<T>(path: string, options: HttpOptions = {}): Observable<T> {
    return this.http.delete<T>(this.url(path), { ...options, observe: 'body', responseType: 'json' });
  }
}
