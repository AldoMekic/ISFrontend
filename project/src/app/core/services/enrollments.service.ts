import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface EnrollmentResponseDTO {
  id: number;
  studentId?: number;   // server might use studentId
  student_id?: number;  // or snake_case
  subjectId?: number;
  subject_id?: number;
  status?: 'attending' | 'completed' | 'dropped';
}

export interface EnrollmentRequestDTO {
  // adapt to your DTO
  studentId?: number;
  subjectId?: number;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  constructor(private api: ApiService) {}

  getAll() {
    return firstValueFrom(this.api.get<EnrollmentResponseDTO[]>('api/enrollments'));
  }

  getById(id: number) {
    return firstValueFrom(this.api.get<EnrollmentResponseDTO>(`api/enrollments/${id}`));
  }

  create(dto: EnrollmentRequestDTO) {
    return firstValueFrom(this.api.post('api/enrollments', dto));
  }

  delete(id: number) {
    return firstValueFrom(this.api.delete(`api/enrollments/${id}`));
  }

  drop(id: number) {
    return firstValueFrom(this.api.put<EnrollmentResponseDTO>(`api/enrollments/${id}/drop`, {}));
  }

  complete(id: number) {
    return firstValueFrom(this.api.put<EnrollmentResponseDTO>(`api/enrollments/${id}/complete`, {}));
  }
}
