import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface SubjectResponseDTO {
  id: number;
  title: string;

  // backend might send one of these:
  year?: number;
  academicYear?: string;
  academic_year?: string;

  description?: string;
  professorId?: number;

  // sometimes backend enriches:
  professorName?: string;
  professor_name?: string;
}

export interface SubjectRequestDTO {
  title: string;
  academicYear?: string;
  description?: string;
  professorId: number;
}

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  constructor(private api: ApiService) {}

  // ✅ normalize subjects so Student/Professor templates can rely on academic_year
  async getAll(): Promise<SubjectResponseDTO[]> {
    const list = await firstValueFrom(this.api.get<any[]>('api/subjects'));
    return (list || []).map((s: any) => {
      const yearNum =
        typeof s.year === 'number' ? s.year :
        typeof s.academicYear === 'number' ? s.academicYear :
        undefined;

      const academicYearStr =
        (typeof s.academicYear === 'string' && s.academicYear.trim()) ? s.academicYear :
        (typeof s.academic_year === 'string' && s.academic_year.trim()) ? s.academic_year :
        (yearNum != null ? String(yearNum) : '');

      return {
        ...s,
        year: s.year ?? yearNum,
        academicYear: academicYearStr || s.academicYear,
        academic_year: academicYearStr || s.academic_year
      } as SubjectResponseDTO;
    });
  }

  // ✅ send both shapes (year + academicYear + PascalCase) so backend binding succeeds
  async create(body: SubjectRequestDTO): Promise<void> {
    const yearNum = Number(body.academicYear);
    const payload: any = {
      // common camelCase
      title: body.title,
      description: body.description,
      professorId: body.professorId,

      // year-based
      year: Number.isFinite(yearNum) ? yearNum : undefined,

      // string year-based
      academicYear: body.academicYear ?? '',
      academic_year: body.academicYear ?? '',

      // PascalCase duplicates (resilient for .NET DTO binding)
      Title: body.title,
      Description: body.description,
      ProfessorId: body.professorId,
      Year: Number.isFinite(yearNum) ? yearNum : undefined,
      AcademicYear: body.academicYear ?? ''
    };

    await firstValueFrom(this.api.post<void>('api/subjects', payload));
  }

  async delete(id: number): Promise<void> {
    await firstValueFrom(this.api.delete(`api/subjects/${id}`));
  }
}