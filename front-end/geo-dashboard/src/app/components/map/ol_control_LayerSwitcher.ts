import { unByKey } from 'ol/Observable.js';
import { EventsKey } from 'ol/events.js'; // Correct import path
import Control, { Options as ControlOptions } from 'ol/control/Control.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorImageLayer from 'ol/layer/VectorImage.js';
import ImageLayer from 'ol/layer/Image.js';
import Heatmap from 'ol/layer/Heatmap.js';
import { intersects as ol_extent_intersects } from 'ol/extent.js';
import Map from 'ol/Map.js';
import Layer from 'ol/layer/Layer.js';
import LayerGroup from 'ol/layer/Group.js';
import Collection from 'ol/Collection.js';
import { Source } from 'ol/source.js';
import BaseLayer from 'ol/layer/Base.js';
import BaseEvent from 'ol/events/Event.js';
import TileSource from 'ol/source/Tile.js';

// FIXED: Create custom element utility to replace ol_ext_element
class ElementUtil {
  static create(tagName: string, options: any = {}): any {
    const element = document.createElement(tagName);
    
    // Handle className
    if (options.className || options.class) {
      element.className = options.className || options.class;
    }
    
    // Handle parent - append to parent if provided
    if (options.parent) {
      // Ensure parent is a valid DOM element
      if (options.parent && options.parent.appendChild) {
        options.parent.appendChild(element);
      }
    }
    
    // Handle text content
    if (options.text !== undefined) {
      element.textContent = options.text;
    }
    
    // Handle HTML content - FIXED: Better null/undefined checking
    if (options.html !== undefined && options.html !== null) {
      if (typeof options.html === 'string') {
        element.innerHTML = options.html;
      } else if (options.html && typeof options.html === 'object' && options.html.nodeType === 1) {
        // Ensure it's a valid DOM element before appending
        element.appendChild(options.html);
      }
    }
    
    // Handle styles
    if (options.style) {
      Object.assign(element.style, options.style);
    }
    
    // Handle type for inputs
    if (options.type) {
      (element as HTMLInputElement).type = options.type;
    }
    
    // Handle checked for inputs
    if (options.checked !== undefined) {
      (element as HTMLInputElement).checked = options.checked;
    }
    
    // Handle title
    if (options.title) {
      element.title = options.title;
    }
    
    // Handle click events
    if (options.click) {
      element.addEventListener('click', options.click);
    }
    
    // Handle event listeners (on object)
    if (options.on) {
      Object.entries(options.on).forEach(([event, handler]) => {
        element.addEventListener(event, handler as EventListener);
      });
    }
    
    return element;
  }
  
  static setHTML(element: HTMLElement, content: string | HTMLElement): void {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else {
      element.innerHTML = '';
      element.appendChild(content);
    }
  }
  
  static addListener(element: HTMLElement, events: string, handler: EventListener): void {
    events.split(' ').forEach(event => {
      element.addEventListener(event, handler);
    });
  }
  
  static getStyle(element: HTMLElement, property: string): number {
    const computed = window.getComputedStyle(element);
    return parseFloat(computed.getPropertyValue(property)) || 0;
  }
  
  static setStyle(element: HTMLElement, styles: Record<string, any>): void {
    Object.assign(element.style, styles);
  }
  
  static outerHeight(element: HTMLElement): number {
    const computed = window.getComputedStyle(element);
    return element.offsetHeight + 
           parseFloat(computed.marginTop || '0') + 
           parseFloat(computed.marginBottom || '0');
  }
  
  static hidden(element: HTMLElement): boolean {
    return element.offsetParent === null;
  }
  
  static hide(element: HTMLElement): void {
    element.style.display = 'none';
  }
  
  static show(element: HTMLElement): void {
    element.style.display = '';
  }
  
  static scrollDiv(container: HTMLElement, options: any): any {
    // Simplified scroll implementation
    return {
      refresh: () => {}
    };
  }
}

const ol_ext_element = ElementUtil;

interface LayerSwitcherOptions extends ControlOptions {
  selection?: boolean;
  displayInLayerSwitcher?: (layer: BaseLayer) => boolean;
  show_progress?: boolean;
  mouseover?: boolean;
  reordering?: boolean;
  trash?: boolean;
  oninfo?: (layer: BaseLayer) => void;
  extent?: boolean;
  onextent?: (layer: BaseLayer) => void;
  drawDelay?: number;
  collapsed?: boolean;
  layerGroup?: LayerGroup;
  noScroll?: boolean;
  counter?: boolean;
  onchangeCheck?: (layer: BaseLayer) => void;
  switcherClass?: string;
  minibar?: boolean;
}

interface LayerItem {
  li: HTMLLIElement | null;
  layer: BaseLayer;
  listeners: EventsKey[];
}

interface LayerSwitcherEventProps {
  collapsed?: boolean;
  layer?: BaseLayer | null;
  group?: BaseLayer | null;
  li?: HTMLLIElement;
  key?: string;
  originalEvent?: Event;
}

class LayerSwitcherEvent extends BaseEvent {
    public readonly collapsed?: boolean;
    public readonly layer?: BaseLayer | null;
    public readonly group?: BaseLayer | null;
    public readonly li?: HTMLLIElement;
    public readonly key?: string;
    public readonly originalEvent?: Event;

    constructor(type: string, props: LayerSwitcherEventProps = {}) {
        super(type);
        this.collapsed = props.collapsed;
        this.layer = props.layer;
        this.group = props.group;
        this.li = props.li;
        this.key = props.key;
        this.originalEvent = props.originalEvent;
    }
}

class ol_control_LayerSwitcher extends Control {
  private dcount: number;
  private show_progress: boolean;
  public oninfo: ((layer: BaseLayer) => void) | null;
  public onextent: ((layer: BaseLayer) => void) | null;
  private hasextent: boolean;
  private hastrash: boolean;
  private reordering: boolean;
  private _layers: LayerItem[];
  private _layerGroup: LayerGroup | null;
  public onchangeCheck: ((layer: BaseLayer) => void) | null;
  private counter!: HTMLSpanElement;
  private button!: HTMLButtonElement;
  private topv!: HTMLDivElement;
  private botv!: HTMLDivElement;
  private _noScroll!: boolean;
  private panel_: HTMLUListElement;
  private panelContainer_: HTMLDivElement;
  private header_: HTMLLIElement;
  private _listener: { [key: string]: EventsKey | EventsKey[] } | null = null;
  private dragging_: boolean = false;
  private _selectedLayer?: BaseLayer;
  private _focus?: BaseLayer;

  public tip = {
    up: "up/down",
    down: "down",
    info: "informations...",
    extent: "zoom to extent",
    trash: "remove layer",
    plus: "expand/shrink"
  };

  constructor(options: LayerSwitcherOptions = {}) {
    const element = ol_ext_element.create('div', {
      className: options.switcherClass || 'ol-layerswitcher',
      style: {
        minWidth: '160px',
        width: '160px', 
        maxWidth: '160px',
        flexShrink: '0',
        boxSizing: 'border-box'
      }
    });
    super({
      element: element,
      target: options.target
    });

    const self = this;
    this.dcount = 0;
    this.show_progress = !!options.show_progress;
    this.oninfo = (typeof (options.oninfo) == 'function' ? options.oninfo : null);
    this.onextent = (typeof (options.onextent) == 'function' ? options.onextent : null);
    this.hasextent = !!options.extent || !!options.onextent;
    this.hastrash = false; // Disabled to prevent accidental layer deletion
    this.reordering = (options.reordering !== false);
    this._layers = [];
    this._layerGroup = (options.layerGroup instanceof LayerGroup) ? options.layerGroup : null;
    this.onchangeCheck = (typeof (options.onchangeCheck) == "function" ? options.onchangeCheck : null);

    if (typeof (options.displayInLayerSwitcher) === 'function') {
      this.displayInLayerSwitcher = options.displayInLayerSwitcher;
    }

    if (!options.target) {
      element.classList.add('ol-unselectable', 'ol-control');
      element.classList.add(options.collapsed !== false ? 'ol-collapsed' : 'ol-forceopen');
      if (options.counter) element.classList.add('ol-counter');

      this.counter = ol_ext_element.create('span', {
        class: 'ol-counter',
        text: 0,
        parent: element
      });
      this.button = ol_ext_element.create('button', {
        type: 'button',
        parent: element
      });

      this.button.addEventListener('touchstart', (e: TouchEvent) => {
        element.classList.toggle('ol-forceopen');
        element.classList.add('ol-collapsed');
        self.dispatchEvent(new LayerSwitcherEvent('toggle', { collapsed: element.classList.contains('ol-collapsed') }));
        e.preventDefault();
        self.overflow();
      });
      this.button.addEventListener('click', () => {
        element.classList.toggle('ol-forceopen');
        element.classList.add('ol-collapsed');
        self.dispatchEvent(new LayerSwitcherEvent('toggle', { collapsed: !element.classList.contains('ol-forceopen') }));
        self.overflow();
      });

      if (options.mouseover) {
        element.addEventListener('mouseleave', () => {
          element.classList.add("ol-collapsed");
          self.dispatchEvent(new LayerSwitcherEvent('toggle', { collapsed: true }));
        });
        element.addEventListener('mouseover', () => {
          element.classList.remove("ol-collapsed");
          self.dispatchEvent(new LayerSwitcherEvent('toggle', { collapsed: false }));
        });
      }

      if (options.minibar) options.noScroll = true;
      if (!options.noScroll) {
        this.topv = ol_ext_element.create('div', {
          className: 'ol-switchertopdiv',
          parent: element,
          click: () => { self.overflow("+50%"); }
        });
        this.botv = ol_ext_element.create('div', {
          className: 'ol-switcherbottomdiv',
          parent: element,
          click: () => { self.overflow("-50%"); }
        });
      }
      this._noScroll = !!options.noScroll;
    }

    this.panel_ = ol_ext_element.create('ul', { 
      className: 'panel',
      style: {
        width: '160px',
        minWidth: '160px',
        maxWidth: '160px',
        flexShrink: '0',
        flexBasis: '160px',
        boxSizing: 'border-box'
      }
    });
    this.panelContainer_ = ol_ext_element.create('div', {
      className: 'panel-container',
      html: this.panel_,
      parent: element,
      style: {
        width: '160px',
        minWidth: '160px',
        maxWidth: '160px',
        flexShrink: '0'
      }
    });

    if (!options.target && !options.noScroll) {
      ol_ext_element.addListener(this.panel_, 'mousewheel DOMMouseScroll onmousewheel', (e: Event) => {
        const wheelEvent = e as WheelEvent;
        if (self.overflow(Math.max(-1, Math.min(1, (-(wheelEvent as any).deltaY || (wheelEvent as any).detail))))) {
          wheelEvent.stopPropagation();
          wheelEvent.preventDefault();
        }
      });
    }

    this.header_ = ol_ext_element.create('li', {
      className: 'ol-header',
      parent: this.panel_
    });

    this.set('drawDelay', options.drawDelay || 0);
    this.set('selection', options.selection);

    if (options.minibar) {
      setTimeout(() => {
        const mbar = ol_ext_element.scrollDiv(this.panelContainer_, {
          mousewheel: true, vertical: true, minibar: true
        });
        const refresh = () => mbar.refresh();
        this.on('drawlist' as any, refresh);
        this.on('toggle' as any, refresh);
      }, 0);
    }
  }

  displayInLayerSwitcher(layer: BaseLayer): boolean {
    return (layer.get('displayInLayerSwitcher') !== false);
  }

  override setMap(map: Map | null): void {
    super.setMap(map);
    this.drawPanel();

    if (this._listener) {
      Object.values(this._listener).forEach(key => unByKey(key as EventsKey | EventsKey[]));
    }
    this._listener = null;

    if (map) {
      this._listener = {
        moveend: map.on('moveend', this.viewChange.bind(this)),
        // FIX: Wrap the call in an arrow function to match the event listener signature.
        size: map.on('change:size' as any, () => this.overflow())
      };
      const layers = this._layerGroup ? this._layerGroup.getLayers() : map.getLayers();
      this._listener['change'] = layers.on('change:length', this.drawPanel.bind(this));
    }
  }

  show(): void {
    this.element.classList.add('ol-forceopen');
    this.overflow();
    this.dispatchEvent(new LayerSwitcherEvent('toggle', { collapsed: false }));
  }

  hide(): void {
    this.element.classList.remove('ol-forceopen');
    this.overflow();
    this.dispatchEvent(new LayerSwitcherEvent('toggle', { collapsed: true }));
  }

  toggle(): void {
    this.element.classList.toggle("ol-forceopen");
    this.overflow();
    this.dispatchEvent(new LayerSwitcherEvent('toggle', { collapsed: !this.isOpen() }));
  }

  isOpen(): boolean {
    return this.element.classList.contains("ol-forceopen");
  }

  setHeader(html: Element | string): void {
    const htmlParam = typeof html === 'string' ? html : html as HTMLElement;
    ol_ext_element.setHTML(this.header_ as HTMLElement, htmlParam);
  }

  private overflow(dir?: number | string): boolean {
    if (this.button && !this._noScroll) {
      if (ol_ext_element.hidden(this.panel_)) {
        ol_ext_element.setStyle(this.element, { height: 'auto' });
        return false;
      }
      const h = ol_ext_element.outerHeight(this.element);
      const hp = ol_ext_element.outerHeight(this.panel_);
      const dh = this.button.offsetTop + ol_ext_element.outerHeight(this.button);
      let top = this.panel_.offsetTop - dh;

      if (hp > h - dh) {
        ol_ext_element.setStyle(this.element, { height: '100%' });
        const li = this.panel_.querySelector('li.ol-visible .li-content');
        const lh = li ? 2 * ol_ext_element.getStyle(li as HTMLElement, 'height') : 0;

        switch (dir) {
          case 1: top += lh; break;
          case -1: top -= lh; break;
          case "+50%": top += Math.round(h / 2); break;
          case "-50%": top -= Math.round(h / 2); break;
        }

        if (top + hp <= h - (3 * dh / 2)) {
          top = h - (3 * dh / 2) - hp;
          ol_ext_element.hide(this.botv);
        } else {
          ol_ext_element.show(this.botv);
        }
        if (top >= 0) {
          top = 0;
          ol_ext_element.hide(this.topv);
        } else {
          ol_ext_element.show(this.topv);
        }
        ol_ext_element.setStyle(this.panel_, { top: `${top}px` });
        return true;
      } else {
        ol_ext_element.setStyle(this.element, { height: "auto" });
        ol_ext_element.setStyle(this.panel_, { top: 0 });
        ol_ext_element.hide(this.botv);
        ol_ext_element.hide(this.topv);
        return false;
      }
    }
    return false;
  }

  private _setLayerForLI(li: HTMLLIElement | null, layer: BaseLayer): void {
    const listeners: EventsKey[] = [];
    if (layer instanceof LayerGroup) {
      listeners.push(layer.getLayers().on('change:length', this.drawPanel.bind(this)));
    }
    if (li) {
      if (layer instanceof Layer) {
        listeners.push(layer.on('change:opacity', () => this.setLayerOpacity(layer as Layer<Source>, li)));
      }
      listeners.push(layer.on('change:visible', () => this.setLayerVisibility(layer, li)));
    }
    listeners.push(layer.on('propertychange', (e) => {
      if (['displayInLayerSwitcher', 'openInLayerSwitcher', 'title', 'name'].includes(e.key)) {
        this.drawPanel();
      }
    }));
    this._layers.push({ li, layer, listeners });
  }

  setLayerOpacity(layer: Layer<Source>, li: HTMLLIElement): void {
    const i = li.querySelector<HTMLElement>('.layerswitcher-opacity-cursor');
    if (i) {
      i.style.left = `${layer.getOpacity() * 100}%`;
    }
    this.dispatchEvent(new LayerSwitcherEvent('layer:opacity', { layer }));
  }

  setLayerVisibility(layer: BaseLayer, li: HTMLLIElement): void {
    const i = li.querySelector<HTMLInputElement>('.ol-visibility');
    if (i) i.checked = layer.getVisible();
    li.classList.toggle('ol-visible', layer.getVisible());
    this.dispatchEvent(new LayerSwitcherEvent('layer:visible', { layer }));
  }

  private _clearLayerForLI(): void {
    this._layers.forEach(item => item.listeners.forEach(l => unByKey(l)));
    this._layers = [];
  }

  private _getLayerForLI(li: Element | null): BaseLayer | null {
    if (!li) return null;
    return this._layers.find(item => item.li === li)?.layer || null;
  }

  private viewChange(): void {
    this.panel_.querySelectorAll('li').forEach(li => {
      const layer = this._getLayerForLI(li);
      if (layer) {
        li.classList.toggle('ol-layer-hidden', !this.testLayerVisibility(layer));
      }
    });
  }

  getPanel(): HTMLDivElement {
    return this.panelContainer_;
  }

  drawPanel(): void {
    if (!this.getMap()) return;
    this.dcount++;
    setTimeout(() => this.drawPanel_(), this.get('drawDelay') || 0);
  }

  private drawPanel_(): void {
    if (--this.dcount || this.dragging_) return;

    const scrollTop = this.panelContainer_.scrollTop;
    this._clearLayerForLI();
    this.panel_.querySelectorAll('li:not(.ol-header)').forEach(li => li.remove());

    const map = this.getMap();
    if (map) {
      const layers = this._layerGroup ? this._layerGroup.getLayers() : map.getLayers();
      this.drawList(this.panel_, layers);
    }

    this.panelContainer_.scrollTop = scrollTop;
    if (this.counter) {
      this.counter.innerHTML = this.panel_.querySelectorAll('li:not(.ol-header)').length.toString();
    }
  }

  private switchLayerVisibility(layer: BaseLayer, layers: Collection<BaseLayer>): void {
    if (!layer.get('baseLayer')) {
      layer.setVisible(!layer.getVisible());
    } else {
      if (!layer.getVisible()) layer.setVisible(true);
      layers.forEach(l => {
        if (l !== layer && l.get('baseLayer') && l.getVisible()) {
          l.setVisible(false);
        }
      });
    }
  }

  private testLayerVisibility(layer: BaseLayer): boolean {
    const map = this.getMap();
    if (!map) return true;
    const view = map.getView();
    const res = view.getResolution();
    const zoom = view.getZoom();

    if (res === undefined || zoom === undefined) return true;
    if (layer.getMaxResolution() <= res || layer.getMinResolution() >= res) return false;
    if (layer instanceof Layer && (layer.getMinZoom() >= zoom || layer.getMaxZoom() < zoom)) return false;

    const ex0 = layer.getExtent();
    if (ex0) {
      const ex = view.calculateExtent(map.getSize());
      return ol_extent_intersects(ex, ex0);
    }
    return true;
  }

  private dragOrdering_(e: MouseEvent | TouchEvent): void {
    e.stopPropagation();
    e.preventDefault();

    const self = this;
    const elt = (e.currentTarget as HTMLElement).closest('li') as HTMLLIElement;
    let start = true;
    const panel = this.panel_;
    const pageY0 = (e as TouchEvent).touches?.[0].pageY ?? (e as MouseEvent).pageY;
    let targetLayer: BaseLayer | null | false;
    let dragElt: HTMLLIElement | undefined;
    let layer: BaseLayer | null = this._getLayerForLI(elt);
    let group: BaseLayer | null = this._getLayerForLI(elt.parentElement!.closest('li')!);
    (elt.parentElement as HTMLElement).classList.add('drag');

    const stop = () => {
      if (targetLayer && layer) {
        const isSelected = self.getSelection() === layer;
        let collection: Collection<BaseLayer>;
        if (group && group instanceof LayerGroup) {
          collection = group.getLayers();
        } else {
          const map = self.getMap();
          if (!map) return;
          collection = self._layerGroup ? self._layerGroup.getLayers() : map.getLayers();
        }
        
        const layers = collection.getArray();
        const dropIndex = layers.indexOf(layer);
        if (dropIndex > -1) collection.removeAt(dropIndex);

        const targetIndex = layers.indexOf(targetLayer as BaseLayer);
        if (targetIndex > -1) {
            collection.insertAt(dropIndex > targetIndex ? targetIndex : targetIndex + 1, layer);
        }

        if (isSelected) self.selectLayer(layer);
        self.dispatchEvent(new LayerSwitcherEvent("reorder-end", { layer, group }));
      }

      panel.querySelectorAll('li').forEach(li => li.classList.remove('dropover', 'dropover-after', 'dropover-before'));
      elt.classList.remove("drag");
      (elt.parentElement as HTMLElement).classList.remove("drag");
      self.element.classList.remove('drag');
      dragElt?.remove();

      document.removeEventListener('mousemove', move);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchend', stop);
      document.removeEventListener('touchcancel', stop);
    };

    const move = (e: MouseEvent | TouchEvent) => {
      const pageY = (e as TouchEvent).touches?.[0].pageY ?? (e as MouseEvent).pageY;
      if (pageY === undefined || pageY0 === undefined) return;

      if (start && Math.abs(pageY0 - pageY) > 2) {
        start = false;
        elt.classList.add("drag");
        targetLayer = false;
        dragElt = ol_ext_element.create('li', {
          className: 'ol-dragover', html: elt.innerHTML,
          style: {
            position: "absolute", zIndex: 10000, left: `${elt.offsetLeft}px`,
            opacity: 0.5, width: `${elt.offsetWidth}px`, height: `${elt.offsetHeight}px`
          },
          parent: panel
        });
        self.element.classList.add('drag');
        self.dispatchEvent(new LayerSwitcherEvent("reorder-start", { layer, group }));
      }

      if (!start) {
        e.preventDefault();
        e.stopPropagation();
        if (dragElt) dragElt.style.top = `${pageY - panel.getBoundingClientRect().top + panel.scrollTop + 5}px`;

        const clientX = (e as TouchEvent).touches?.[0].clientX ?? (e as MouseEvent).clientX;
        const clientY = (e as TouchEvent).touches?.[0].clientY ?? (e as MouseEvent).clientY;
        let li = document.elementFromPoint(clientX, clientY)?.closest('li');

        if (li?.parentElement?.classList.contains("ol-switcherbottomdiv")) self.overflow(-1);
        else if (li?.parentElement?.classList.contains("ol-switchertopdiv")) self.overflow(1);

        panel.querySelectorAll('li').forEach(i => i.classList.remove('dropover', 'dropover-after', 'dropover-before'));

        if (li && li.parentElement?.classList.contains('drag') && li !== elt) {
          targetLayer = self._getLayerForLI(li);
          if (targetLayer && layer && targetLayer.get('allwaysOnTop') === layer.get('allwaysOnTop')) {
            li.classList.add("dropover", (elt.offsetTop < li.offsetTop) ? 'dropover-after' : 'dropover-before');
          } else {
            targetLayer = false;
          }
        } else {
          targetLayer = false;
        }
        if (dragElt) dragElt.classList.toggle('forbidden', !targetLayer);
      }
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchend', stop);
    document.addEventListener('touchcancel', stop);
  }

  private dragOpacity_(e: MouseEvent | TouchEvent): void {
    e.stopPropagation();
    e.preventDefault();

    const elt = e.target as HTMLElement;
    const layer = this._getLayerForLI(elt.closest('li')!) as Layer<Source>;
    if (!layer || !(layer instanceof Layer)) return;

    const x = (e as TouchEvent).touches?.[0].pageX ?? (e as MouseEvent).pageX;
    const start = parseFloat(elt.style.left || '0') - x;
    this.dragging_ = true;

    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchend', stop);
      document.removeEventListener('touchcancel', stop);
      this.dragging_ = false;
    };
    const move = (e: MouseEvent | TouchEvent) => {
      const x = (e as TouchEvent).touches?.[0].pageX ?? (e as MouseEvent).pageX;
      const parentWidth = (elt.parentElement as HTMLElement).offsetWidth;
      const opacity = Math.max(0, Math.min(1, (start + x) / parentWidth));
      elt.style.left = `${opacity * 100}%`;
      (elt.parentElement!.nextElementSibling as HTMLElement).innerHTML = Math.round(opacity * 100).toString();
      layer.setOpacity(opacity);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchend', stop);
    document.addEventListener('touchcancel', stop);
  }

  drawList(ul: HTMLUListElement, collection: Collection<BaseLayer>): void {
    const layers = collection.getArray().slice().reverse();
    layers.forEach(layer => this.createListItem(ul, layer, collection));
    this.viewChange();
    if (ul === this.panel_) {
      this.overflow();
      this._focus = undefined;
    }
  }

  private createListItem(ul: HTMLUListElement, layer: BaseLayer, collection: Collection<BaseLayer>) {
    if (!this.displayInLayerSwitcher(layer)) {
      this._setLayerForLI(null, layer);
      return;
    }
    const li = ol_ext_element.create('li', {
      className: (layer.getVisible() ? "ol-visible " : "") + (layer.get('baseLayer') ? "baselayer" : ""),
      parent: ul,
      style: {
        minHeight: '40px',
        height: 'auto',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: '#ffffff',
        listStyle: 'none',
        margin: '0',
        flexShrink: '0',
        boxSizing: 'border-box',
        width: '100%'
      }
    });
    this._setLayerForLI(li, layer);
    if (this._selectedLayer === layer) li.classList.add('ol-layer-select');

    const buttons = ol_ext_element.create('div', { 
      className: 'ol-layerswitcher-buttons', 
      parent: li,
      style: {
        marginRight: '8px',
        flexShrink: '0'
      }
    });
    const content = ol_ext_element.create('div', { 
      className: 'li-content', 
      parent: li,
      style: {
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        minHeight: '24px',
        width: '100%'
      }
    });

    const setVisibility = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
        this.switchLayerVisibility(layer, collection);
        if (this.get('selection') && layer.getVisible()) { // <-- FIXED: added parentheses
            this.selectLayer(layer);
        }
        if (this.onchangeCheck) this.onchangeCheck(layer);
    };

    const input = ol_ext_element.create('input', { // NOSONAR
      type: layer.get('baseLayer') ? 'radio' : 'checkbox',
      className: 'ol-visibility',
      checked: layer.getVisible(),
      parent: content,
      style: {
        marginRight: '8px',
        transform: 'scale(1.3)',
        cursor: 'pointer',
        flexShrink: '0',
        width: '20px',
        height: '20px',
        position: 'relative',
        zIndex: '10',
        accentColor: '#3498db',
        border: '2px solid #3498db',
        borderRadius: '3px'
      }
    });
    input.addEventListener('click', (e: Event) => {
        setVisibility(e);
        setTimeout(() => (e.target as HTMLInputElement).checked = layer.getVisible());
    });
    input.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyDown(e, layer, collection, li));

    if (layer === this._focus) {
        input.focus();
        this.overflow();
    }

    const label = ol_ext_element.create('label', {
      title: layer.get('title') || layer.get('name') || 'Unnamed Layer',
      parent: content,
      style: { 
        userSelect: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 0',
        minHeight: '24px',
        flex: '1',
        width: '100%',
        boxSizing: 'border-box'
      },
    });
    label.addEventListener('click', setVisibility);
    label.addEventListener('selectstart', () => false);

    const layerName = layer.get('title') || layer.get('name') || 'Unnamed Layer';
    console.log('🏷️ Creating layer name span for:', layerName);
    
    // Create span element directly using DOM API for maximum reliability
    const layerNameSpan = document.createElement('span');
    layerNameSpan.className = 'layer-switcher-name';
    layerNameSpan.textContent = layerName;
    layerNameSpan.innerText = layerName; // Fallback
    label.appendChild(layerNameSpan);
    
    // Apply critical styles with maximum priority and expanded dimensions
    const criticalStyles = {
      'color': '#111827',
      'font-weight': '600',
      'font-size': '14px',
      'display': 'inline-block',
      'visibility': 'visible',
      'opacity': '1',
      'text-shadow': 'none',
      'background': 'transparent',
      'white-space': 'normal',
      'overflow': 'visible',
      'text-overflow': 'clip',
      'max-width': '200px',
      'min-width': '150px',
      'line-height': '1.5',
      'font-family': 'Arial, sans-serif',
      'position': 'relative',
      'z-index': '10',
      'padding': '4px 0',
      'margin': '0',
      'min-height': '22px',
      'box-sizing': 'border-box',
      'flex-shrink': '1',
      'word-wrap': 'break-word',
      'overflow-wrap': 'break-word',
      'hyphens': 'auto'
    };
    
    // Apply each style with !important
    Object.entries(criticalStyles).forEach(([property, value]) => {
      layerNameSpan.style.setProperty(property, value, 'important');
    });
    
    // Force a final check and text assignment
    setTimeout(() => {
      if (!layerNameSpan.textContent || layerNameSpan.textContent.trim() === '') {
        layerNameSpan.textContent = layerName;
        console.warn('⚠️ Had to force text content for layer:', layerName);
      }
    }, 10);
    
    console.log('✅ Layer name span created:', {
      text: layerNameSpan.textContent,
      display: layerNameSpan.style.display,
      visibility: layerNameSpan.style.visibility,
      color: layerNameSpan.style.color,
      element: layerNameSpan
    });
    
    // Add click handler for layer selection
    layerNameSpan.addEventListener('click', (e: MouseEvent) => {
      if (this.get('selection')) {
        e.stopPropagation();
        this.selectLayer(layer);
      }
    });
    
    console.log('🔧 Created layer span for:', layerName, 'Element:', layerNameSpan);

    if (this.reordering) {
        ol_ext_element.create('div', {
          className: 'layerup ol-noscroll', title: this.tip.up, parent: buttons,
          on: { 'mousedown': (e: MouseEvent) => this.dragOrdering_(e), 'touchstart': (e: TouchEvent) => this.dragOrdering_(e) }
        });
    }

    if (layer instanceof LayerGroup) {
      if (layer.getLayers().getLength()) {
        ol_ext_element.create('div', {
          className: layer.get("openInLayerSwitcher") ? "collapse-layers" : "expend-layers",
          title: this.tip.plus, parent: buttons,
          click: () => layer.set("openInLayerSwitcher", !layer.get("openInLayerSwitcher"))
        });
      }
    }

    if (this.oninfo) {
      ol_ext_element.create('div', { className: 'layerInfo', title: this.tip.info, parent: buttons, click: () => this.dispatchEvent(new LayerSwitcherEvent('info', { layer })) });
    }
    if (this.hastrash && !layer.get("noSwitcherDelete")) {
      ol_ext_element.create('div', { className: 'layerTrash', title: this.tip.trash, parent: buttons, click: () => {
        const parentGroup = this._getLayerForLI(li.parentElement!.closest('li')!) as LayerGroup;
        if(parentGroup) parentGroup.getLayers().remove(layer);
        else this.getMap()?.removeLayer(layer);
      }});
    }
    if (this.hasextent && layer.getExtent()) {
      ol_ext_element.create('div', { className: 'layerExtent', title: this.tip.extent, parent: buttons, click: () => this.dispatchEvent(new LayerSwitcherEvent('extent', { layer })) });
    }

    if (this.show_progress && layer instanceof TileLayer) {
      const p = ol_ext_element.create('div', { className: 'layerswitcher-progress', parent: content });
      (layer as any).layerswitcher_progress = ol_ext_element.create('div', { parent: p });
      this.setprogress_(layer as TileLayer<TileSource>);
    }

    // OPACITY SLIDERS REMOVED - Not needed for this application

    if (layer instanceof LayerGroup && layer.get("openInLayerSwitcher") === true) {
      li.classList.add('ol-layer-group');
      const ul2 = ol_ext_element.create('ul', { parent: li });
      this.drawList(ul2, layer.getLayers());
    }

    li.classList.add(this.getLayerClass(layer));
    this.dispatchEvent(new LayerSwitcherEvent('drawlist', { layer, li }));
  }
  
  private handleKeyDown(e: KeyboardEvent, layer: BaseLayer, collection: Collection<BaseLayer>, li: HTMLLIElement) {
    if (layer instanceof Layer) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        const delta = (e.key === 'ArrowLeft' ? -0.1 : 0.1);
        const opacity = Math.min(1, Math.max(0, layer.getOpacity() + delta));
        layer.setOpacity(opacity);
      }
    }
    switch (e.key) {
      case 'Enter':
        if (this.get('selection')) {
          e.preventDefault();
          e.stopPropagation();
          this.selectLayer(layer);
        }
        break;
      case '-':
      case '+':
        if (layer instanceof LayerGroup) {
          this._focus = layer;
          layer.set("openInLayerSwitcher", !layer.get("openInLayerSwitcher"));
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        if (e.ctrlKey && this.reordering) {
          e.preventDefault();
          e.stopPropagation();
          const pos = collection.getArray().indexOf(layer);
          const newPos = e.key === 'ArrowUp' ? pos + 1 : pos - 1;
          if (newPos >= 0 && newPos < collection.getLength()) {
            collection.remove(layer);
            collection.insertAt(newPos, layer);
            this._focus = layer;
            this.dispatchEvent(new LayerSwitcherEvent("reorder-end", { layer }));
          }
        }
        break;
      default:
        const group = this._getLayerForLI(li.parentElement!.closest('li')!);
        this.dispatchEvent(new LayerSwitcherEvent('layer:keydown', { key: e.key, group, li, layer, originalEvent: e }));
        break;
    }
  }

  getLayerClass(layer: BaseLayer): string {
    if (layer instanceof LayerGroup) return 'ol-layer-group';
    if (layer instanceof VectorLayer) return 'ol-layer-vector';
    if (layer instanceof VectorTileLayer) return 'ol-layer-vectortile';
    if (layer instanceof VectorImageLayer) return 'ol-layer-vectorimage';
    if (layer instanceof TileLayer) return 'ol-layer-tile';
    if (layer instanceof ImageLayer) return 'ol-layer-image';
    if (layer instanceof Heatmap) return 'ol-layer-heatmap';
    if ((layer as any).getFeatures) return 'ol-layer-vectorimage';
    return 'unknown';
  }

  selectLayer(layer?: BaseLayer, silent?: boolean): void {
    const map = this.getMap();
    if (!layer && map) {
        layer = map.getLayers().item(map.getLayers().getLength() - 1);
    }
    if (!layer) return;

    this._selectedLayer = layer;
    if (this.element.querySelector('input.ol-visibility:focus')) { // <-- FIXED: added parentheses
      this._focus = layer;
    }
    this.drawPanel();
    if (!silent) {
      this.dispatchEvent(new LayerSwitcherEvent('select', { layer }));
    }
  }

  getSelection(): BaseLayer | undefined {
    return this._selectedLayer;
  }

  private setprogress_(layer: TileLayer<TileSource>): void {
    if ((layer as any).layerswitcher_progress) return;
    let loaded = 0, loading = 0;
    const draw = () => {
      const progressElement = (layer as any).layerswitcher_progress;
      if (!progressElement) return;
      if (loading === loaded) {
        loading = loaded = 0;
        progressElement.style.width = '0';
      } else {
        progressElement.style.width = `${(loaded / loading * 100).toFixed(1)}%`;
      }
    };
    const source = layer.getSource();
    if (source) {
      source.on('tileloadstart', () => { loading++; draw(); });
      source.on('tileloadend', () => { loaded++; draw(); });
      source.on('tileloaderror', () => { loaded++; draw(); });
    }
    draw();
  }
}

export default ol_control_LayerSwitcher;