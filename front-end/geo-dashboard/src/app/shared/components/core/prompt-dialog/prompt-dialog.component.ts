import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface PromptDialogData {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
}

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="prompt-dialog-container">
      <div class="prompt-dialog-header">
        <div class="prompt-icon">
          <mat-icon>edit</mat-icon>
        </div>
        <div class="prompt-title">
          <h2 mat-dialog-title>{{ data.title || 'Saisie requise' }}</h2>
        </div>
      </div>

      <mat-dialog-content class="prompt-dialog-content">
        <p class="prompt-message">{{ data.message }}</p>

        <form [formGroup]="promptForm" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ data.placeholder || 'Votre réponse' }}</mat-label>
            <input matInput
                   [type]="getInputType()"
                   [formControlName]="'inputValue'"
                   [placeholder]="data.placeholder || ''"
                   cdkFocusInitial>
            <mat-icon matSuffix *ngIf="data.type === 'password'"
                      (click)="togglePasswordVisibility()"
                      class="password-toggle">
              {{ showPassword ? 'visibility_off' : 'visibility' }}
            </mat-icon>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="prompt-dialog-actions">
        <button mat-button
                (click)="cancel()"
                class="cancel-button">
          <mat-icon>close</mat-icon>
          {{ data.cancelText || 'Annuler' }}
        </button>
        <button mat-raised-button
                color="primary"
                (click)="submit()"
                [disabled]="promptForm.invalid"
                class="confirm-button">
          <mat-icon>check</mat-icon>
          {{ data.confirmText || 'Valider' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .prompt-dialog-container {
      min-width: 400px;
      max-width: 500px;
    }

    .prompt-dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .prompt-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      flex-shrink: 0;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .prompt-title h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
    }

    .prompt-dialog-content {
      padding: 0;
      margin-bottom: 24px;

      .prompt-message {
        margin: 0 0 20px 0;
        font-size: 16px;
        line-height: 1.5;
        color: #495057;
      }

      .full-width {
        width: 100%;
      }

      .password-toggle {
        cursor: pointer;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }
    }

    .prompt-dialog-actions {
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

    /* Form field styling */
    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        background: rgba(255, 255, 255, 0.8);
      }

      .mat-mdc-form-field-focus-overlay {
        background: rgba(52, 152, 219, 0.1);
      }
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .prompt-dialog-container {
        min-width: 350px;
      }

      .prompt-dialog-header {
        gap: 12px;
      }

      .prompt-icon {
        width: 40px;
        height: 40px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .prompt-title h2 {
        font-size: 18px;
      }

      .prompt-message {
        font-size: 15px;
      }

      .prompt-dialog-actions {
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
export class PromptDialogComponent implements OnInit {
  promptForm: FormGroup;
  showPassword = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData,
    private dialogRef: MatDialogRef<PromptDialogComponent>,
    private fb: FormBuilder
  ) {
    this.promptForm = this.fb.group({
      inputValue: [this.data.defaultValue || '', this.getValidators()]
    });
  }

  ngOnInit(): void {
    // Set initial value if provided
    if (this.data.defaultValue) {
      this.promptForm.patchValue({
        inputValue: this.data.defaultValue
      });
    }
  }

  getValidators() {
    const validators = [];

    if (this.data.required) {
      validators.push(Validators.required);
    }

    switch (this.data.type) {
      case 'email':
        validators.push(Validators.email);
        break;
      case 'number':
        // Could add number validation here if needed
        break;
    }

    return validators;
  }

  getInputType(): string {
    if (this.data.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.data.type || 'text';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.promptForm.valid) {
      const value = this.promptForm.value.inputValue;
      this.dialogRef.close(value);
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
