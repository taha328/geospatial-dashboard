import Control from 'ol/control/Control';

export interface LegendOptions {
  collapsed?: boolean;
  title?: string;
}

export default class ol_control_Legend extends Control {
  private container: HTMLDivElement;
  private list: HTMLDivElement;
  private items: { [title: string]: HTMLDivElement } = {};
  private collapsed: boolean;

  constructor(options?: LegendOptions) {
    const container = document.createElement('div');
    container.className = 'ol-control ol-legend';

    const titleBtn = document.createElement('button');
    titleBtn.type = 'button';
    titleBtn.className = 'ol-legend-toggle';
    titleBtn.textContent = options?.title || 'Légende';

    const list = document.createElement('div');
    list.className = 'ol-legend-list';

    container.appendChild(titleBtn);
    container.appendChild(list);

    super({ element: container });

    this.container = container;
    this.list = list;
    this.collapsed = !!options?.collapsed;

    titleBtn.addEventListener('click', () => {
      this.setCollapsed(!this.collapsed);
    });

    this.setCollapsed(this.collapsed);
  }

  addItem(title: string, html: string) {
    if (this.items[title]) return;
    const item = document.createElement('div');
    item.className = 'ol-legend-item legend-item';
    item.setAttribute('data-title', title);

    // Create swatch element (default circle)
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch legend-swatch-circle';
  // Inline style to ensure swatch is visible even if component styles are scoped
  swatch.style.width = '14px';
  swatch.style.height = '14px';
  swatch.style.display = 'inline-block';
  swatch.style.flex = '0 0 14px';
  swatch.style.border = '1px solid rgba(0,0,0,0.12)';
  swatch.style.boxSizing = 'border-box';
  swatch.style.borderRadius = '50%';

    // Create label container
    const label = document.createElement('span');
    label.className = 'legend-label';

    // If caller provided HTML markup (contains '<'), use it as innerHTML for label,
    // otherwise treat the input as plain text for the label.
    if (html && html.indexOf('<') !== -1) {
      label.innerHTML = html;
    } else {
      label.textContent = html || title;
    }

    item.appendChild(swatch);
    item.appendChild(label);

    this.list.appendChild(item);
    this.items[title] = item;
  }

  setItemVisibility(title: string, visible: boolean) {
    const item = this.items[title];
    if (!item) return;
    item.style.opacity = visible ? '1' : '0.4';
  }

  setItemSwatch(title: string, color: string, shape: 'circle' | 'rect' = 'circle') {
    const item = this.items[title];
    if (!item) return;
    const swatch = item.querySelector('.legend-swatch') as HTMLElement | null;
    if (!swatch) return;
    swatch.style.backgroundColor = color || '';
    // Ensure shape is applied inline so styles show even when component CSS is scoped
    if (shape === 'circle') {
      swatch.style.borderRadius = '50%';
    } else {
      swatch.style.borderRadius = '2px';
    }
  }

  removeItem(title: string) {
    const item = this.items[title];
    if (!item) return;
    item.remove();
    delete this.items[title];
  }

  clear() {
    Object.values(this.items).forEach(i => i.remove());
    this.items = {};
  }

  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
    const contents = this.list;
    contents.style.display = this.collapsed ? 'none' : 'block';
    if (this.collapsed) {
      this.container.classList.add('ol-collapsed');
    } else {
      this.container.classList.remove('ol-collapsed');
    }
  }
}