import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface CreateGradeRequest {
  // Align with your backend GradeRequestDTO
  enrollmentId: number;
  officialGrade: number;
  totalScore: number;
}

export interface GradeResponseDTO {
  id: number;
  enrollmentId: number;
  officialGrade: number;
  totalScore: number;
  assignedAt: string;

  subjectName?: string | null;
  studentName?: string | null;
  professorName?: string | null;

  annulmentRequested: boolean;
  annulmentRequestedAt?: string | null;
  canRequestAnnulment: boolean;
}

export interface GradeRequestDTO {
  // adapt to your backend DTO
}

@Injectable({ providedIn: 'root' })
export class GradesService {
  constructor(private api: ApiService) {}

  getAll() {
    return firstValueFrom(this.api.get<GradeResponseDTO[]>('api/grades'));
  }

  /** ✅ New: backend returns only grades for the logged-in student */
  getMyGrades() {
    return firstValueFrom(this.api.get<GradeResponseDTO[]>('api/grades/me'));
  }

  getById(id: number) {
    return firstValueFrom(this.api.get<GradeResponseDTO>(`api/grades/${id}`));
  }

  create(body: CreateGradeRequest) {
    return firstValueFrom(this.api.post<void>('api/grades', body));
  }

  delete(id: number) {
    return firstValueFrom(this.api.delete<void>(`api/grades/${id}`));
  }

  requestAnnulment(id: number) {
    return firstValueFrom(
      this.api.post<GradeResponseDTO>(`api/grades/${id}/request-annulment`, {})
    );
  }
}