import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = false;
  error: string | null = null;
  userId: number | null = null;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = +params['id'];
      this.loadUser();
    });
  }

  loadUser() {
    if (this.userId) {
      this.loading = true;
      this.error = null;
      
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
}
