# Professional Notification System

This system replaces default browser pop-ups (alert, confirm, prompt) with professional Angular Material components that match your application's design system.

## 🚀 Quick Start

### 1. Inject the Service

```typescript
import { BrowserPopupReplacementService } from './services/popup.service';

constructor(private browserPopup: BrowserPopupReplacementService) {}
```

### 2. Replace Browser Pop-ups

```typescript
// Before (Browser pop-ups)
alert('Hello World!');
const confirmed = confirm('Are you sure?');
const name = prompt('Enter your name:');

// After (Professional components)
this.browserPopup.professionalAlert('Hello World!').subscribe();
this.browserPopup.professionalConfirm('Are you sure?').subscribe(confirmed => {
  // Handle confirmation
});
this.browserPopup.professionalPrompt('Enter your name:').subscribe(name => {
  // Handle input
});
```

## 📋 API Reference

### BrowserPopupReplacementService

#### Alert Methods
```typescript
// Basic alert
professionalAlert(message: string, title?: string, type?: 'info' | 'success' | 'warning' | 'error'): Observable<void>

// Quick alerts
successAlert(message: string, title?: string): Observable<void>
errorAlert(message: string, title?: string): Observable<void>
warningAlert(message: string, title?: string): Observable<void>
infoAlert(message: string, title?: string): Observable<void>
```

#### Confirmation Methods
```typescript
// Basic confirmation
professionalConfirm(message: string, title?: string, type?: 'info' | 'success' | 'warning' | 'error'): Observable<boolean>

// Quick confirmations
deleteConfirm(itemName?: string): Observable<boolean>
saveConfirm(): Observable<boolean>
navigationConfirm(): Observable<boolean>
```

#### Prompt Methods
```typescript
// Basic prompt
professionalPrompt(
  message: string,
  defaultValue?: string,
  title?: string,
  placeholder?: string,
  type?: 'text' | 'email' | 'password' | 'number',
  required?: boolean
): Observable<string | null>

// Quick prompts
emailPrompt(message: string, defaultValue?: string): Observable<string | null>
passwordPrompt(message: string): Observable<string | null>
namePrompt(message: string, defaultValue?: string): Observable<string | null>
numberPrompt(message: string, defaultValue?: string): Observable<string | null>
```

#### Snackbar Methods (Non-blocking)
```typescript
quickSuccess(message: string): void
quickError(message: string): void
quickWarning(message: string): void
quickInfo(message: string): void
showLoading(message?: string): void
dismiss(): void
```

## 🎨 Features

### ✅ Professional Design
- Angular Material components with custom styling
- Consistent with your application's design system
- Gradient backgrounds and modern UI elements

### 📱 Responsive
- Fully responsive design for all screen sizes
- Mobile-optimized layouts and interactions
- Touch-friendly interface elements

### 🎯 User Experience
- Smooth animations and transitions
- Proper focus management
- Keyboard navigation support
- Loading states and feedback

### 🔧 Developer Experience
- TypeScript support with full type safety
- Observable-based API for reactive programming
- Easy-to-use service methods
- Comprehensive error handling

## 📝 Usage Examples

### Basic Alert
```typescript
this.browserPopup.professionalAlert(
  'Your changes have been saved successfully.',
  'Success',
  'success'
).subscribe(() => {
  // User acknowledged the alert
  console.log('Alert acknowledged');
});
```

### Confirmation Dialog
```typescript
this.browserPopup.professionalConfirm(
  'Are you sure you want to delete this item?',
  'Delete Confirmation',
  'warning'
).subscribe(confirmed => {
  if (confirmed) {
    // User confirmed
    this.deleteItem();
  } else {
    // User cancelled
    console.log('Deletion cancelled');
  }
});
```

### Input Prompt
```typescript
this.browserPopup.professionalPrompt(
  'Please enter your email address:',
  '',
  'Email Required',
  'your.email@example.com',
  'email',
  true
).subscribe(email => {
  if (email) {
    // User provided input
    this.saveEmail(email);
  } else {
    // User cancelled
    console.log('Email input cancelled');
  }
});
```

### Quick Snackbar
```typescript
// Non-blocking notification
this.browserPopup.quickSuccess('Data saved successfully!');

// With action button
this.professionalNotification.success(
  'File uploaded successfully!',
  'View File'
);
```

## 🏗️ Architecture

### Services

1. **BrowserPopupReplacementService**
   - Main service for replacing browser pop-ups
   - Provides easy-to-use methods for common scenarios
   - Handles all dialog and snackbar interactions

2. **ProfessionalNotificationService**
   - Core notification service using Angular Material
   - Provides low-level control over dialogs and snackbars
   - Handles complex notification scenarios

### Components

1. **AlertDialogComponent**
   - Professional alert dialogs
   - Supports different alert types (info, success, warning, error)
   - Fully responsive and accessible

2. **ConfirmDialogComponent**
   - Professional confirmation dialogs
   - Customizable button text and styling
   - Type-based visual indicators

3. **PromptDialogComponent**
   - Professional input dialogs
   - Support for different input types
   - Form validation and error handling

## 🎨 Customization

### Styling
The notification system uses custom SCSS that matches your application's design system. You can customize:

- Colors and gradients
- Typography and spacing
- Animations and transitions
- Responsive breakpoints

### Configuration
```typescript
// Custom snackbar configuration
private defaultSnackBarConfig: MatSnackBarConfig = {
  duration: 5000,
  horizontalPosition: 'center',
  verticalPosition: 'bottom',
  panelClass: ['professional-snackbar']
};
```

## 🔧 Migration Guide

### Step 1: Replace alert()
```typescript
// Before
alert('Hello World!');

// After
this.browserPopup.professionalAlert('Hello World!').subscribe();
```

### Step 2: Replace confirm()
```typescript
// Before
if (confirm('Are you sure?')) {
  // Do something
}

// After
this.browserPopup.professionalConfirm('Are you sure?').subscribe(confirmed => {
  if (confirmed) {
    // Do something
  }
});
```

### Step 3: Replace prompt()
```typescript
// Before
const name = prompt('Enter your name:');
if (name) {
  // Use name
}

// After
this.browserPopup.professionalPrompt('Enter your name:').subscribe(name => {
  if (name) {
    // Use name
  }
});
```

## 🚀 Demo Component

A complete demo component is available at `src/app/components/notification-demo/` that showcases all available notification types and usage patterns.

## 📋 Best Practices

1. **Use appropriate notification types** - Choose the right type (info, success, warning, error) for your message
2. **Keep messages concise** - Users should quickly understand the notification
3. **Handle all user responses** - Always subscribe to observables and handle both success and cancellation
4. **Use loading states** - Show loading notifications for long-running operations
5. **Test on mobile** - Ensure notifications work well on all screen sizes

## 🐛 Troubleshooting

### Common Issues

1. **Dialog not showing**
   - Ensure Angular Material is properly imported
   - Check that the service is injected correctly

2. **Styling not applied**
   - Verify that the professional-notifications.scss is imported
   - Check for CSS specificity conflicts

3. **Observable not firing**
   - Make sure to subscribe to the observable
   - Check for import issues

### Debug Mode
Enable debug logging by setting the environment variable:
```typescript
// In your component
console.log('Notification result:', result);
```

## 📞 Support

For questions or issues with the notification system, please refer to:
- Component documentation
- Angular Material documentation
- Application style guide

---

**Note:** This system provides a professional, consistent way to handle user notifications while maintaining the familiar API patterns of browser pop-ups.
