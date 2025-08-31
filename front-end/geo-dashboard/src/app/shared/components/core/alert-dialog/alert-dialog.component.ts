import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AlertDialogData {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="alert-dialog-container" [ngClass]="'alert-type-' + (data.type || 'info')">
      <div class="alert-dialog-header">
        <div class="alert-icon">
          <mat-icon [ngClass]="getIconClass()">{{ getIconName() }}</mat-icon>
        </div>
        <div class="alert-title">
          <h2 mat-dialog-title>{{ data.title || getDefaultTitle() }}</h2>
        </div>
      </div>

      <mat-dialog-content class="alert-dialog-content">
        <p class="alert-message">{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions class="alert-dialog-actions">
        <button mat-raised-button
                color="primary"
                (click)="close()"
                cdkFocusInitial>
          <mat-icon>check</mat-icon>
          OK
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .alert-dialog-container {
      min-width: 350px;
      max-width: 500px;
    }

    .alert-dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .alert-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      flex-shrink: 0;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .alert-title h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
    }

    .alert-dialog-content {
      padding: 0;
      margin-bottom: 24px;

      .alert-message {
        margin: 0;
        font-size: 16px;
        line-height: 1.5;
        color: #495057;
      }
    }

    .alert-dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: 0;
      margin: 0;

      button {
        min-width: 100px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    /* Alert type specific styles */
    .alert-type-info {
      .alert-icon {
        background: linear-gradient(135deg, #17a2b8, #138496);
        color: white;
      }
    }

    .alert-type-success {
      .alert-icon {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
      }
    }

    .alert-type-warning {
      .alert-icon {
        background: linear-gradient(135deg, #ffc107, #fd7e14);
        color: #212529;
      }
    }

    .alert-type-error {
      .alert-icon {
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
      }
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .alert-dialog-container {
        min-width: 300px;
      }

      .alert-dialog-header {
        gap: 12px;
      }

      .alert-icon {
        width: 40px;
        height: 40px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .alert-title h2 {
        font-size: 18px;
      }

      .alert-message {
        font-size: 15px;
      }
    }
  `]
})
export class AlertDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData,
    private dialogRef: MatDialogRef<AlertDialogComponent>
  ) {}

  getIconName(): string {
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info':
      default: return 'info';
    }
  }

  getIconClass(): string {
    return `alert-icon-${this.data.type || 'info'}`;
  }

  getDefaultTitle(): string {
    switch (this.data.type) {
      case 'success': return 'Succès';
      case 'warning': return 'Attention';
      case 'error': return 'Erreur';
      case 'info':
      default: return 'Information';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
