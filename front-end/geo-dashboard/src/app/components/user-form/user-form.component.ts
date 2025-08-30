import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';

// Import ZardUI components
import { ZardCardComponent } from '../../shared/components/card/index';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // ZardUI Components
    ZardCardComponent
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  user: User = {
    name: '',
    email: '',
  role: 'utilisateur'
  };
  
  isEditMode = false;
  userId: number | null = null;
  loading = false;
  error: string | null = null;
  
  // Simplified roles for this application: administrateur and utilisateur
  roles = ['administrateur', 'utilisateur'];

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
    // Enhanced validation
    if (!this.user.name?.trim()) {
      this.error = 'Le nom complet est obligatoire';
      return;
    }

    if (!this.user.email?.trim()) {
      this.error = 'L\'adresse email est obligatoire';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      this.error = 'Veuillez saisir une adresse email valide';
      return;
    }

    if (!this.user.role) {
      this.error = 'Veuillez sélectionner un rôle';
      return;
    }

    this.loading = true;
    this.error = null;

    const operation = this.isEditMode
      ? this.userService.updateUser(this.userId!, this.user)
      : this.userService.inviteUser(this.user);

    operation.subscribe({
      next: (response) => {
        this.loading = false;
        // Success message
        const successMessage = this.isEditMode
          ? 'Utilisateur mis à jour avec succès'
          : 'Invitation envoyée avec succès. L\'utilisateur recevra un email pour définir son mot de passe.';
        alert(successMessage); // Temporary success feedback
        this.router.navigate(['/users']);
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error saving user:', error);

        // Better error handling
        if (error.status === 400) {
          this.error = error.error?.message || 'Données invalides. Vérifiez les informations saisies.';
        } else if (error.status === 403) {
          this.error = 'Vous n\'avez pas les permissions pour effectuer cette action.';
        } else if (error.status === 409) {
          this.error = 'Un utilisateur avec cette adresse email existe déjà.';
        } else {
          this.error = this.isEditMode
            ? 'Erreur lors de la mise à jour de l\'utilisateur'
            : 'Erreur lors de l\'envoi de l\'invitation';
        }
      }
    });
  }

  onCancel() {
    this.router.navigate(['/users']);
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'administrateur': '👑 Administrateur',
      'utilisateur': '👤 Utilisateur'
    };
    return roleNames[role] || role;
  }

  getRoleDescription(role: string): string {
    const descriptions: { [key: string]: string } = {
      'administrateur': 'Accès complet au système, gestion des utilisateurs et configuration',
      'utilisateur': 'Accès aux fonctionnalités standard, consultation et saisie de données'
    };
    return descriptions[role] || 'Rôle personnalisé';
  }
}
