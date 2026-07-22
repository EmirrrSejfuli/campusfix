import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="open" (click)="close()">
      <button class="close-btn" (click)="close()">✕</button>
      <img [src]="src" [alt]="alt" (click)="$event.stopPropagation()" />
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15, 23, 42, 0.88);
      display: flex; align-items: center; justify-content: center;
      padding: 40px;
      cursor: zoom-out;
    }
    img {
      max-width: 90vw; max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      cursor: default;
    }
    .close-btn {
      position: absolute; top: 24px; right: 28px;
      width: 38px; height: 38px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.12);
      color: #fff;
      font-size: 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { background: rgba(255,255,255,0.22); }
  `],
})
export class LightboxComponent {
  @Input() open = false;
  @Input() src = '';
  @Input() alt = '';
  @Input() onClose?: () => void;

  close(): void {
    this.open = false;
    if (this.onClose) this.onClose();
  }
}
