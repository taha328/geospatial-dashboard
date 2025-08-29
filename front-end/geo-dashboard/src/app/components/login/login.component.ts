import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
// Remove ZardCardComponent import since we're using regular div now
// import { ZardCardComponent } from '@shared/components/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
    // Remove ZardCardComponent from imports
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  error: string | null = null;
  successMessage: string | null = null;
  mode: 'login' | 'set' = 'login';
  isLoading = false;

  constructor(
    private auth: AuthService, 
    private router: Router
  ) {
    console.log('LoginComponent initialized');
    console.log('Initial mode:', this.mode);
  }

  ngOnInit() {
    console.log('LoginComponent ngOnInit called');
    // Clear any existing messages on init
    this.clearMessages();
  }

  submitLogin(): void {
    console.log('submitLogin called', { email: this.email, passwordLength: this.password.length });
    
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs.';
      console.log('Form validation failed');
      return;
    }

    this.clearMessages();
    this.isLoading = true;
    console.log('Starting login process...');

    // If AuthService is not available, simulate for testing
    if (!this.auth) {
      console.log('AuthService not available, simulating login...');
      setTimeout(() => {
        this.isLoading = false;
        if (this.email === 'test@test.com' && this.password === 'password') {
          this.successMessage = 'Connexion réussie !';
          setTimeout(() => this.router.navigate(['/dashboard']), 1000);
        } else {
          this.error = 'Email ou mot de passe incorrect.';
        }
      }, 1500);
      return;
    }

    this.auth.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Login successful:', response);
        this.successMessage = 'Connexion réussie !';
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Login error:', error);
        
        if (error.status === 0) {
          this.error = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
        } else if (error.status === 401) {
          this.error = 'Email ou mot de passe incorrect.';
        } else if (error.status === 403) {
          this.error = 'Accès refusé. Contactez l\'administrateur.';
        } else if (error.status === 422) {
          this.error = 'Données invalides. Vérifiez votre email et mot de passe.';
        } else {
          this.error = error?.error?.message || 'Échec de la connexion. Veuillez réessayer.';
        }
      }
    });
  }

  submitSetPassword(): void {
    console.log('submitSetPassword called', { email: this.email, passwordLength: this.password.length });
    
    if (!this.email || !this.password || this.password.length < 8) {
      this.error = 'Veuillez remplir tous les champs. Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    this.clearMessages();
    this.isLoading = true;

    // If AuthService is not available, simulate for testing
    if (!this.auth) {
      console.log('AuthService not available, simulating set password...');
      setTimeout(() => {
        this.isLoading = false;
        this.switchToLogin();
        this.successMessage = 'Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.';
      }, 1500);
      return;
    }

    this.auth.setPassword(this.email, this.password).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Set password successful:', response);
        this.switchToLogin();
        this.successMessage = 'Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.';
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Set password error:', error);
        this.error = error?.error?.message || 'Échec de la définition du mot de passe. Veuillez réessayer.';
      }
    });
  }

  switchMode(newMode: 'login' | 'set'): void {
    console.log('Switching mode from', this.mode, 'to', newMode);
    this.mode = newMode;
    this.clearMessages();
    this.resetForm();
  }

  switchToLogin(): void {
    this.switchMode('login');
  }

  switchToSetPassword(): void {
    this.switchMode('set');
  }

  private clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }

  private resetForm(): void {
    this.email = '';
    this.password = '';
  }

  get isFormValid(): boolean {
    return !!(this.email && this.password);
  }

  get isSetPasswordFormValid(): boolean {
    return !!(this.email && this.password && this.password.length >= 8);
  }

  get isLoginDisabled(): boolean {
    return !this.isFormValid || this.isLoading;
  }

  get isSetPasswordDisabled(): boolean {
    return !this.isSetPasswordFormValid || this.isLoading;
  }
}

// (removed mock AuthService interface to allow real DI injection)