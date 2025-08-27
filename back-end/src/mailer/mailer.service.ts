import { Injectable, Logger } from '@nestjs/common';

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

  constructor() {
    const key = process.env.SENDGRID_API_KEY;
    if (key) {
      sgMail.setApiKey(key);
      this.logger.log('SendGrid API key detected; MailerService initialized for SendGrid.');
    } else {
      this.logger.error('SENDGRID_API_KEY not configured. MailerService will fail on sendMail calls.');
    }
  }

  async sendMail(opts: MailOptions) {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) throw new Error('SENDGRID_API_KEY not configured');

    const from = process.env.MAIL_FROM || 'no-reply@example.com';
    const msg = {
      to: opts.to,
      from,
      subject: opts.subject,
      html: opts.html,
    };

    const res = await sgMail.send(msg);
    this.logger.log(`Sent email to ${opts.to}`);
    return res;
  }
}
