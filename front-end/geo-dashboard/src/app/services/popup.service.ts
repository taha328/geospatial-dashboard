import { Injectable } from '@angular/core';
import { ProfessionalNotificationService } from './advanced-notification.service';
import { Observable } from 'rxjs';

/**
 * Browser Pop-up Replacement Utility Service
 *
 * This service provides drop-in replacements for browser pop-up functions:
 * - alert() -> professionalAlert()
 * - confirm() -> professionalConfirm()
 * - prompt() -> professionalPrompt()
 *
 * These functions return Observables for better Angular integration and async handling.
 */
@Injectable({
  providedIn: 'root'
})
export class BrowserPopupReplacementService {

  constructor(private notificationService: ProfessionalNotificationService) {}

  /**
   * Professional replacement for browser alert()
   * Shows a professional alert dialog with consistent styling
   *
   * @param message The message to display
   * @param title Optional title for the alert
   * @param type The type of alert (info, success, warning, error)
   * @returns Observable that completes when user acknowledges
   */
  professionalAlert(
    message: string,
    title?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Observable<void> {
    return this.notificationService.alertDialog({
      title,
      message,
      type
    });
  }

  /**
   * Professional replacement for browser confirm()
   * Shows a professional confirmation dialog
   *
   * @param message The confirmation message
   * @param title Optional title for the confirmation
   * @param type The type of confirmation (info, success, warning, error)
   * @returns Observable<boolean> - true if confirmed, false if cancelled
   */
  professionalConfirm(
    message: string,
    title?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Observable<boolean> {
    return this.notificationService.confirm({
      title,
      message,
      type
    });
  }

  /**
   * Professional replacement for browser prompt()
   * Shows a professional input dialog
   *
   * @param message The prompt message
   * @param defaultValue Optional default value for the input
   * @param title Optional title for the prompt
   * @param placeholder Optional placeholder text
   * @param type Input type (text, email, password, number)
   * @param required Whether the input is required
   * @returns Observable<string | null> - the input value or null if cancelled
   */
  professionalPrompt(
    message: string,
    defaultValue?: string,
    title?: string,
    placeholder?: string,
    type: 'text' | 'email' | 'password' | 'number' = 'text',
    required: boolean = false
  ): Observable<string | null> {
    return this.notificationService.prompt({
      title,
      message,
      placeholder,
      defaultValue,
      type,
      required
    });
  }

  /**
   * Quick alert methods for common use cases
   */
  successAlert(message: string, title?: string): Observable<void> {
    return this.professionalAlert(message, title, 'success');
  }

  errorAlert(message: string, title?: string): Observable<void> {
    return this.professionalAlert(message, title, 'error');
  }

  warningAlert(message: string, title?: string): Observable<void> {
    return this.professionalAlert(message, title, 'warning');
  }

  infoAlert(message: string, title?: string): Observable<void> {
    return this.professionalAlert(message, title, 'info');
  }

  /**
   * Quick confirmation methods for common use cases
   */
  deleteConfirm(itemName?: string): Observable<boolean> {
    return this.notificationService.confirmDelete(itemName);
  }

  saveConfirm(): Observable<boolean> {
    return this.notificationService.confirmSave();
  }

  navigationConfirm(): Observable<boolean> {
    return this.notificationService.confirmNavigation();
  }

  /**
   * Quick prompt methods for common use cases
   */
  emailPrompt(message: string, defaultValue?: string): Observable<string | null> {
    return this.professionalPrompt(message, defaultValue, 'Adresse email', 'votre.email@exemple.com', 'email', true);
  }

  passwordPrompt(message: string): Observable<string | null> {
    return this.professionalPrompt(message, '', 'Mot de passe requis', '••••••••', 'password', true);
  }

  namePrompt(message: string, defaultValue?: string): Observable<string | null> {
    return this.professionalPrompt(message, defaultValue, 'Nom', 'Votre nom', 'text', true);
  }

  numberPrompt(message: string, defaultValue?: string): Observable<string | null> {
    return this.professionalPrompt(message, defaultValue, 'Nombre', '0', 'number', false);
  }

  /**
   * Snackbar-based quick notifications (non-blocking)
   */
  quickSuccess(message: string): void {
    this.notificationService.success(message);
  }

  quickError(message: string): void {
    this.notificationService.error(message);
  }

  quickWarning(message: string): void {
    this.notificationService.warning(message);
  }

  quickInfo(message: string): void {
    this.notificationService.info(message);
  }

  /**
   * Loading notification
   */
  showLoading(message?: string): void {
    this.notificationService.loading(message);
  }

  /**
   * Dismiss current notification
   */
  dismiss(): void {
    this.notificationService.dismiss();
  }
}
