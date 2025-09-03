# Frontend Refactoring Guide - Phase 2: Advanced Components

## Overview

This guide covers the advanced components created during Phase 2 of the frontend refactoring, demonstrating the seamless integration of PrimeNG and Angular Material components.

## New Components Created

### 1. Main Layout Component (`main-layout.component`)
A comprehensive layout system that combines PrimeNG sidebar navigation with Angular Material toolbar.

**Features:**
- Responsive sidebar navigation with PrimeNG Menu
- Angular Material toolbar with integrated PrimeNG components
- Dynamic breadcrumb generation
- Mobile-responsive design
- Dark theme support

**Usage:**
```typescript
// In your app.component.html
<app-main-layout>
  <router-outlet></router-outlet>
</app-main-layout>
```

### 2. Data Table Component (`data-table.component`)
Advanced data table with PrimeNG DataTable and Angular Material integration.

**Features:**
- Sorting, filtering, and pagination
- Row selection (single/multiple)
- Custom column types (status, date, currency, etc.)
- Export functionality
- Responsive design
- Action buttons with tooltips

**Usage:**
```typescript
// Component configuration
columns: ColumnDefinition[] = [
  { field: 'name', header: 'Nom', type: 'text', sortable: true, filterable: true },
  { field: 'status', header: 'Statut', type: 'status', sortable: true },
  { field: 'createdAt', header: 'Créé le', type: 'date', sortable: true },
  { field: 'actions', header: 'Actions', type: 'actions' }
];

actions: TableAction[] = [
  { label: 'Modifier', icon: 'pi pi-pencil', command: (row) => this.edit(row) },
  { label: 'Supprimer', icon: 'pi pi-trash', command: (row) => this.delete(row) }
];

// Template usage
<app-data-table
  [data]="assets"
  [columns]="columns"
  [actions]="actions"
  [loading]="loading"
  [selectionMode]="'multiple'"
  title="Gestion des Actifs"
  (selectionChange)="onSelectionChange($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)">
</app-data-table>
```

### 3. Dynamic Form Component (`dynamic-form.component`)
Flexible form builder combining PrimeNG form components with Angular Material design.

**Features:**
- Dynamic field generation
- Multiple field types (text, dropdown, date, file upload, etc.)
- Form validation with custom error messages
- Sectioned forms with collapsible sections
- Progress tracking
- Responsive grid/flex layouts

**Usage:**
```typescript
// Form configuration
sections: FormSection[] = [
  {
    title: 'Informations Générales',
    fields: [
      {
        key: 'name',
        label: 'Nom',
        type: 'text',
        required: true,
        validation: [{ type: 'minLength', value: 3 }]
      },
      {
        key: 'category',
        label: 'Catégorie',
        type: 'dropdown',
        required: true,
        options: [
          { label: 'Infrastructure', value: 'infrastructure' },
          { label: 'Équipement', value: 'equipment' }
        ]
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        hint: 'Description détaillée de l\'actif'
      }
    ]
  }
];

// Template usage
<app-dynamic-form
  [sections]="sections"
  [initialData]="assetData"
  [showProgress]="true"
  submitLabel="Enregistrer l'Actif"
  (formSubmit)="onSubmit($event)"
  (formCancel)="onCancel()">
</app-dynamic-form>
```

## Integration Patterns

### 1. Unified Theming
All components use CSS custom properties for consistent theming:

```scss
// Primary colors
--primary-color: #3b82f6;
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-600: #2563eb;
--primary-800: #1e40af;

// Surface colors
--surface-ground: #f8fafc;
--surface-section: #ffffff;
--surface-card: #ffffff;
--surface-border: #e2e8f0;
--surface-hover: #f1f5f9;

// Text colors
--text-color: #1e293b;
--text-color-secondary: #64748b;
```

### 2. Component Architecture
Components follow a modular architecture with clear separation of concerns:

- **TypeScript**: Business logic and data handling
- **HTML**: Template structure with conditional rendering
- **SCSS**: Styling with CSS custom properties and responsive design

### 3. Responsive Design
All components are fully responsive with mobile-first approach:

```scss
@media (max-width: 768px) {
  .component-container {
    // Mobile-specific styles
  }
}
```

## Migration Strategy

### Phase 2 Implementation Steps

1. **Replace Existing Layout**
   - Replace current layout with `MainLayoutComponent`
   - Update routing to use the new layout structure

2. **Migrate Data Tables**
   - Replace existing tables with `DataTableComponent`
   - Configure columns and actions based on current functionality
   - Update data binding and event handlers

3. **Convert Forms**
   - Replace static forms with `DynamicFormComponent`
   - Define form sections and fields configuration
   - Update form submission and validation logic

4. **Update Styling**
   - Apply unified theme variables
   - Update component-specific styles
   - Test responsive behavior

## Best Practices

### 1. Component Configuration
- Use TypeScript interfaces for type safety
- Provide sensible defaults for optional properties
- Document component inputs and outputs

### 2. Performance Optimization
- Use `OnPush` change detection where appropriate
- Implement lazy loading for large datasets
- Optimize template expressions

### 3. Accessibility
- Include proper ARIA labels
- Support keyboard navigation
- Provide screen reader support

### 4. Error Handling
- Implement proper error boundaries
- Provide user-friendly error messages
- Log errors for debugging

## Code Examples

### Complete Asset Management Component
```typescript
import { Component, OnInit } from '@angular/core';
import { DataTableComponent, ColumnDefinition, TableAction } from '../data-table/data-table.component';
import { DynamicFormComponent, FormSection } from '../dynamic-form/dynamic-form.component';

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [DataTableComponent, DynamicFormComponent],
  template: `
    <div class="asset-management">
      <app-data-table
        [data]="assets"
        [columns]="columns"
        [actions]="actions"
        [loading]="loading"
        title="Gestion des Actifs Portuaires"
        (edit)="onEditAsset($event)"
        (delete)="onDeleteAsset($event)">
      </app-data-table>

      <app-dynamic-form
        *ngIf="showForm"
        [sections]="formSections"
        [initialData]="selectedAsset"
        [showProgress]="true"
        (formSubmit)="onSaveAsset($event)"
        (formCancel)="onCancelEdit()">
      </app-dynamic-form>
    </div>
  `
})
export class AssetManagementComponent implements OnInit {
  // Component implementation
}
```

## Testing Strategy

### Unit Tests
- Test component creation and initialization
- Test input/output bindings
- Test form validation logic
- Test data transformation methods

### Integration Tests
- Test component interactions
- Test data flow between components
- Test API integration
- Test error handling scenarios

### E2E Tests
- Test complete user workflows
- Test responsive behavior
- Test accessibility features
- Test cross-browser compatibility

## Performance Considerations

### 1. Bundle Size
- Tree-shake unused PrimeNG modules
- Lazy load components when possible
- Use Angular's built-in optimization features

### 2. Runtime Performance
- Implement virtual scrolling for large datasets
- Use trackBy functions in ngFor loops
- Optimize change detection strategies

### 3. Memory Management
- Properly unsubscribe from observables
- Clean up event listeners
- Use efficient data structures

## Future Enhancements

### Planned Features
- Advanced filtering with saved filters
- Bulk operations support
- Real-time data updates
- Advanced charting integration
- Multi-language support

### Extensibility
- Plugin architecture for custom field types
- Theme customization API
- Component extension points
- Third-party integration hooks

## Support and Maintenance

### Documentation Updates
- Keep component documentation current
- Update migration guides
- Maintain code examples and demos

### Version Compatibility
- Test with latest Angular and PrimeNG versions
- Monitor deprecation warnings
- Plan migration paths for breaking changes

### Community Contributions
- Welcome component contributions
- Maintain contribution guidelines
- Review and merge pull requests

---

## Quick Reference

### CSS Custom Properties
```scss
:root {
  --primary-color: #3b82f6;
  --surface-ground: #f8fafc;
  --surface-card: #ffffff;
  --text-color: #1e293b;
  --border-radius: 8px;
  --shadow-1: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Common PrimeNG Classes
- `p-button-lg`: Large button
- `p-inputtext-lg`: Large input
- `p-datatable-striped`: Striped table rows
- `p-fieldset-toggleable`: Collapsible fieldset

### Angular Material Integration
- Use `appearance="outline"` for form fields
- Combine with PrimeNG using wrapper elements
- Leverage Material icons with `mat-icon`

This completes Phase 2 of the frontend refactoring. The new components provide a solid foundation for building modern, responsive, and maintainable Angular applications with seamless PrimeNG and Angular Material integration.
