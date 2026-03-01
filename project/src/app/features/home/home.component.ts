import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(public auth: AuthService) {}

  get user() {
    return this.auth.getUserProfile();
  }

  hasRole(role: 'student' | 'professor' | 'admin') {
    return this.auth.hasRole([role]);
  }
}