import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isEthereal = false;

  constructor(private configService: ConfigService) {
    this.initTransport();
  }

  private async initTransport() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      // Production: use configured SMTP
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('📧 SMTP email transport configured');
    } else {
      // Development: use Ethereal (free test email service)
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.isEthereal = true;
        this.logger.log('📧 Ethereal test email configured (no SMTP set)');
        this.logger.log(`📧 Ethereal user: ${testAccount.user}`);
        this.logger.log(`📧 View sent emails at: https://ethereal.email/login`);
      } catch {
        // Fallback if Ethereal is down: JSON transport (log to console)
        this.transporter = nodemailer.createTransport({ jsonTransport: true });
        this.logger.warn('⚠️  Ethereal unavailable — emails will be logged to console');
      }
    }
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    // Wait for async init if transporter not ready yet
    if (!this.transporter) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }
    return this.transporter;
  }

  /**
   * Send clinic owner invitation email with link to set password
   */
  async sendOwnerInvitation(params: {
    ownerName: string;
    ownerEmail: string;
    clinicName: string;
    invitationToken: string;
    expiresAt: Date;
  }): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const invitationLink = `${frontendUrl}/accept-invitation?token=${params.invitationToken}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">🎉 VibraLive</h1>
              <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">Plataforma de Gestión Veterinaria</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#1f2937;margin:0 0 16px;">¡Hola ${params.ownerName}!</h2>
              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                Has sido invitado como <strong>administrador</strong> de la clínica 
                <strong>${params.clinicName}</strong> en VibraLive.
              </p>
              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                Para activar tu cuenta, haz clic en el siguiente botón y establece tu contraseña:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationLink}" 
                       style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
                      Aceptar Invitación
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color:#4f46e5;font-size:13px;word-break:break-all;">
                ${invitationLink}
              </p>
              
              <!-- Expiry Notice -->
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-top:24px;">
                <p style="color:#92400e;margin:0;font-size:14px;">
                  ⏰ Esta invitación expira el <strong>${params.expiresAt.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</strong>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Este correo fue enviado automáticamente por VibraLive.<br>
                Si no esperabas esta invitación, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || '"VibraLive" <no-reply@vibralive.com>',
      to: params.ownerEmail,
      subject: `🎉 Invitación a ${params.clinicName} — VibraLive`,
      html: htmlContent,
    };

    try {
      const transporter = await this.getTransporter();
      const result = await transporter.sendMail(mailOptions);

      // Ethereal: show preview URL to view the email in browser
      if (this.isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        this.logger.log(`📧 ✅ Email sent to ${params.ownerEmail}`);
        this.logger.log(`📧 👀 Preview URL: ${previewUrl}`);
        this.logger.log(`📧 🔗 Invitation link: ${invitationLink}`);
      } else if (result.message) {
        // JSON transport fallback (console only)
        this.logger.log(`📧 [DEV] Invitation email for ${params.ownerEmail}:`);
        this.logger.log(`📧 [DEV] Link: ${invitationLink}`);
        this.logger.log(`📧 [DEV] Token: ${params.invitationToken}`);
      } else {
        this.logger.log(`📧 Invitation email sent to ${params.ownerEmail}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send invitation email to ${params.ownerEmail}`, error);
      // No lanzar error — la invitación ya se creó en BD, el email es best-effort
    }
  }

  /**
   * Send clinic staff/user invitation email with link to set password
   */
  async sendStaffInvitation(params: {
    staffName: string;
    staffEmail: string;
    clinicName: string;
    invitationToken: string;
    expiresAt: Date;
    roles: string[];
  }): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const invitationLink = `${frontendUrl}/accept-invitation?token=${params.invitationToken}`;
    const rolesText = params.roles.join(', ');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">🎉 VibraLive</h1>
              <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">Plataforma de Gestión Veterinaria</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#1f2937;margin:0 0 16px;">¡Hola ${params.staffName}!</h2>
              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                Has sido invitado a unirte al equipo de <strong>${params.clinicName}</strong> en VibraLive.
              </p>
              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                Se te han asignado los siguientes roles: <strong>${rolesText}</strong>
              </p>
              <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                Para activar tu cuenta, haz clic en el siguiente botón y establece tu contraseña:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationLink}" 
                       style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
                      Aceptar Invitación
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color:#4f46e5;font-size:13px;word-break:break-all;">
                ${invitationLink}
              </p>
              
              <!-- Expiry Notice -->
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-top:24px;">
                <p style="color:#92400e;margin:0;font-size:14px;">
                  ⏰ Esta invitación expira el <strong>${params.expiresAt.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</strong>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Este correo fue enviado automáticamente por VibraLive.<br>
                Si no esperabas esta invitación, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || '"VibraLive" <no-reply@vibralive.com>',
      to: params.staffEmail,
      subject: `🎉 Invitación al equipo de ${params.clinicName} — VibraLive`,
      html: htmlContent,
    };

    try {
      const transporter = await this.getTransporter();
      const result = await transporter.sendMail(mailOptions);

      if (this.isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        this.logger.log(`📧 ✅ Staff invitation sent to ${params.staffEmail}`);
        this.logger.log(`📧 👀 Preview URL: ${previewUrl}`);
        this.logger.log(`📧 🔗 Invitation link: ${invitationLink}`);
      } else if (result.message) {
        this.logger.log(`📧 [DEV] Staff invitation email for ${params.staffEmail}:`);
        this.logger.log(`📧 [DEV] Link: ${invitationLink}`);
        this.logger.log(`📧 [DEV] Token: ${params.invitationToken}`);
      } else {
        this.logger.log(`📧 Staff invitation email sent to ${params.staffEmail}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send staff invitation email to ${params.staffEmail}`, error);
    }
  }
}
