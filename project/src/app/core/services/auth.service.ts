import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface UserResponseDTO {
  id: number;
  username: string;
  email: string;
  isStudent: boolean;
  isProfessor: boolean;
}

export interface CurrentAuthState {
  token: string | null;
  username: string | null;
  email: string | null;
  is_student: boolean;
  is_professor: boolean;
  is_admin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStateSubject = new BehaviorSubject<CurrentAuthState>({
    token: localStorage.getItem('jwt_token'),
    username: localStorage.getItem('jwt_username'),
    email: localStorage.getItem('jwt_email'),
    is_student: localStorage.getItem('jwt_is_student') === 'true',
    is_professor: localStorage.getItem('jwt_is_professor') === 'true',
    is_admin: localStorage.getItem('jwt_is_admin') === 'true'
  });

  authState$ = this.authStateSubject.asObservable();

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  private decodeJwt(token: string): any {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }

  private pickClaim(payload: any, keys: string[]): string | null {
    for (const k of keys) {
      const v = payload?.[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return null;
  }

  private extractRoles(payload: any): string[] {
    const roleKeys = [
      'role',
      'roles',
      'Role',
      'Roles',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ];

    for (const k of roleKeys) {
      const v = payload?.[k];

      if (typeof v === 'string' && v.trim()) return [v];
      if (Array.isArray(v)) return v.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean);
    }

    return [];
  }

  private normalizeRole(r: string): 'student' | 'professor' | 'admin' | null {
    const v = String(r || '').toLowerCase();
    if (v.includes('student')) return 'student';
    if (v.includes('professor')) return 'professor';
    if (v.includes('admin')) return 'admin';
    return null;
  }

  private setAuthFromToken(token: string) {
    const payload = this.decodeJwt(token);
    console.log('[AuthService] jwt payload', payload);

    const username = this.pickClaim(payload, [
      'username',
      'sub',
      'unique_name',
      'name',
      'preferred_username',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ]);

    const email = this.pickClaim(payload, [
      'email',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
    ]);

    let is_student = String(payload?.is_student ?? payload?.isStudent ?? 'false') === 'true';
    let is_professor = String(payload?.is_professor ?? payload?.isProfessor ?? 'false') === 'true';
    let is_admin = String(payload?.is_admin ?? payload?.isAdmin ?? 'false') === 'true';

    if (!is_student && !is_professor && !is_admin) {
      const roles = this.extractRoles(payload)
        .map(r => this.normalizeRole(r))
        .filter((x): x is 'student' | 'professor' | 'admin' => !!x);

      is_student = roles.includes('student');
      is_professor = roles.includes('professor');
      is_admin = roles.includes('admin');
    }

    localStorage.setItem('jwt_token', token);
    localStorage.setItem('jwt_username', username ?? '');
    localStorage.setItem('jwt_email', email ?? '');
    localStorage.setItem('jwt_is_student', String(is_student));
    localStorage.setItem('jwt_is_professor', String(is_professor));
    localStorage.setItem('jwt_is_admin', String(is_admin));

    this.authStateSubject.next({ token, username, email, is_student, is_professor, is_admin });
  }

  isAuthenticated(): boolean {
    return !!this.authStateSubject.value.token;
  }

  hasRole(required: string[]): boolean {
    const s = this.authStateSubject.value;
    const roles: string[] = [];
    if (s.is_student) roles.push('student');
    if (s.is_professor) roles.push('professor');
    if (s.is_admin) roles.push('admin');
    return required.some(r => roles.includes(r));
  }

  getUserProfile() {
    const s = this.authStateSubject.value;
    if (!s.token) return null;
    return {
      id: s.username ?? '',
      email: s.email ?? '',
      role: s.is_student ? 'student' : (s.is_professor ? 'professor' : (s.is_admin ? 'admin' : 'student')),
      first_name: s.username ?? '',
      last_name: '',
      age: undefined
    };
  }

  // ✅ send both casing styles to match typical .NET DTO binding
  async registerUser(dto: {
    username: string;
    email: string;
    password: string;

    firstName?: string;
    lastName?: string;
    age?: number | null;

    departmentId?: number | null;
    yearOfStudy?: number | null; // student
    title?: string | null;       // professor

    isStudent?: boolean;
    isProfessor?: boolean;
  }) {
    const payload: any = {
      // PascalCase (common in .NET examples)
      Username: dto.username,
      Email: dto.email,
      Password: dto.password,
      FirstName: dto.firstName ?? null,
      LastName: dto.lastName ?? null,
      Age: dto.age ?? null,
      DepartmentId: dto.departmentId ?? null,
      YearOfStudy: dto.yearOfStudy ?? null,
      Title: dto.title ?? null,
      IsStudent: dto.isStudent ?? true,
      IsProfessor: dto.isProfessor ?? false,

      // camelCase (if backend uses default System.Text.Json policy)
      username: dto.username,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      age: dto.age ?? null,
      departmentId: dto.departmentId ?? null,
      yearOfStudy: dto.yearOfStudy ?? null,
      title: dto.title ?? null,
      isStudent: dto.isStudent ?? true,
      isProfessor: dto.isProfessor ?? false
    };

    return await this.api.post<any>('api/users/register', payload).toPromise();
  }

  async login(username: string, password: string) {
    const result = await firstValueFrom(
      this.api.post<{ token: string }>('api/users/login', { username, password })
    );

    if (!result?.token) throw new Error('Login failed');
    this.setAuthFromToken(result.token);

    const s = this.authStateSubject.value;
    if (s.is_admin) this.router.navigate(['/admin']);
    else if (s.is_professor) this.router.navigate(['/professor']);
    else if (s.is_student) this.router.navigate(['/student']);
    else this.router.navigate(['/home']);
  }

  async logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_username');
    localStorage.removeItem('jwt_email');
    localStorage.removeItem('jwt_is_student');
    localStorage.removeItem('jwt_is_professor');
    localStorage.removeItem('jwt_is_admin');

    this.authStateSubject.next({
      token: null, username: null, email: null,
      is_student: false, is_professor: false, is_admin: false
    });

    this.router.navigate(['/login']);
  }
}