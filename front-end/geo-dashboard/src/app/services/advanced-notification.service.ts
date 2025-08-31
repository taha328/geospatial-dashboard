import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialogComponent } from '../shared/components/core/confirm-dialog/confirm-dialog.component';
import { PromptDialogComponent } from '../shared/components/core/prompt-dialog/prompt-dialog.component';
import { AlertDialogComponent } from '../shared/components/core/alert-dialog/alert-dialog.component';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface PromptOptions {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
}

@Injectable({
  providedIn: 'root'
})
export class ProfessionalNotificationService {
  private defaultSnackBarConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
    panelClass: ['professional-snackbar']
  };

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  /**
   * Show a professional alert message using Angular Material Snackbar
   * Replaces browser alert() function
   */
  alert(options: AlertOptions): void {
    const config = { ...this.defaultSnackBarConfig };

    if (options.duration !== undefined) {
      config.duration = options.duration;
    }

    // Set panel class based on type
    config.panelClass = [`professional-snackbar-${options.type || 'info'}`];

    const snackBarRef = this.snackBar.open(
      options.message,
      options.action || 'OK',
      config
    );

    // Handle action click
    if (options.action) {
      snackBarRef.onAction().subscribe(() => {
        // Action handling can be extended here
      });
    }
  }

  /**
   * Show a professional alert dialog
   * Alternative to alert() for more prominent messages
   */
  alertDialog(options: AlertOptions): Observable<void> {
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: options,
      disableClose: true,
      panelClass: 'professional-dialog'
    });

    return dialogRef.afterClosed();
  }

  /**
   * Show a professional confirmation dialog
   * Replaces browser confirm() function
   */
  confirm(options: ConfirmOptions): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: options,
      disableClose: true,
      panelClass: 'professional-dialog'
    });

    return dialogRef.afterClosed().pipe(
      map(result => result === true)
    );
  }

  /**
   * Show a professional prompt dialog
   * Replaces browser prompt() function
   */
  prompt(options: PromptOptions): Observable<string | null> {
    const dialogRef = this.dialog.open(PromptDialogComponent, {
      width: '450px',
      data: options,
      disableClose: true,
      panelClass: 'professional-dialog'
    });

    return dialogRef.afterClosed().pipe(
      map(result => result || null)
    );
  }

  /**
   * Show a success message
   */
  success(message: string, action?: string, duration?: number): void {
    this.alert({
      message,
      type: 'success',
      action,
      duration
    });
  }

  /**
   * Show an error message
   */
  error(message: string, action?: string, duration?: number): void {
    this.alert({
      message,
      type: 'error',
      action,
      duration
    });
  }

  /**
   * Show a warning message
   */
  warning(message: string, action?: string, duration?: number): void {
    this.alert({
      message,
      type: 'warning',
      action,
      duration
    });
  }

  /**
   * Show an info message
   */
  info(message: string, action?: string, duration?: number): void {
    this.alert({
      message,
      type: 'info',
      action,
      duration
    });
  }

  /**
   * Show a loading message
   */
  loading(message: string = 'Chargement en cours...'): void {
    this.alert({
      message,
      type: 'info',
      duration: 0 // Indefinite duration
    });
  }

  /**
   * Dismiss current snackbar
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }

  /**
   * Show a confirmation for delete operations
   */
  confirmDelete(itemName?: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirmation de suppression',
      message: `Êtes-vous sûr de vouloir supprimer ${itemName || 'cet élément'} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'error'
    });
  }

  /**
   * Show a confirmation for save operations
   */
  confirmSave(): Observable<boolean> {
    return this.confirm({
      title: 'Confirmation d\'enregistrement',
      message: 'Voulez-vous enregistrer les modifications ?',
      confirmText: 'Enregistrer',
      cancelText: 'Annuler',
      type: 'info'
    });
  }

  /**
   * Show a confirmation for navigation with unsaved changes
   */
  confirmNavigation(): Observable<boolean> {
    return this.confirm({
      title: 'Modifications non enregistrées',
      message: 'Vous avez des modifications non enregistrées. Voulez-vous quitter cette page ?',
      confirmText: 'Quitter',
      cancelText: 'Rester',
      type: 'warning'
    });
  }
}
