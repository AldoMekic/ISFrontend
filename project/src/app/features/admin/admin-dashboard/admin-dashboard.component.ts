import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DepartmentsService, DepartmentRequestDTO, DepartmentResponseDTO } from '../../../core/services/departments.service';
import { SubjectsService, SubjectRequestDTO, SubjectResponseDTO } from '../../../core/services/subjects.service';
import { ProfessorsService, ProfessorResponseDTO } from '../../../core/services/professors.service';

type PendingProfessorRow = {
  id: number;
  title?: string;
  department?: { name?: string } | null;
  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
    age?: number;
  };
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  adminName = '';

  pendingProfessors: PendingProfessorRow[] = [];
  approvedProfessors: ProfessorResponseDTO[] = [];

  departments: DepartmentResponseDTO[] = [];
  subjects: SubjectResponseDTO[] = [];
  loading = true;

  // ✅ default away from approvals so the UI still works even if approvals endpoint is missing
  activeTab: 'approvals' | 'departments' | 'subjects' = 'departments';

  showDepartmentModal = false;
  showSubjectModal = false;

  newDepartment: DepartmentRequestDTO = {
    name: '',
    code: '',
    description: ''
  };

  newSubject: SubjectRequestDTO = {
    title: '',
    academicYear: '',
    description: '',
    professorId: 0
  };

  constructor(
    public authService: AuthService,
    private departmentsService: DepartmentsService,
    private subjectsService: SubjectsService,
    private professorsService: ProfessorsService
  ) {}

  async ngOnInit() {
    const user = this.authService.getUserProfile();
    this.adminName = user?.first_name || 'Admin';
    await this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadDepartments(),
        this.loadSubjects(),
        this.loadApprovedProfessors(),
        this.loadPendingApprovals()
      ]);
    } finally {
      this.loading = false;
    }
  }

  async loadDepartments() {
    this.departments = await this.departmentsService.getAll();
  }

  async loadSubjects() {
    this.subjects = await this.subjectsService.getAll();
  }

  async loadApprovedProfessors() {
    try {
      this.approvedProfessors = await this.professorsService.getApproved();
    } catch (err) {
      console.error('[AdminDashboard] getApproved failed', err);
      this.approvedProfessors = [];
    }
  }

  private mapPendingProfessor(raw: any): PendingProfessorRow | null {
    const id = Number(raw?.id ?? raw?.professorId ?? raw?.professor_id);
    if (!Number.isFinite(id)) return null;

    const user = raw?.user ?? raw?.User ?? {};

    const first_name =
      user?.first_name ?? user?.firstName ?? raw?.first_name ?? raw?.firstName ?? '';
    const last_name =
      user?.last_name ?? user?.lastName ?? raw?.last_name ?? raw?.lastName ?? '';
    const email =
      user?.email ?? raw?.email ?? '';
    const age =
      user?.age ?? raw?.age ?? undefined;

    const dept = raw?.department ?? raw?.Department ?? null;
    const deptName = dept?.name ?? dept?.Name ?? raw?.departmentName ?? raw?.department_name ?? '';

    return {
      id,
      title: raw?.title ?? raw?.Title ?? '',
      department: deptName ? { name: deptName } : null,
      user: { first_name, last_name, email, age }
    };
  }

  async loadPendingApprovals() {
    // ✅ requires backend GET /api/professors/pending
    try {
      const list = await this.professorsService.getPendingApprovals();
      const mapped = (list || [])
        .map(x => this.mapPendingProfessor(x))
        .filter((x): x is PendingProfessorRow => !!x);

      this.pendingProfessors = mapped;

      // If there are pending items, keep approvals visible; otherwise keep departments as default
      if (this.pendingProfessors.length > 0 && this.activeTab === 'departments') {
        // do nothing (leave departments), user can switch
      }
    } catch (err) {
      console.error('[AdminDashboard] pending approvals endpoint missing or failed', err);
      this.pendingProfessors = [];
      // keep the rest of dashboard functional
    }
  }

  // Departments
  openDepartmentModal() {
    this.showDepartmentModal = true;
    this.newDepartment = { name: '', code: '', description: '' };
  }

  async createDepartment() {
    if (!this.newDepartment.name || !this.newDepartment.code) {
      alert('Please fill in all required fields');
      return;
    }
    await this.departmentsService.create(this.newDepartment);
    this.showDepartmentModal = false;
    await this.loadDepartments();
  }

  async deleteDepartment(id: number) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    await this.departmentsService.delete(id);
    await this.loadDepartments();
  }

  closeDepartmentModal() {
    this.showDepartmentModal = false;
  }

  // Subjects
  openSubjectModal() {
    this.showSubjectModal = true;
    this.newSubject = { title: '', academicYear: '', description: '', professorId: 0 };
  }

  async createSubject() {
    if (!this.newSubject.title) {
      alert('Please fill in the subject title');
      return;
    }
    if (!this.newSubject.professorId || this.newSubject.professorId <= 0) {
      alert('Please select a professor');
      return;
    }

    await this.subjectsService.create(this.newSubject);
    this.showSubjectModal = false;
    await this.loadSubjects();
  }

  async deleteSubject(id: number) {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    await this.subjectsService.delete(id);
    await this.loadSubjects();
  }

  closeSubjectModal() {
    this.showSubjectModal = false;
  }

  // ✅ Approvals (requires backend endpoints)
  async approveProfessor(professor: PendingProfessorRow) {
    try {
      await this.professorsService.approveProfessor(professor.id);
      this.pendingProfessors = this.pendingProfessors.filter(p => p.id !== professor.id);
      await this.loadApprovedProfessors();
      alert('Professor approved.');
    } catch (err) {
      console.error('[AdminDashboard] approveProfessor failed', err);
      alert('Approve failed. Backend endpoint POST /api/professors/{id}/approve is required.');
    }
  }

  async rejectProfessor(professor: PendingProfessorRow) {
    try {
      await this.professorsService.rejectProfessor(professor.id);
      this.pendingProfessors = this.pendingProfessors.filter(p => p.id !== professor.id);
      alert('Professor rejected.');
    } catch (err) {
      console.error('[AdminDashboard] rejectProfessor failed', err);
      alert('Reject failed. Backend endpoint POST /api/professors/{id}/reject is required.');
    }
  }

  logout() {
    this.authService.logout();
  }
}