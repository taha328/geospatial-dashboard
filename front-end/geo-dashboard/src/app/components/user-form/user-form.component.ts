import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  user: User = {
    name: '',
    email: '',
    role: 'user'
  };
  
  isEditMode = false;
  userId: number | null = null;
  loading = false;
  error: string | null = null;
  
  roles = ['user', 'admin', 'moderator'];

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = +params['id'];
        this.loadUser();
      }
    });
  }

  loadUser() {
    if (this.userId) {
      this.loading = true;
      this.userService.getUser(this.userId).subscribe({
        next: (user: User) => {
          this.user = user;
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to load user';
          this.loading = false;
          console.error('Error loading user:', error);
        }
      });
    }
  }

  onSubmit() {
    if (!this.user.name || !this.user.email || !this.user.role) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = null;

    const operation = this.isEditMode
      ? this.userService.updateUser(this.userId!, this.user)
      : this.userService.createUser(this.user);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (error: any) => {
        this.error = this.isEditMode ? 'Failed to update user' : 'Failed to create user';
        this.loading = false;
        console.error('Error saving user:', error);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/users']);
  }
}
