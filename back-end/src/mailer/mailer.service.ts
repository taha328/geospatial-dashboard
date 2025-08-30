import { Injectable, Logger } from '@nestjs/common';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Use SendGrid only in this project. We require it at runtime to avoid build-time type issues.
const sgMail = require('@sendgrid/mail');

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private sendGridApiKey: string | null = null;

  constructor() {
    this.initializeSendGrid();
  }

  private async initializeSendGrid() {
    try {
      const secretName = process.env.SENDGRID_API_KEY;

      if (!secretName) {
        this.logger.error('SENDGRID_API_KEY environment variable not set');
        return;
      }

      // Check if it's a Secret Manager resource path
      if (secretName.startsWith('projects/')) {
        this.logger.log('Fetching SendGrid API key from Secret Manager...');
        const client = new SecretManagerServiceClient();

        const [version] = await client.accessSecretVersion({
          name: secretName,
        });

        const payload = version?.payload?.data?.toString();
        if (!payload) {
          throw new Error('Secret Manager returned empty payload for SendGrid API key');
        }

        this.sendGridApiKey = payload.trim(); // Trim any whitespace
        this.logger.log(`SendGrid API key loaded, length: ${this.sendGridApiKey.length}`);
        this.logger.log(`SendGrid API key preview: ${this.sendGridApiKey.substring(0, 15)}...`);
        
        sgMail.setApiKey(this.sendGridApiKey);
        this.logger.log('SendGrid API key loaded from Secret Manager successfully');
      } else {
        // Fallback to direct API key (for local development)
        this.sendGridApiKey = secretName;
        sgMail.setApiKey(this.sendGridApiKey);
        this.logger.log('SendGrid API key set from environment variable');
      }
    } catch (error) {
      this.logger.error('Failed to initialize SendGrid:', error);
    }
  }

  async sendMail(opts: MailOptions) {
    if (!this.sendGridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    // Debug: Log API key length and first few characters (safely)
    this.logger.log(`SendGrid API key length: ${this.sendGridApiKey.length}`);
    this.logger.log(`SendGrid API key starts with: ${this.sendGridApiKey.substring(0, 10)}...`);

    const from = process.env.MAIL_FROM || 'no-reply@geodashboard.online';
    const msg = {
      to: opts.to,
      from,
      subject: opts.subject,
      html: opts.html,
    };

    try {
      const res = await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${opts.to}`);
      return res;
    } catch (error) {
      this.logger.error(`Failed to send email to ${opts.to}:`, error);
      // Log more details about the error
      this.logger.error('SendGrid error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.body
      });
      throw error;
    }
  }
}
