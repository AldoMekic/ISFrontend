import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProfessorsService, SubjectResponseDTO } from '../../../core/services/professors.service';
import { EnrollmentsService } from '../../../core/services/enrollments.service';
import { StudentsService, StudentResponseDTO } from '../../../core/services/students.service';
import { GradesService } from '../../../core/services/grades.service';

interface StudentMini {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  studentNumber?: string;
}

interface RosterRow {
  enrollmentId: number | null;
  subjectId: number;
  studentId: number;
  status: 'attending' | 'completed' | 'dropped';
  student: StudentMini;
}

@Component({
  selector: 'app-professor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './professor-dashboard.component.html',
  styleUrls: ['./professor-dashboard.component.css']
})
export class ProfessorDashboardComponent implements OnInit {
  professorName = '';
  professorId: number | null = null;

  subjects: SubjectResponseDTO[] = [];
  selectedSubject: SubjectResponseDTO | null = null;

  enrollments: RosterRow[] = [];
  loading = true;
  activeTab: 'subjects' | 'students' = 'subjects';

  // Grade modal
  showGradeModal = false;
  selectedEnrollment: RosterRow | null = null;
  gradeValue: number | null = null;
  finalScore: number | null = null;

  // template binding helper
  maxAttendanceDate = new Date().toISOString().split('T')[0];

  // ✅ cache student lookups to avoid repeated calls when switching subjects
  private studentCache = new Map<number, StudentMini>();

  constructor(
    public authService: AuthService,
    private professorsService: ProfessorsService,
    private enrollmentsService: EnrollmentsService,
    private studentsService: StudentsService,
    private gradesService: GradesService
  ) {}

  async ngOnInit() {
    await this.initProfessor();
  }

  private async initProfessor() {
    this.loading = true;
    try {
      const user = this.authService.getUserProfile();
      this.professorName = user ? (user.first_name || user.email || 'Professor') : 'Professor';

      // TEMP: load professor id from localStorage; otherwise pick the first one
      const saved = localStorage.getItem('professor_id');
      if (saved) {
        this.professorId = Number(saved);
      } else {
        const all = await this.professorsService.getAll();
        if (all && all.length) {
          this.professorId = all[0].id;
          localStorage.setItem('professor_id', String(this.professorId));
        }
      }

      if (this.professorId != null) {
        await this.loadSubjects();
      }
    } finally {
      this.loading = false;
    }
  }

  async loadSubjects() {
    if (this.professorId == null) return;
    this.subjects = await this.professorsService.getProfessorSubjects(this.professorId);
  }

  async selectSubject(subject: SubjectResponseDTO) {
    // ✅ guard: only allow selecting from "my subjects"
    const isMine = this.subjects.some(s => s.id === subject.id);
    if (!isMine) {
      alert('This subject is not assigned to you.');
      return;
    }

    this.selectedSubject = subject;
    this.activeTab = 'students';
    await this.loadRosterForSelectedSubject();
  }

  private normalizeStatus(s: any): 'attending' | 'completed' | 'dropped' {
    const v = String(s ?? '').toLowerCase();
    if (v === 'completed') return 'completed';
    if (v === 'dropped') return 'dropped';
    return 'attending';
  }

  private async getStudentMini(studentId: number): Promise<StudentMini> {
    const cached = this.studentCache.get(studentId);
    if (cached) return cached;

    let studentInfo: StudentResponseDTO | null = null;
    try {
      studentInfo = await this.studentsService.getById(studentId);
    } catch {
      studentInfo = null;
    }

    const mini: StudentMini = {
      id: studentId,
      firstName: (studentInfo as any)?.firstName ?? (studentInfo as any)?.name ?? '',
      lastName: (studentInfo as any)?.lastName ?? (studentInfo as any)?.surname ?? '',
      email: (studentInfo as any)?.email ?? '',
      studentNumber: (studentInfo as any)?.studentNumber ?? (studentInfo as any)?.student_number ?? ''
    };

    this.studentCache.set(studentId, mini);
    return mini;
  }

  private async loadRosterForSelectedSubject() {
    this.enrollments = [];
    if (!this.selectedSubject) return;

    // ✅ still uses existing backend endpoints, but:
    // - filters strictly by selected subject
    // - parallelizes student fetches
    // - caches student details
    const allEnrollments = await this.enrollmentsService.getAll();

    const filtered = (allEnrollments || []).filter((e: any) => {
      const sid = (e.subjectId ?? e.subject_id);
      return sid === this.selectedSubject!.id;
    });

    // collect unique student IDs
    const studentIds = Array.from(
      new Set(
        filtered
          .map((e: any) => e.studentId ?? e.student_id)
          .filter((x: any) => x != null)
          .map((x: any) => Number(x))
      )
    );

    // ✅ fetch all students in parallel (with cache)
    const minisArr = await Promise.all(studentIds.map(id => this.getStudentMini(id)));
    const miniById = new Map<number, StudentMini>(minisArr.map(m => [m.id, m]));

    // build roster rows
    const rows: RosterRow[] = filtered
  .map((e: any) => {
    const studentIdRaw = (e.studentId ?? e.student_id);
    if (studentIdRaw == null) return null;

    const studentId = Number(studentIdRaw);
    const mini = miniById.get(studentId) ?? { id: studentId };

    const enrollmentId = (e.id ?? e.enrollmentId ?? e.enrollment_id ?? null);
    const status = this.normalizeStatus(e.status);

    return {
      enrollmentId: enrollmentId != null ? Number(enrollmentId) : null,
      subjectId: this.selectedSubject!.id,
      studentId,
      status,
      student: mini
    } as RosterRow;
  })
  .filter((x): x is RosterRow => x !== null);

this.enrollments = rows;
  }

  async dropEnrollment(row: RosterRow) {
    if (!row.enrollmentId) {
      alert('Enrollment ID is missing. Cannot drop.');
      return;
    }

    if (!confirm('Are you sure you want to drop this student from the subject?')) return;

    try {
      await this.enrollmentsService.drop(row.enrollmentId);
      await this.loadRosterForSelectedSubject();
    } catch (err) {
      console.error('[ProfessorDashboard] dropEnrollment failed', err);
      alert('Failed to drop enrollment.');
    }
  }

  async completeEnrollment(row: RosterRow) {
    if (!row.enrollmentId) {
      alert('Enrollment ID is missing. Cannot complete.');
      return;
    }

    if (!confirm('Mark this enrollment as completed?')) return;

    try {
      await this.enrollmentsService.complete(row.enrollmentId);
      await this.loadRosterForSelectedSubject();

      const updated = this.enrollments.find(x => x.enrollmentId === row.enrollmentId);
      if (updated) this.openGradeModal(updated);
    } catch (err) {
      console.error('[ProfessorDashboard] completeEnrollment failed', err);
      alert('Failed to complete enrollment.');
    }
  }

  // === Grade modal ===
  openGradeModal(enrollment: RosterRow) {
    this.selectedEnrollment = enrollment;
    this.gradeValue = null;
    this.finalScore = null;
    this.showGradeModal = true;
  }

  closeGradeModal() {
    this.showGradeModal = false;
    this.selectedEnrollment = null;
    this.gradeValue = null;
    this.finalScore = null;
  }

  async submitGrade() {
    if (!this.selectedEnrollment) {
      alert('Missing enrollment.');
      return;
    }

    if (!this.selectedEnrollment.enrollmentId) {
      alert('Enrollment ID is missing. Cannot assign grade.');
      return;
    }

    if (this.gradeValue == null || this.finalScore == null) {
      alert('Please fill in grade and final score.');
      return;
    }

    const payload = {
      enrollmentId: this.selectedEnrollment.enrollmentId,
      officialGrade: this.gradeValue,
      totalScore: this.finalScore
    };

    try {
      await this.gradesService.create(payload);
      this.closeGradeModal();
      await this.loadRosterForSelectedSubject();
      alert('Grade assigned successfully.');
    } catch (err: any) {
      console.error('[ProfessorDashboard] submitGrade failed', err);
      alert(err?.error ?? 'Failed to assign grade.');
    }
  }

  logout() {
    this.authService.logout();
  }
}