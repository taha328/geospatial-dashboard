import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserPopupReplacementService } from '../../services/popup.service';
import { ProfessionalNotificationService } from '../../services/advanced-notification.service';

@Component({
  selector: 'app-notification-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-demo-container">
      <div class="demo-header">
        <h1>🔔 Professional Notification System Demo</h1>
        <p>This component demonstrates the replacement of browser pop-ups with professional Angular Material components.</p>
      </div>

      <div class="demo-sections">
        <!-- Snackbar Notifications -->
        <div class="demo-section">
          <h2>📢 Snackbar Notifications (Non-blocking)</h2>
          <div class="button-grid">
            <button class="demo-btn success" (click)="showSuccessSnackbar()">
              ✅ Success Message
            </button>
            <button class="demo-btn error" (click)="showErrorSnackbar()">
              ❌ Error Message
            </button>
            <button class="demo-btn warning" (click)="showWarningSnackbar()">
              ⚠️ Warning Message
            </button>
            <button class="demo-btn info" (click)="showInfoSnackbar()">
              ℹ️ Info Message
            </button>
            <button class="demo-btn loading" (click)="showLoadingSnackbar()">
              ⏳ Loading Message
            </button>
          </div>
        </div>

        <!-- Alert Dialogs -->
        <div class="demo-section">
          <h2>🚨 Alert Dialogs (Modal)</h2>
          <div class="button-grid">
            <button class="demo-btn success" (click)="showSuccessAlert()">
              ✅ Success Alert
            </button>
            <button class="demo-btn error" (click)="showErrorAlert()">
              ❌ Error Alert
            </button>
            <button class="demo-btn warning" (click)="showWarningAlert()">
              ⚠️ Warning Alert
            </button>
            <button class="demo-btn info" (click)="showInfoAlert()">
              ℹ️ Info Alert
            </button>
          </div>
        </div>

        <!-- Confirmation Dialogs -->
        <div class="demo-section">
          <h2>❓ Confirmation Dialogs</h2>
          <div class="button-grid">
            <button class="demo-btn primary" (click)="showBasicConfirm()">
              🔍 Basic Confirmation
            </button>
            <button class="demo-btn error" (click)="showDeleteConfirm()">
              🗑️ Delete Confirmation
            </button>
            <button class="demo-btn success" (click)="showSaveConfirm()">
              💾 Save Confirmation
            </button>
            <button class="demo-btn warning" (click)="showNavigationConfirm()">
              🚪 Navigation Confirmation
            </button>
          </div>
        </div>

        <!-- Prompt Dialogs -->
        <div class="demo-section">
          <h2>📝 Prompt Dialogs (Input)</h2>
          <div class="button-grid">
            <button class="demo-btn primary" (click)="showTextPrompt()">
              📝 Text Input
            </button>
            <button class="demo-btn info" (click)="showEmailPrompt()">
              📧 Email Input
            </button>
            <button class="demo-btn warning" (click)="showPasswordPrompt()">
              🔒 Password Input
            </button>
            <button class="demo-btn success" (click)="showNumberPrompt()">
              🔢 Number Input
            </button>
            <button class="demo-btn secondary" (click)="showNamePrompt()">
              👤 Name Input
            </button>
          </div>
        </div>

        <!-- Browser Replacement Examples -->
        <div class="demo-section">
          <h2>🔄 Browser Pop-up Replacements</h2>
          <div class="code-examples">
            <div class="code-block">
              <h4>Before (Browser pop-ups):</h4>
              <pre><code>// Old browser pop-ups
alert('Hello World!');
const confirmed = confirm('Are you sure?');
const name = prompt('Enter your name:');</code></pre>
            </div>

            <div class="code-block">
              <h4>After (Professional components):</h4>
              <pre><code>// Professional replacements
this.browserPopup.professionalAlert('Hello World!');
this.browserPopup.professionalConfirm('Are you sure?').subscribe(confirmed => {{ '{' }}
  // Handle confirmation
{{ '}' }});
this.browserPopup.professionalPrompt('Enter your name:').subscribe(name => {{ '{' }}
  // Handle input
{{ '}' }});</code></pre>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-footer">
        <p>💡 <strong>Tip:</strong> All notifications are fully responsive and match your application's design system.</p>
      </div>
    </div>
  `,
  styles: [`
    .notification-demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
    }

    .demo-header h1 {
      margin: 0 0 15px 0;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .demo-header p {
      margin: 0;
      font-size: 18px;
      opacity: 0.9;
      line-height: 1.5;
    }

    .demo-sections {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .demo-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .demo-section h2 {
      margin: 0 0 25px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .demo-btn {
      padding: 15px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 50px;
    }

    .demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .demo-btn:active {
      transform: translateY(0);
    }

    .demo-btn.success {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .demo-btn.error {
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
    }

    .demo-btn.warning {
      background: linear-gradient(135deg, #ffc107, #fd7e14);
      color: #212529;
    }

    .demo-btn.info {
      background: linear-gradient(135deg, #17a2b8, #138496);
      color: white;
    }

    .demo-btn.primary {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
    }

    .demo-btn.secondary {
      background: linear-gradient(135deg, #6c757d, #495057);
      color: white;
    }

    .demo-btn.loading {
      background: linear-gradient(135deg, #6f42c1, #5a32a3);
      color: white;
    }

    .code-examples {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .code-block {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e9ecef;
    }

    .code-block h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .code-block pre {
      margin: 0;
      background: #ffffff;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      overflow-x: auto;
    }

    .code-block code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.4;
      color: #2c3e50;
    }

    .demo-footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .demo-footer p {
      margin: 0;
      font-size: 16px;
      color: #6c757d;
      line-height: 1.5;
    }

    .demo-footer strong {
      color: #2c3e50;
    }

    @media (max-width: 768px) {
      .notification-demo-container {
        padding: 20px;
      }

      .demo-header {
        padding: 20px;
      }

      .demo-header h1 {
        font-size: 24px;
      }

      .demo-header p {
        font-size: 16px;
      }

      .demo-section {
        padding: 20px;
      }

      .button-grid {
        grid-template-columns: 1fr;
      }

      .code-examples {
        grid-template-columns: 1fr;
      }

      .demo-btn {
        font-size: 13px;
        padding: 12px 16px;
        min-height: 45px;
      }
    }
  `]
})
export class NotificationDemoComponent {

  constructor(
    private browserPopup: BrowserPopupReplacementService,
    private professionalNotification: ProfessionalNotificationService
  ) {}

  // Snackbar Notifications
  showSuccessSnackbar(): void {
    this.browserPopup.quickSuccess('Opération réalisée avec succès !');
  }

  showErrorSnackbar(): void {
    this.browserPopup.quickError('Une erreur s\'est produite. Veuillez réessayer.');
  }

  showWarningSnackbar(): void {
    this.browserPopup.quickWarning('Attention : Cette action est irréversible.');
  }

  showInfoSnackbar(): void {
    this.browserPopup.quickInfo('Information importante à prendre en compte.');
  }

  showLoadingSnackbar(): void {
    this.browserPopup.showLoading('Chargement des données en cours...');
    // Dismiss after 3 seconds for demo
    setTimeout(() => this.browserPopup.dismiss(), 3000);
  }

  // Alert Dialogs
  showSuccessAlert(): void {
    this.browserPopup.successAlert(
      'Votre demande a été traitée avec succès.',
      'Succès'
    ).subscribe();
  }

  showErrorAlert(): void {
    this.browserPopup.errorAlert(
      'Impossible de traiter votre demande. Veuillez contacter le support.',
      'Erreur'
    ).subscribe();
  }

  showWarningAlert(): void {
    this.browserPopup.warningAlert(
      'Cette action pourrait avoir des conséquences importantes.',
      'Attention'
    ).subscribe();
  }

  showInfoAlert(): void {
    this.browserPopup.infoAlert(
      'Voici une information importante concernant votre compte.',
      'Information'
    ).subscribe();
  }

  // Confirmation Dialogs
  showBasicConfirm(): void {
    this.browserPopup.professionalConfirm(
      'Êtes-vous sûr de vouloir continuer ?',
      'Confirmation'
    ).subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess('Action confirmée !');
      } else {
        this.browserPopup.quickInfo('Action annulée.');
      }
    });
  }

  showDeleteConfirm(): void {
    this.browserPopup.deleteConfirm('cet élément').subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess('Élément supprimé avec succès.');
      }
    });
  }

  showSaveConfirm(): void {
    this.browserPopup.saveConfirm().subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess('Modifications enregistrées.');
      }
    });
  }

  showNavigationConfirm(): void {
    this.browserPopup.navigationConfirm().subscribe(result => {
      if (result) {
        this.browserPopup.quickInfo('Navigation autorisée.');
      }
    });
  }

  // Prompt Dialogs
  showTextPrompt(): void {
    this.browserPopup.professionalPrompt(
      'Veuillez saisir votre commentaire :',
      '',
      'Commentaire',
      'Votre commentaire ici...'
    ).subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess(`Commentaire enregistré : "${result}"`);
      }
    });
  }

  showEmailPrompt(): void {
    this.browserPopup.emailPrompt(
      'Veuillez saisir votre adresse email :'
    ).subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess(`Email enregistré : ${result}`);
      }
    });
  }

  showPasswordPrompt(): void {
    this.browserPopup.passwordPrompt(
      'Veuillez saisir votre mot de passe :'
    ).subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess('Mot de passe validé.');
      }
    });
  }

  showNumberPrompt(): void {
    this.browserPopup.numberPrompt(
      'Veuillez saisir un nombre :'
    ).subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess(`Nombre saisi : ${result}`);
      }
    });
  }

  showNamePrompt(): void {
    this.browserPopup.namePrompt(
      'Veuillez saisir votre nom complet :'
    ).subscribe(result => {
      if (result) {
        this.browserPopup.quickSuccess(`Bienvenue, ${result} !`);
      }
    });
  }
}
