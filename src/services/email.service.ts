import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  type: 'application_confirmation' | 'status_update' | 'notification';
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      // Log successful email
      await prisma.emailLog.create({
        data: {
          to: options.to,
          subject: options.subject,
          type: options.type,
          status: 'sent',
        },
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed email
      await prisma.emailLog.create({
        data: {
          to: options.to,
          subject: options.subject,
          type: options.type,
          status: 'failed',
          error: errorMessage,
        },
      });

      console.error('Email send failed:', errorMessage);
      return false;
    }
  }

  generateApplicationConfirmationEmail(applicantName: string, applicationId: string): string {
    return `
      <h2>Application Received</h2>
      <p>Dear ${applicantName},</p>
      <p>Thank you for submitting your adoption application to PuppyHub USA!</p>
      <p>We have received your application and will review it within 4-5 business days.</p>
      <p><strong>Application ID:</strong> ${applicationId}</p>
      <p>You will receive an email update once your application has been reviewed.</p>
      <p>Best regards,<br/>PuppyHub USA Team</p>
    `;
  }

  generateStatusUpdateEmail(
    applicantName: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): string {
    if (status === 'approved') {
      return `
        <h2>Application Approved!</h2>
        <p>Dear ${applicantName},</p>
        <p>Congratulations! Your adoption application has been approved.</p>
        <p>We will be in touch soon with information about available puppies that match your preferences.</p>
        <p>Best regards,<br/>PuppyHub USA Team</p>
      `;
    }

    return `
      <h2>Application Status Update</h2>
      <p>Dear ${applicantName},</p>
      <p>Thank you for your interest in PuppyHub USA. Unfortunately, we are unable to move forward with your application at this time.</p>
      ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      <p>We encourage you to reapply in the future.</p>
      <p>Best regards,<br/>PuppyHub USA Team</p>
    `;
  }
}

export const emailService = new EmailService();
