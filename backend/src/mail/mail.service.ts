import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * Thin wrapper around Resend for transactional email (password reset links).
 * If RESEND_API_KEY isn't set (e.g. local Docker development), emails are
 * simply logged to the console instead of sent — so the reset flow still
 * works end-to-end for local testing without needing an email account.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = 'CampusFix — Rivendosje Fjalëkalimi';
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #14213D;">CampusFix</h2>
        <p>Keni kërkuar rivendosjen e fjalëkalimit tuaj.</p>
        <p><a href="${resetUrl}" style="background:#FF5A1F;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Rivendos Fjalëkalimin</a></p>
        <p style="color:#64748B;font-size:13px;">Ky link skadon brenda 1 ore. Nëse s'e keni kërkuar ju, injorojeni këtë email.</p>
      </div>
    `;

    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not set — logging reset email instead of sending. URL: ${resetUrl}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'CampusFix <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}`, err as Error);
    }
  }
}
