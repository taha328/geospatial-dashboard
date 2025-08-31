// Example: How to integrate professional notifications in your components

import { Component } from '@angular/core';
import { BrowserPopupReplacementService } from '../../services/popup.service';

@Component({
  selector: 'app-example-component',
  template: `
    <div class="example-container">
      <h2>Example Component with Professional Notifications</h2>

      <div class="action-buttons">
        <button (click)="showAlertExample()">Show Alert</button>
        <button (click)="showConfirmExample()">Show Confirmation</button>
        <button (click)="showPromptExample()">Show Prompt</button>
        <button (click)="showDeleteExample()">Delete Item</button>
        <button (click)="showSaveExample()">Save Changes</button>
      </div>

      <div class="results">
        <p *ngIf="lastResult">Last Result: {{ lastResult }}</p>
      </div>
    </div>
  `
})
export class ExampleComponent {
  lastResult = '';

  constructor(private browserPopup: BrowserPopupReplacementService) {}

  showAlertExample(): void {
    this.browserPopup.professionalAlert(
      'This is a professional alert message!',
      'Information',
      'info'
    ).subscribe(() => {
      this.lastResult = 'Alert acknowledged';
    });
  }

  showConfirmExample(): void {
    this.browserPopup.professionalConfirm(
      'Do you want to proceed with this action?',
      'Confirmation Required'
    ).subscribe((confirmed: boolean) => {
      this.lastResult = confirmed ? 'Action confirmed' : 'Action cancelled';
    });
  }

  showPromptExample(): void {
    this.browserPopup.professionalPrompt(
      'Please enter your name:',
      '',
      'Name Input',
      'Your name here...'
    ).subscribe((name: string | null) => {
      this.lastResult = name ? `Hello, ${name}!` : 'Input cancelled';
    });
  }

  showDeleteExample(): void {
    this.browserPopup.deleteConfirm('user account').subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Perform delete operation
        this.browserPopup.quickSuccess('Account deleted successfully');
        this.lastResult = 'Account deleted';
      } else {
        this.lastResult = 'Delete cancelled';
      }
    });
  }

  showSaveExample(): void {
    this.browserPopup.saveConfirm().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Perform save operation
        this.browserPopup.quickSuccess('Changes saved successfully');
        this.lastResult = 'Changes saved';
      } else {
        this.lastResult = 'Save cancelled';
      }
    });
  }
}

/*
Migration Examples:

// OLD WAY (Browser pop-ups - DON'T USE):
alert('Hello World!');
const confirmed = confirm('Are you sure?');
const name = prompt('Enter name:');

// NEW WAY (Professional notifications - USE THIS):
this.browserPopup.professionalAlert('Hello World!').subscribe();
this.browserPopup.professionalConfirm('Are you sure?').subscribe(confirmed => {});
this.browserPopup.professionalPrompt('Enter name:').subscribe(name => {});

// Quick notifications (non-blocking):
this.browserPopup.quickSuccess('Operation completed!');
this.browserPopup.quickError('Something went wrong!');
this.browserPopup.showLoading('Loading data...');
*/
