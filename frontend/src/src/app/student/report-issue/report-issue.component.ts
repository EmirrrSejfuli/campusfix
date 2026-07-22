import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { gps } from 'exifr';
import { IssuesService } from '../../core/services/issues.service';
import { TranslationService } from '../../core/services/translation.service';
import { Category } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

const MAX_PHOTOS = 4;

@Component({
  selector: 'app-report-issue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="emergency-banner">
      ⚠ {{ 'report.emergencyNotice' | translate }}
    </div>

    <div class="card report-card" style="max-width:640px; margin: 0 auto;">
      <span class="eyebrow"><i class="dot"></i>{{ 'report.eyebrow' | translate }}</span>
      <h1>{{ 'report.title' | translate }}</h1>
      <p class="subtitle">{{ 'report.subtitle' | translate }}</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>{{ 'report.titleLabel' | translate }}</label>
        <input formControlName="title" [placeholder]="'report.titlePlaceholder' | translate" />

        <label style="margin-top:14px">{{ 'report.descriptionLabel' | translate }}</label>
        <textarea formControlName="description" rows="4" [placeholder]="'report.descriptionPlaceholder' | translate"></textarea>

        <label style="margin-top:14px">{{ 'report.categoryLabel' | translate }}</label>
        <select formControlName="categoryId">
          <option value="">{{ 'report.categoryLet AI' | translate }}</option>
          <option *ngFor="let c of categories" [value]="c.id">{{ translation.categoryName(c.name) }}</option>
        </select>

        <label style="margin-top:14px">{{ 'report.locationLabel' | translate }}</label>
        <div class="location-row">
          <input formControlName="location" [placeholder]="'report.locationPlaceholder' | translate" />
          <button type="button" class="btn btn-outline geo-btn" (click)="useCurrentLocation()" [disabled]="geoLoading">
            📍 {{ (geoLoading ? 'report.gpsLocating' : 'report.useMyLocation') | translate }}
          </button>
        </div>
        <p class="gps-hint" *ngIf="geoStatus === 'found'">✓ {{ 'report.geoFound' | translate }}</p>
        <p class="gps-hint error-hint" *ngIf="geoStatus === 'denied'">{{ 'report.geoDenied' | translate }}</p>

        <label style="margin-top:14px">{{ 'report.photosLabel' | translate }}</label>
        <p class="hint">{{ 'report.photosHint' | translate }}</p>
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple (change)="onFilesSelected($event)" />
        <p class="gps-hint muted" *ngIf="compressing">⏳ {{ 'report.compressing' | translate }}</p>
        <p class="gps-hint" *ngIf="gpsStatus === 'found'">📍 {{ 'report.gpsFound' | translate }}</p>
        <p class="gps-hint muted" *ngIf="gpsStatus === 'none'">{{ 'report.gpsNotFound' | translate }}</p>
        <p class="error" *ngIf="photoError">{{ photoError }}</p>

        <div class="preview-grid" *ngIf="previewUrls.length > 0">
          <div class="preview-item" *ngFor="let url of previewUrls; let i = index">
            <img [src]="url" alt="" />
            <button type="button" class="remove-photo" (click)="removePhoto(i)">✕</button>
          </div>
        </div>

        <p class="success" *ngIf="successMsg">{{ successMsg }}</p>
        <p class="error" *ngIf="errorMsg">{{ errorMsg }}</p>

        <button class="btn btn-primary" style="margin-top:20px" [disabled]="form.invalid || loading || compressing">
          {{ (loading ? 'report.submitting' : 'report.submit') | translate }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .emergency-banner {
      max-width: 640px; margin: 0 auto 16px;
      background: var(--danger-bg); color: var(--danger);
      border: 1px solid #F3C6C0; border-radius: var(--radius);
      padding: 10px 14px; font-size: 13px; font-weight: 600;
    }
    .report-card { border-top: 3px solid var(--accent); }
    .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--accent); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 24px; }
    .hint { font-size: 12px; color: var(--ink-faint); margin: 0 0 8px; }
    .location-row { display: flex; gap: 8px; }
    .location-row input { flex: 1; }
    .geo-btn { white-space: nowrap; font-size: 12.5px; padding: 10px 14px; }
    .error-hint { color: var(--danger) !important; }
    .gps-hint { font-size: 12.5px; color: var(--success); font-weight: 600; margin: 8px 0 0; }
    .gps-hint.muted { color: var(--ink-faint); font-weight: 500; }
    .preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
    .preview-item { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); }
    .preview-item img { width: 100%; height: 100%; object-fit: cover; }
    .remove-photo {
      position: absolute; top: 4px; right: 4px; width: 20px; height: 20px;
      border-radius: 50%; border: none; background: rgba(15,23,42,0.7); color: #fff; font-size: 11px;
      display: flex; align-items: center; justify-content: center;
    }
    .success { color: var(--success); font-size: 13px; margin-top: 12px; font-weight: 600; }
    .error { color: var(--danger); font-size: 13px; margin-top: 12px; }
  `],
})
export class ReportIssueComponent implements OnInit {
  categories: Category[] = [];
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  loading = false;
  successMsg = '';
  errorMsg = '';
  photoError = '';
  gpsStatus: 'idle' | 'found' | 'none' = 'idle';
  detectedLat: number | null = null;
  detectedLng: number | null = null;
  geoStatus: 'idle' | 'found' | 'denied' = 'idle';
  geoLoading = false;
  compressing = false;

  private fb = inject(FormBuilder);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    categoryId: [''],
    location: [''],
  });

  constructor(
    private issuesService: IssuesService,
    private router: Router,
    private route: ActivatedRoute,
    public translation: TranslationService,
  ) {}

  ngOnInit(): void {
    this.issuesService.getCategories().subscribe((cats) => (this.categories = cats));

    // Pre-fill the location when arriving via a QR code deep-link (?location=...).
    const qLocation = this.route.snapshot.queryParamMap.get('location');
    if (qLocation) this.form.patchValue({ location: qLocation });
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.photoError = '';

    const capped = files.length > MAX_PHOTOS ? files.slice(0, MAX_PHOTOS) : files;
    if (files.length > MAX_PHOTOS) this.photoError = this.translation.t('report.tooManyPhotos');

    if (capped.length === 0) {
      this.selectedFiles = [];
      this.previewUrls.forEach((u) => URL.revokeObjectURL(u));
      this.previewUrls = [];
      return;
    }

    // If the person already confirmed their location via the GPS button, don't
    // let photo EXIF scanning silently overwrite or wipe it out below — the
    // explicit button action should always take priority over a guess from a
    // photo that may have no location data at all.
    if (this.geoStatus !== 'found') {
      this.gpsStatus = 'idle';
      this.detectedLat = null;
      this.detectedLng = null;

      // Most phone cameras embed GPS coordinates in the photo's EXIF metadata.
      // We must read it from the ORIGINAL file, before compression strips metadata.
      for (const file of capped) {
        try {
          const coords = await gps(file);
          if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
            this.detectedLat = coords.latitude;
            this.detectedLng = coords.longitude;
            this.gpsStatus = 'found';
            break;
          }
        } catch {
          // try the next file
        }
      }
      if (this.gpsStatus !== 'found') this.gpsStatus = 'none';
    }

    // Phone camera photos are often 3-10MB — well over the backend's 5MB upload
    // limit, and slow on a free-tier server. Compress client-side so uploads are
    // always small and fast, regardless of the original photo's resolution.
    this.compressing = true;
    this.selectedFiles = await Promise.all(capped.map((f) => this.compressImage(f)));
    this.compressing = false;

    this.previewUrls.forEach((u) => URL.revokeObjectURL(u));
    this.previewUrls = this.selectedFiles.map((f) => URL.createObjectURL(f));
  }

  private async compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
    // Already small enough (e.g. a screenshot) — no need to re-encode.
    if (file.size <= 700 * 1024) return file;

    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    } catch {
      // If compression fails for any reason, fall back to the original file
      // rather than blocking the report — the backend limit still applies.
      return file;
    }
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.geoStatus = 'denied';
      return;
    }
    this.geoLoading = true;
    this.geoStatus = 'idle';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.detectedLat = position.coords.latitude;
        this.detectedLng = position.coords.longitude;
        this.geoStatus = 'found';
        this.geoLoading = false;
      },
      () => {
        // Permission denied or unavailable — the person can still type the location manually.
        this.geoStatus = 'denied';
        this.geoLoading = false;
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  removePhoto(index: number): void {
    URL.revokeObjectURL(this.previewUrls[index]);
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
    this.photoError = '';
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('title', raw.title!);
    formData.append('description', raw.description!);
    if (raw.categoryId) formData.append('categoryId', raw.categoryId);
    if (raw.location) formData.append('location', raw.location);
    this.selectedFiles.forEach((file) => formData.append('images', file));
    if (this.detectedLat !== null && this.detectedLng !== null) {
      formData.append('latitude', String(this.detectedLat));
      formData.append('longitude', String(this.detectedLng));
    }

    this.issuesService
      .createIssue(formData)
      .pipe(
        // 90s: generous enough to cover a cold Render free-tier start (~30-60s) plus upload time,
        // but guarantees the person always sees an outcome instead of a silent infinite spinner.
        timeout(90000),
        catchError((err) => {
          this.loading = false;
          this.errorMsg =
            err?.name === 'TimeoutError'
              ? this.translation.t('report.timeoutError')
              : (err.error?.message ?? this.translation.t('report.error'));
          return throwError(() => err);
        }),
      )
      .subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = this.translation.t('report.success');
        this.form.reset();
        this.previewUrls.forEach((u) => URL.revokeObjectURL(u));
        this.selectedFiles = [];
        this.previewUrls = [];
        this.gpsStatus = 'idle';
        this.detectedLat = null;
        this.detectedLng = null;
        setTimeout(() => this.router.navigate(['/my-issues']), 1200);
      },
      error: () => {
        // errorMsg and loading are already set inside catchError above.
      },
    });
  }
}
