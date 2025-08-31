import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  resetEmail = '';
  error: string | null = null;
  successMessage: string | null = null;
  mode: 'login' | 'forgot' = 'login';
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    console.log('LoginComponent initialized');
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

    this.auth.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Login successful:', response);
        this.successMessage = 'Connexion réussie !';

        setTimeout(() => {
          this.router.navigate(['/map']);
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

  submitForgotPassword(): void {
    console.log('submitForgotPassword called', { email: this.resetEmail });

    if (!this.resetEmail) {
      this.error = 'Veuillez saisir votre adresse email.';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.resetEmail)) {
      this.error = 'Veuillez saisir une adresse email valide.';
      return;
    }

    this.clearMessages();
    this.isLoading = true;
    console.log('Starting forgot password process...');

    this.auth.forgotPassword(this.resetEmail).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Forgot password successful:', response);
        this.successMessage = 'Un email de réinitialisation a été envoyé à votre adresse email.';
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Forgot password error:', error);

        if (error.status === 404) {
          this.error = 'Cette adresse email n\'est pas enregistrée dans notre système.';
        } else if (error.status === 0) {
          this.error = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
        } else if (error.status === 429) {
          this.error = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
        } else {
          this.error = error?.error?.message || 'Échec de l\'envoi de l\'email. Veuillez réessayer.';
        }
      }
    });
  }

  switchToForgotPassword(): void {
    console.log('Switching to forgot password mode');
    this.mode = 'forgot';
    this.clearMessages();
    this.resetEmail = '';
  }

  switchToLogin(): void {
    console.log('Switching to login mode');
    this.mode = 'login';
    this.clearMessages();
    this.email = '';
    this.password = '';
  }

  private clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }

  get isFormValid(): boolean {
    return !!(this.email && this.password);
  }

  get isForgotPasswordFormValid(): boolean {
    return !!this.resetEmail;
  }

  get isLoginDisabled(): boolean {
    return !this.isFormValid || this.isLoading;
  }

  get isForgotPasswordDisabled(): boolean {
    return !this.isForgotPasswordFormValid || this.isLoading;
  }
}