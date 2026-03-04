/**
 * Email service for sending transactional emails via Resend.
 * Falls back gracefully when RESEND_API_KEY is not configured.
 */

interface ReviewReminderParams {
  to: string;
  name: string;
  dueCount: number;
  reviewUrl: string;
}

export class EmailService {
  private resend: any = null;
  private fromAddress = 'GENIA <noreply@genia-training.com>';

  constructor() {
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = require('resend');
        this.resend = new Resend(process.env.RESEND_API_KEY);
      } catch {
        console.warn('EmailService: resend package not available');
      }
    } else {
      console.warn('EmailService: RESEND_API_KEY not set, emails will be logged only');
    }
  }

  async sendReviewReminder({ to, name, dueCount, reviewUrl }: ReviewReminderParams): Promise<boolean> {
    const subject = `🧠 ${name}, tu as ${dueCount} carte(s) à réviser !`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;">GENIA</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Ton formateur en Prompt Engineering</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Hey ${name} ! 🧠</p>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">
        Tu as <strong style="color:#7c3aed;">${dueCount} carte(s)</strong> à réviser aujourd'hui.
        Rappelle-toi, la régularité est la clé de la maîtrise !
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${reviewUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
          Réviser maintenant →
        </a>
      </div>
      <p style="font-size:13px;color:#94a3b8;margin:24px 0 0;text-align:center;">
        Petit effort aujourd'hui, grande maîtrise demain ! 💪
      </p>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#f1f5f9;text-align:center;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">GENIA Web Training — Prompt Engineering Academy</p>
    </div>
  </div>
</body>
</html>`;

    if (!this.resend) {
      console.log(`[EmailService] Would send review reminder to ${to}: ${dueCount} cards due`);
      return true;
    }

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error(`[EmailService] Failed to send to ${to}:`, error);
      return false;
    }
  }
}

export const emailService = new EmailService();
