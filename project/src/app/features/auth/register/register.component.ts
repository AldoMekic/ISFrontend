import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DepartmentsService } from '../../../core/services/departments.service';

interface Department {
  id: string | number;
  name: string;
  code: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  accountType: 'student' | 'professor' = 'student';

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  age: number | null = null;

  departmentId = '';
  yearOfStudy: number | null = null;   // student only
  title = '';                          // professor only

  error = '';
  success = '';
  loading = false;
  departments: Department[] = [];

  constructor(
    private authService: AuthService,
    private departmentsService: DepartmentsService,
    private router: Router
  ) {}

  async ngOnInit() {
    // ✅ load departments for the dropdown
    try {
      const deps = await this.departmentsService.getAll();
      this.departments = deps.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code
      }));
    } catch (e) {
      console.error('[Register] failed to load departments', e);
      this.departments = [];
    }
  }

  async onSubmit() {
    this.error = '';
    this.success = '';

    // basic checks
    if (!this.username || !this.email || !this.password) {
      this.error = 'Please fill in username, email and password';
      return;
    }
    if (!this.firstName || !this.lastName) {
      this.error = 'Please fill in first name and last name';
      return;
    }
    if (this.age == null || this.age < 18) {
      this.error = 'Please enter a valid age (18+)';
      return;
    }
    if (!this.departmentId) {
      this.error = 'Please select a department';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    if (this.accountType === 'student' && !this.yearOfStudy) {
      this.error = 'Please select year of study';
      return;
    }
    if (this.accountType === 'professor' && !this.title.trim()) {
      this.error = 'Please enter academic title';
      return;
    }

    this.loading = true;
    try {
      // ✅ send the full data your UI collects (backend can ignore what it doesn't use)
      await this.authService.registerUser({
        username: this.username,
        email: this.email,
        password: this.password,

        firstName: this.firstName,
        lastName: this.lastName,
        age: this.age,

        departmentId: Number(this.departmentId),

        yearOfStudy: this.accountType === 'student' ? this.yearOfStudy : null,
        title: this.accountType === 'professor' ? this.title : null,

        isStudent: this.accountType === 'student',
        isProfessor: this.accountType === 'professor'
      });

      this.success = 'Registration successful! Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'Registration failed';
    } finally {
      this.loading = false;
    }
  }
}