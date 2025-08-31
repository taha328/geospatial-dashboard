import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog-container" [ngClass]="'confirm-type-' + (data.type || 'info')">
      <div class="confirm-dialog-header">
        <div class="confirm-icon">
          <mat-icon [ngClass]="getIconClass()">{{ getIconName() }}</mat-icon>
        </div>
        <div class="confirm-title">
          <h2 mat-dialog-title>{{ data.title || getDefaultTitle() }}</h2>
        </div>
      </div>

      <mat-dialog-content class="confirm-dialog-content">
        <p class="confirm-message">{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions class="confirm-dialog-actions">
        <button mat-button
                (click)="cancel()"
                class="cancel-button">
          <mat-icon>close</mat-icon>
          {{ data.cancelText || 'Annuler' }}
        </button>
        <button mat-raised-button
                [color]="getConfirmButtonColor()"
                (click)="confirm()"
                cdkFocusInitial
                class="confirm-button">
          <mat-icon>{{ getConfirmIcon() }}</mat-icon>
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog-container {
      min-width: 400px;
      max-width: 500px;
    }

    .confirm-dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .confirm-icon {
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

    .confirm-title h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
    }

    .confirm-dialog-content {
      padding: 0;
      margin-bottom: 24px;

      .confirm-message {
        margin: 0;
        font-size: 16px;
        line-height: 1.5;
        color: #495057;
      }
    }

    .confirm-dialog-actions {
      display: flex;
      justify-content: space-between;
      padding: 0;
      margin: 0;

      button {
        min-width: 100px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cancel-button {
        background: rgba(108, 117, 125, 0.1);
        color: #6c757d;

        &:hover {
          background: rgba(108, 117, 125, 0.2);
        }
      }

      .confirm-button {
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    /* Confirm type specific styles */
    .confirm-type-info {
      .confirm-icon {
        background: linear-gradient(135deg, #17a2b8, #138496);
        color: white;
      }
    }

    .confirm-type-success {
      .confirm-icon {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
      }
    }

    .confirm-type-warning {
      .confirm-icon {
        background: linear-gradient(135deg, #ffc107, #fd7e14);
        color: #212529;
      }
    }

    .confirm-type-error {
      .confirm-icon {
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
      }
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .confirm-dialog-container {
        min-width: 350px;
      }

      .confirm-dialog-header {
        gap: 12px;
      }

      .confirm-icon {
        width: 40px;
        height: 40px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .confirm-title h2 {
        font-size: 18px;
      }

      .confirm-message {
        font-size: 15px;
      }

      .confirm-dialog-actions {
        flex-direction: column-reverse;
        gap: 12px;

        button {
          width: 100%;
          min-width: unset;
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    private dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  getIconName(): string {
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info':
      default: return 'help';
    }
  }

  getIconClass(): string {
    return `confirm-icon-${this.data.type || 'info'}`;
  }

  getDefaultTitle(): string {
    switch (this.data.type) {
      case 'success': return 'Confirmation';
      case 'warning': return 'Attention requise';
      case 'error': return 'Action dangereuse';
      case 'info':
      default: return 'Confirmation';
    }
  }

  getConfirmButtonColor(): string {
    switch (this.data.type) {
      case 'error': return 'warn';
      case 'warning': return 'accent';
      case 'success': return 'primary';
      case 'info':
      default: return 'primary';
    }
  }

  getConfirmIcon(): string {
    switch (this.data.type) {
      case 'error': return 'delete';
      case 'warning': return 'warning';
      case 'success': return 'check';
      case 'info':
      default: return 'check';
    }
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
