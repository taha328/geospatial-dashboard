import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header class="login-header">
          <div class="logo-section">
            <mat-icon class="logo-icon">map</mat-icon>
            <div class="title-section">
              <mat-card-title>Geo Dashboard</mat-card-title>
              <mat-card-subtitle>Système Géospatial</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content class="login-content">
          <h2>{{ mode === 'login' ? 'Connexion' : 'Définir le mot de passe' }}</h2>

          <!-- Login Form -->
          <form *ngIf="mode === 'login'" (ngSubmit)="submitLogin()" class="login-form" novalidate>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse email</mat-label>
              <input
                matInput
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="votre.email@exemple.com"
                required
                autocomplete="email"
                email
              />
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input
                matInput
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Votre mot de passe"
                required
                autocomplete="current-password"
              />
              <mat-icon matPrefix>lock</mat-icon>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="login-button"
              [disabled]="!email || !password || isLoading"
            >
              <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
              <mat-icon *ngIf="!isLoading">login</mat-icon>
              {{ isLoading ? 'Connexion...' : 'Se connecter' }}
            </button>

            <mat-divider class="divider"></mat-divider>

            <div class="form-footer">
              <p class="help-text">
                Si vous avez reçu une invitation, utilisez le lien ci-dessous pour définir votre mot de passe.
              </p>
              <button
                mat-stroked-button
                color="accent"
                type="button"
                (click)="mode = 'set'"
                class="mode-link"
              >
                <mat-icon>settings</mat-icon>
                Définir mon mot de passe
              </button>
            </div>
          </form>

          <!-- Set Password Form -->
          <form *ngIf="mode === 'set'" (ngSubmit)="submitSetPassword()" class="set-password-form" novalidate>
            <div class="form-header">
              <h3>Créer votre mot de passe</h3>
              <p class="form-description">
                Utilisez l'adresse email exacte de votre invitation
              </p>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse email</mat-label>
              <input
                matInput
                type="email"
                [(ngModel)]="email"
                name="setEmail"
                placeholder="votre.email@exemple.com"
                required
                autocomplete="email"
                email
              />
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nouveau mot de passe</mat-label>
              <input
                matInput
                type="password"
                [(ngModel)]="password"
                name="setPassword"
                placeholder="Minimum 8 caractères"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <mat-icon matPrefix>security</mat-icon>
              <mat-hint>Le mot de passe doit contenir au moins 8 caractères</mat-hint>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="login-button"
              [disabled]="!email || !password || password.length < 8 || isLoading"
            >
              <mat-icon *ngIf="isLoading">save</mat-icon>
              <mat-icon *ngIf="!isLoading">check</mat-icon>
              {{ isLoading ? 'Création...' : 'Créer le mot de passe' }}
            </button>

            <mat-divider class="divider"></mat-divider>

            <div class="form-footer">
              <button
                mat-stroked-button
                color="accent"
                type="button"
                (click)="mode = 'login'"
                class="mode-link"
              >
                <mat-icon>arrow_back</mat-icon>
                Retour à la connexion
              </button>
            </div>
          </form>

          <!-- Error Display -->
          <div *ngIf="error" class="error-message">
            <mat-icon color="warn">error</mat-icon>
            <span>{{ error }}</span>
          </div>

          <!-- Success Display -->
          <div *ngIf="successMessage" class="success-message">
            <mat-icon color="primary">check_circle</mat-icon>
            <span>{{ successMessage }}</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error: string | null = null;
  successMessage: string | null = null;
  mode: 'login' | 'set' = 'login';
  isLoading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submitLogin() {
    if (!this.email || !this.password) return;

    this.error = null;
    this.successMessage = null;
    this.isLoading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.isLoading = false;
        this.error = e?.error?.message || 'Échec de la connexion';
      }
    });
  }

  submitSetPassword() {
    if (!this.email || !this.password || this.password.length < 8) return;

    this.error = null;
    this.successMessage = null;
    this.isLoading = true;

    this.auth.setPassword(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.mode = 'login';
        this.successMessage = 'Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.';
        this.error = null;
      },
      error: (e) => {
        this.isLoading = false;
        this.error = e?.error?.message || 'Échec de la définition du mot de passe';
      }
    });
  }
}