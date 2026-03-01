import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface StudentResponseDTO {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  studentNumber?: string;
  student_number?: string;
}

export interface SubjectResponseDTO {
  id: number;
  title: string;
  academicYear?: string;
  academic_year?: string;
  description?: string;
}

export interface GradeResponseDTO {
  id: number;
  studentId?: number;
  subjectId?: number;
  professorId?: number;
  gradeValue?: number;
  finalScore?: number;
  subjectName?: string;
  subject_name?: string;
  professorName?: string;
  professor_name?: string;
  assignedDate?: string;
  assigned_date?: string;
  annulment_requested?: boolean;
}

const unwrap = <T>(obs: any): Promise<T> => firstValueFrom(obs);

@Injectable({ providedIn: 'root' })
export class StudentsService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<StudentResponseDTO[]> {
    return await unwrap<StudentResponseDTO[]>(this.api.get<StudentResponseDTO[]>('api/students'));
  }

  async getById(id: number): Promise<StudentResponseDTO> {
    return await unwrap<StudentResponseDTO>(this.api.get<StudentResponseDTO>(`api/students/${id}`));
  }

  async getStudentSubjects(studentId: number): Promise<SubjectResponseDTO[]> {
    return await unwrap<SubjectResponseDTO[]>(
      this.api.get<SubjectResponseDTO[]>(`api/students/${studentId}/subjects`)
    );
  }

  async getStudentGrades(studentId: number): Promise<GradeResponseDTO[]> {
    return await unwrap<GradeResponseDTO[]>(
      this.api.get<GradeResponseDTO[]>(`api/students/${studentId}/grades`)
    );
  }

  async addSubjectToStudent(studentId: number, subjectId: number): Promise<void> {
    await unwrap<void>(this.api.post<void>(`api/students/${studentId}/subjects/${subjectId}`, {}));
  }

  async removeStudentSubject(studentId: number, subjectId: number): Promise<void> {
    await unwrap<void>(this.api.delete<void>(`api/students/${studentId}/subjects/${subjectId}`));
  }

  // ✅ now matches the same unwrap style
  async getMe(): Promise<StudentResponseDTO> {
    return await unwrap<StudentResponseDTO>(this.api.get<StudentResponseDTO>('api/students/me'));
  }
}
