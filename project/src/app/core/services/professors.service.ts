import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface ProfessorResponseDTO {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentId?: number;

  // approval fields (if backend returns them)
  isApproved?: boolean;
  approvedAt?: string | null;
  approvedByAdminName?: string | null;

  // some backends nest "user"
  user?: any;
}

export interface SubjectResponseDTO {
  id: number;
  title: string;
  academicYear?: string;   // .NET might use this
  academic_year?: string;  // fallback for client display
  description?: string;
  totalClasses?: number;
  total_classes?: number;
  professorId?: number;
  year?: number;
}

@Injectable({ providedIn: 'root' })
export class ProfessorsService {
  constructor(private api: ApiService) {}

  getAll() {
    return firstValueFrom(this.api.get<ProfessorResponseDTO[]>('api/professors'));
  }

  getApproved() {
    return firstValueFrom(this.api.get<ProfessorResponseDTO[]>('api/professors/approved'));
  }

  getById(id: number) {
    return firstValueFrom(this.api.get<ProfessorResponseDTO>(`api/professors/${id}`));
  }

  // ✅ NEW: get the professor record for the currently logged-in user
  // Backend should implement GET /api/professors/me similar to /api/students/me
  getMe() {
    return firstValueFrom(this.api.get<ProfessorResponseDTO>('api/professors/me'));
  }

  // Subjects taught by a professor
  async getProfessorSubjects(professorId: number): Promise<SubjectResponseDTO[]> {
    const list = await firstValueFrom(
      this.api.get<any[]>(`api/professors/${professorId}/subjects`)
    );

    // normalize academic year fields for UI
    return (list || []).map((s: any) => {
      const yearNum =
        typeof s.year === 'number' ? s.year :
        undefined;

      const academicYearStr =
        (typeof s.academicYear === 'string' && s.academicYear.trim()) ? s.academicYear :
        (typeof s.academic_year === 'string' && s.academic_year.trim()) ? s.academic_year :
        (yearNum != null ? String(yearNum) : '');

      return {
        ...s,
        academicYear: academicYearStr || s.academicYear,
        academic_year: academicYearStr || s.academic_year,
        year: s.year ?? yearNum
      } as SubjectResponseDTO;
    });
  }

  removeProfessorSubject(professorId: number, subjectId: number) {
    return firstValueFrom(this.api.delete(`api/professors/${professorId}/subjects/${subjectId}`));
  }

  // ✅ NEW (used by Admin approvals if backend supports it)
  getPendingApprovals() {
    return firstValueFrom(this.api.get<any[]>('api/professors/pending'));
  }

  approveProfessor(professorId: number) {
    return firstValueFrom(this.api.post<void>(`api/professors/${professorId}/approve`, {}));
  }

  rejectProfessor(professorId: number) {
    return firstValueFrom(this.api.post<void>(`api/professors/${professorId}/reject`, {}));
  }
}