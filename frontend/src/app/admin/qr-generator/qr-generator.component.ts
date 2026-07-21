import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <span class="eyebrow">{{ 'nav.qr' | translate }}</span>
    <h1>{{ 'qr.title' | translate }}</h1>
    <p class="subtitle">{{ 'qr.subtitle' | translate }}</p>

    <div class="card generator">
      <input [(ngModel)]="location" [placeholder]="'qr.locationPlaceholder' | translate" (keyup.enter)="generate()" />
      <button class="btn btn-primary" (click)="generate()" [disabled]="!location.trim()">
        {{ 'qr.generate' | translate }}
      </button>
    </div>

    <div class="card qr-result" *ngIf="qrDataUrl">
      <img [src]="qrDataUrl" alt="QR code" />
      <p class="qr-label">{{ location }}</p>
      <a class="btn btn-outline" [href]="qrDataUrl" [download]="'qr-' + location + '.png'">
        {{ 'qr.download' | translate }}
      </a>
    </div>
  `,
  styles: [`
    .eyebrow { display: inline-block; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--accent); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 22px; max-width: 520px; }
    .generator { display: flex; gap: 10px; max-width: 480px; margin-bottom: 20px; }
    .qr-result { max-width: 300px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .qr-result img { width: 220px; height: 220px; }
    .qr-label { font-size: 14px; font-weight: 600; color: var(--ink); margin: 0; }
  `],
})
export class QrGeneratorComponent {
  location = '';
  qrDataUrl: string | null = null;

  async generate(): Promise<void> {
    const loc = this.location.trim();
    if (!loc) return;
    // Encodes a deep-link to the report form with the location pre-filled via query param.
    const url = `${window.location.origin}/report?location=${encodeURIComponent(loc)}`;
    this.qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 1 });
  }
}
