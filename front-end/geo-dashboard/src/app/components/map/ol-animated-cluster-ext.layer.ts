/*
  Copyright (c) 2015 Jean-Marc VIGLINO,
  released under the CeCILL-B license (http://www.cecill.info/).

  This is an adapted version of the ol-ext ol/layer/AnimatedCluster for a modern
  TypeScript/OpenLayers environment.
*/
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { easeOut as ol_easing_easeOut } from 'ol/easing';
import { buffer as ol_extent_buffer, Extent } from 'ol/extent';
import Point from 'ol/geom/Point';
import { getVectorContext } from 'ol/render';
import { Options as VectorLayerOptions } from 'ol/layer/Vector';
import { FrameState } from 'ol/Map';
import RenderEvent from 'ol/render/Event';
import { Geometry } from 'ol/geom';
import Style from 'ol/style/Style';

export interface AnimatedClusterOptions extends VectorLayerOptions<VectorSource> {
  animationDuration?: number;
  animationMethod?: (t: number) => number;
}

export class ol_layer_AnimatedCluster extends VectorLayer<VectorSource> {
  private oldcluster: VectorSource;
  private clusters: Feature<Geometry>[];
  private animation: {
    start: any;
    cA?: Feature<Geometry>[];
    cB?: Feature<Geometry>[];
    clusters?: any[];
    resolution?: number;
    revers?: boolean;
  };
  private sourceChanged: boolean;
  private clip_: boolean;
  // FIX: Added definite assignment assertion '!'
  private _saveClusterFn!: () => void;

  constructor(opt_options: AnimatedClusterOptions = {}) {
    super(opt_options);

    this.oldcluster = new VectorSource();
    this.clusters = [];
    this.animation = { start: false };
    this.sourceChanged = false;
    this.clip_ = false;

    this.set('animationDuration', typeof (opt_options.animationDuration) === 'number' ? opt_options.animationDuration : 700);
    this.set('animationMethod', opt_options.animationMethod || ol_easing_easeOut);

    // FIX: Use modern event names and add explicit type to event parameter
    this.on('prerender', (e: RenderEvent) => this.animate(e));
    this.on('postrender', (e: RenderEvent) => this.postanimate(e));
  }

  // FIX: Added 'override' keyword
  override setSource(source: VectorSource | null) {
    if (!this._saveClusterFn) {
      this._saveClusterFn = this.saveCluster.bind(this);
    }
    // FIX: Add null check for getSource()
    const currentSource = this.getSource();
    if (currentSource) {
      currentSource.un('change', this._saveClusterFn);
    }
    super.setSource(source);
    if (source) {
      source.on('change', this._saveClusterFn);
    }
  }

  private saveCluster() {
    if (this.oldcluster) {
      this.oldcluster.clear();
      if (!this.get('animationDuration')) return;

      // FIX: Add null check for getSource()
      const source = this.getSource();
      if (source) {
        const features = source.getFeatures();
        if (features.length && features[0].get('features')) {
          this.oldcluster.addFeatures(this.clusters);
          this.clusters = features.slice(0);
          this.sourceChanged = true;
        }
      }
    }
  }

  private getClusterForFeature(f: Feature, cluster: Feature[]) {
    for (let j = 0, c; (c = cluster[j]); j++) {
      const features = c.get('features');
      if (features && features.length) {
        for (let k = 0, f2; (f2 = features[k]); k++) {
          if (f === f2) {
            return c;
          }
        }
      }
    }
    return false;
  }

  private stopAnimation() {
    this.animation.start = false;
    this.animation.cA = [];
    this.animation.cB = [];
  }

  private animate(e: RenderEvent) {
    const duration = this.get('animationDuration');
    if (!duration) return;

    // FIX: Add null check for frameState and extent
    const frameState = e.frameState;
    if (!frameState || !frameState.extent) return;
    
    const resolution = frameState.viewState.resolution;
    const time = frameState.time;
    const a = this.animation;
    const extent: Extent = frameState.extent;

    if (a.resolution !== resolution && this.sourceChanged) {
      const source = this.getSource();
      if (!source) return; // Can't animate without a source

      if (a.resolution! < resolution) {
        a.cA = this.oldcluster.getFeaturesInExtent(ol_extent_buffer(extent, 100 * resolution));
        a.cB = source.getFeaturesInExtent(ol_extent_buffer(extent, 100 * resolution));
        a.revers = false;
      } else {
        a.cA = source.getFeaturesInExtent(ol_extent_buffer(extent, 100 * resolution));
        a.cB = this.oldcluster.getFeaturesInExtent(ol_extent_buffer(extent, 100 * resolution));
        a.revers = true;
      }
      a.clusters = [];
      for (let i = 0, c0; (c0 = a.cA[i]); i++) {
        const f = c0.get('features');
        if (f && f.length) {
          const c = this.getClusterForFeature(f[0], a.cB as Feature[]);
          if (c) {
            a.clusters.push({ f: c0, pt: (c.getGeometry() as Point).getCoordinates() });
          }
        }
      }

      a.resolution = resolution;
      this.sourceChanged = false;

      if (!a.clusters?.length || a.clusters.length > 1000) {
        this.stopAnimation();
        return;
      }
      a.start = new Date().getTime();
    }

    if (a.start) {
      const vectorContext = getVectorContext(e);
      let d = (time - a.start) / duration;
      if (d > 1.0) {
        this.stopAnimation();
        d = 1;
      }
      d = this.get('animationMethod')(d);

      const style = this.getStyle();
      const stylefn = (typeof style === 'function') ? style : () => (Array.isArray(style) ? style : [style as Style]);

      // FIX: Check if context is a 2D Canvas context before using canvas-specific methods
      if (e.context instanceof CanvasRenderingContext2D) {
        e.context.save();
        e.context.globalAlpha = this.getOpacity();
      }

      for (let i = 0, c; (c = a.clusters![i]); i++) {
        let f: Feature;
        const pt = (c.f.getGeometry() as Point).getCoordinates();
        const dx = pt[0] - c.pt[0];
        const dy = pt[1] - c.pt[1];
        const p = [...pt];

        if (a.revers) {
          p[0] = c.pt[0] + d * dx;
          p[1] = c.pt[1] + d * dy;
        } else {
          p[0] = pt[0] - d * dx;
          p[1] = pt[1] - d * dy;
        }

        const st = stylefn(c.f, resolution) as Style | Style[];
        const styles = Array.isArray(st) ? st : [st];

        if (c.f.get('features').length === 1 && !dx && !dy) {
          f = c.f.get('features')[0];
        } else {
          f = new Feature(new Point(p));
        }
        
        for (const s of styles) {
            if (s) {
                vectorContext.drawFeature(f, s);
            }
        }
      }

      if (e.context instanceof CanvasRenderingContext2D) {
        e.context.restore();
        frameState.animate = true;
        e.context.save();
        e.context.beginPath();
        e.context.rect(0, 0, 0, 0);
        e.context.clip();
        this.clip_ = true;
      }
    }
  }

  private postanimate(e: RenderEvent) {
    if (this.clip_ && e.context instanceof CanvasRenderingContext2D) {
      e.context.restore();
      this.clip_ = false;
    }
  }
}