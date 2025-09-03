import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss']
})
export class SetPasswordComponent implements OnInit {
  email: string = '';
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  error: string = '';
  success: boolean = false;
  isResetFlow: boolean = false; // Flag to determine if this is a reset or set flow

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Determine if this is a reset password flow based on the URL
    this.isResetFlow = this.router.url.includes('reset-password');
    console.log('🔍 SetPasswordComponent - Flow type:', this.isResetFlow ? 'Reset Password' : 'Set Password');

    // Extract token and email from URL parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      console.log('🔍 SetPasswordComponent - URL params:', params);
      console.log('🔍 SetPasswordComponent - Current URL:', window.location.href);
      console.log('🔍 SetPasswordComponent - Extracted token:', this.token);
      console.log('🔍 SetPasswordComponent - Extracted email:', this.email);

      // Persist token as a short-lived fallback so it survives accidental reloads/navigation
      const storageKey = this.isResetFlow ? 'reset_token' : 'invite_token';
      if (this.token && this.token.trim()) {
        try { sessionStorage.setItem(storageKey, this.token.trim()); } catch (e) {}
      }

      if (!this.token || !this.email) {
        // Try to fallback to sessionStorage for token if email present
        try {
          const saved = sessionStorage.getItem(storageKey) || '';
          if (saved && !this.token) {
            this.token = saved;
            console.log('🔁 SetPasswordComponent - Recovered token from sessionStorage');
          }
        } catch (e) {}

        if (!this.token || !this.email) {
          const linkType = this.isResetFlow ? 'password reset' : 'invitation';
          this.error = `Invalid ${linkType} link. Please check your email for the correct link.`;
          console.error('❌ SetPasswordComponent - Missing token or email in URL');
        }
      } else {
        console.log('✅ SetPasswordComponent - Token and email successfully extracted');
      }
    });
  }

  onSubmit() {
    console.log('🚀 SetPasswordComponent - onSubmit called');
    console.log('🚀 SetPasswordComponent - Flow type:', this.isResetFlow ? 'Reset' : 'Set');

    // If token got lost, try to recover from sessionStorage before sending
    if (!this.token || !this.token.trim()) {
      try {
        const storageKey = this.isResetFlow ? 'reset_token' : 'invite_token';
        const saved = sessionStorage.getItem(storageKey) || '';
        if (saved) {
          this.token = saved;
          console.log('🔁 SetPasswordComponent - Recovered token from sessionStorage on submit');
        }
      } catch (e) {}
    }

    console.log('🚀 SetPasswordComponent - Token:', this.token);
    console.log('🚀 SetPasswordComponent - Email:', this.email);
    console.log('🚀 SetPasswordComponent - Password length:', this.password.length);

    if (!this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters long';
      return;
    }

    this.loading = true;
    this.error = '';

    // Use the appropriate service method based on the flow type
    const serviceCall = this.isResetFlow 
      ? this.authService.resetPassword(this.email, this.password, this.token)
      : this.authService.setPassword(this.email, this.password, this.token);

    serviceCall.subscribe({
      next: (response: any) => {
        const actionType = this.isResetFlow ? 'reset' : 'set';
        console.log(`✅ SetPasswordComponent - Password ${actionType} successfully:`, response);
        this.loading = false;
        this.success = true;

        // Clean up persisted token
        try { 
          const storageKey = this.isResetFlow ? 'reset_token' : 'invite_token';
          sessionStorage.removeItem(storageKey); 
        } catch (e) {}

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error: any) => {
        const actionType = this.isResetFlow ? 'reset' : 'set';
        console.error(`❌ SetPasswordComponent - ${actionType} password error:`, error);
        console.error('❌ SetPasswordComponent - Error status:', error.status);
        console.error('❌ SetPasswordComponent - Error body:', error.error);
        this.loading = false;
        if (error.status === 400) {
          const tokenType = this.isResetFlow ? 'reset token' : 'invitation token';
          this.error = error.error?.message || `Invalid or expired ${tokenType}`;
        } else {
          const actionType = this.isResetFlow ? 'reset' : 'set';
          this.error = `Failed to ${actionType} password. Please try again.`;
        }
        console.error(`${actionType} password error:`, error);
      }
    });
  }
}