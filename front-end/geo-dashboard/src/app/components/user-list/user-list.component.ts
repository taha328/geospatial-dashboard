import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';

// Import ZardUI components
import { ZardButtonComponent } from '../../shared/components/button/index';
import { ZardCardComponent } from '../../shared/components/card/index';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // ZardUI Components
    ZardButtonComponent,
    ZardCardComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load users';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers(); // Refresh the list
        },
        error: (error: any) => {
          this.error = 'Failed to delete user';
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  getRoleIcon(role?: string): string {
    const icons: { [key: string]: string } = {
      'administrateur': 'Admin',
      'maitre_d_ouvrage': 'MO',
      'operateur': 'OP'
    };
    return icons[role || ''] || '?';
  }

  getRoleDisplayName(role?: string): string {
    const names: { [key: string]: string } = {
      'administrateur': 'Administrateur',
      'maitre_d_ouvrage': 'Maître d\'ouvrage',
      'operateur': 'Opérateur'
    };
    return names[role || ''] || (role || 'Inconnu');
  }

  getRoleBadgeClass(role?: string): string {
    const classes: { [key: string]: string } = {
      'administrateur': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200',
      'maitre_d_ouvrage': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200',
      'operateur': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200'
    };
    return classes[role || ''] || 'bg-gray-100 text-gray-800 border border-gray-200';
  }

  get totalUsers(): number {
    return this.users?.length || 0;
  }

  get adminCount(): number {
    return this.users?.filter(u => u?.role === 'administrateur').length || 0;
  }

  get maitreDOuvrageCount(): number {
    return this.users?.filter(u => u?.role === 'maitre_d_ouvrage').length || 0;
  }

  get operateurCount(): number {
    return this.users?.filter(u => u?.role === 'operateur').length || 0;
  }
}
