import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface DepartmentResponseDTO {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface DepartmentRequestDTO {
  name: string;
  code: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentsService {

  constructor(private api: ApiService) {}

  async getAll(): Promise<DepartmentResponseDTO[]> {
    return await firstValueFrom(
      this.api.get<DepartmentResponseDTO[]>('api/departments')
    );
  }

  async create(body: Partial<DepartmentResponseDTO>): Promise<void> {
    await firstValueFrom(this.api.post<void>('api/departments', body));
  }

  async delete(id: number): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`api/departments/${id}`));
  }
}
