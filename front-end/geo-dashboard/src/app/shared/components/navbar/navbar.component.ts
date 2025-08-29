import { ClassValue } from 'clsx';
import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { mergeClasses } from '@shared/utils/merge-classes';

@Component({
  selector: 'z-navbar',
  exportAs: 'zNavbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav [class]="classes()">
      <div class="flex items-center justify-between h-16 px-4">
        <!-- Logo/Brand -->
        <div class="flex items-center space-x-4">
          <ng-content select="[brand]"></ng-content>
        </div>

        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-4">
          <ng-content select="[nav-links]"></ng-content>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-4">
          <ng-content select="[actions]"></ng-content>
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button
            (click)="toggleMobileMenu()"
            class="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
          >
            <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
              @if (!isMobileMenuOpen) {
                <path
                  fill-rule="evenodd"
                  d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                />
              } @else {
                <path
                  fill-rule="evenodd"
                  d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 0 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                />
              }
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      @if (isMobileMenuOpen) {
        <div class="md:hidden border-t border-gray-200 bg-white">
          <div class="px-2 pt-2 pb-3 space-y-1">
            <ng-content select="[mobile-nav-links]"></ng-content>
          </div>
        </div>
      }
    </nav>
  `,
  host: {
    '[class]': 'classes()',
  },
})
export class ZardNavbarComponent {
  readonly class = input<ClassValue>('');
  isMobileMenuOpen = false;

  protected readonly classes = computed(() =>
    mergeClasses(
      'bg-white shadow-sm border-b border-gray-200',
      this.class()
    )
  );

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
