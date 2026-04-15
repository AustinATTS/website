import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit {
  private authService = inject(AuthService);

  users = signal<User[]>([]);

  ngOnInit() {
    this.authService.listUsers().then(users => this.users.set(users));
  }

  async toggleRole(user: User) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await this.authService.setUserRole(user.uid, newRole);
    this.users.update(users =>
      users.map(u => u.uid === user.uid ? { ...u, role: newRole } : u)
    );
  }

  async deleteUser(uid: string) {
    await this.authService.deleteUserProfile(uid);
    this.users.update(users => users.filter(u => u.uid !== uid));
  }
}
