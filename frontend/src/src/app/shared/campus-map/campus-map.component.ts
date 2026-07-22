import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { IssuesService } from '../../core/services/issues.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { MapPoint } from '../../core/models';

// Default map center: Skopje, North Macedonia — adjust to your actual campus coordinates.
const DEFAULT_CENTER: [number, number] = [41.9981, 21.4254];
const DEFAULT_ZOOM = 14;

const URGENCY_COLOR: Record<string, string> = {
  low: '#64748B',
  medium: '#A9660A',
  high: '#C0301F',
};

@Component({
  selector: 'app-campus-map',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <span class="eyebrow">{{ 'map.eyebrow' | translate }}</span>
    <h1>{{ 'map.title' | translate }}</h1>
    <p class="subtitle">{{ 'map.subtitle' | translate }}</p>

    <div class="legend">
      <span class="dot" style="background:#C0301F"></span>{{ 'urgency.high' | translate }}
      <span class="dot" style="background:#A9660A"></span>{{ 'urgency.medium' | translate }}
      <span class="dot" style="background:#64748B"></span>{{ 'urgency.low' | translate }}
    </div>

    <div class="card map-card">
      <div id="campus-map" class="map-el"></div>
    </div>

    <p class="empty" *ngIf="loaded && points.length === 0">{{ 'map.empty' | translate }}</p>
  `,
  styles: [`
    .eyebrow { display: inline-block; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--info); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 16px; }
    .legend { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-soft); margin-bottom: 14px; }
    .legend .dot { width: 10px; height: 10px; border-radius: 50%; margin-left: 10px; }
    .legend .dot:first-child { margin-left: 0; }
    .map-card { padding: 0; overflow: hidden; }
    .map-el { width: 100%; height: 460px; }
    .empty { color: var(--ink-faint); text-align: center; padding: 20px; font-size: 13px; }
  `],
})
export class CampusMapComponent implements OnInit, AfterViewInit, OnDestroy {
  points: MapPoint[] = [];
  loaded = false;
  private map: L.Map | null = null;

  constructor(
    private issuesService: IssuesService,
    private router: Router,
    public translation: TranslationService,
  ) {}

  ngOnInit(): void {
    this.issuesService.getMapPoints().subscribe((points) => {
      this.points = points;
      this.loaded = true;
      this.renderMarkers();
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map('campus-map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.renderMarkers();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderMarkers(): void {
    if (!this.map || this.points.length === 0) return;
    this.points.forEach((p) => {
      const color = URGENCY_COLOR[p.issue_urgency] ?? URGENCY_COLOR['low'];
      const marker = L.circleMarker([p.issue_latitude, p.issue_longitude], {
        radius: 9,
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(this.map!);

      const statusLabel = this.translation.t('status.' + p.issue_status);
      marker.bindPopup(
        `<strong>${this.escapeHtml(p.issue_title)}</strong><br/>${this.escapeHtml(p.categoryName ?? '')}<br/>${statusLabel}`,
      );
      marker.on('click', () => {
        // keep the popup; navigation happens via a secondary click on the popup content if desired
      });
      marker.on('popupopen', () => {
        const el = document.querySelector('.leaflet-popup-content');
        if (el) {
          el.setAttribute('style', 'cursor:pointer');
          el.addEventListener('click', () => this.router.navigate(['/issues', p.issue_id]), { once: true });
        }
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
