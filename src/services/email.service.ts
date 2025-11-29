import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

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

  generateApplicationConfirmationEmail(
    applicantName: string,
    puppyName: string,
    applicationId: string
  ): string {
    return `
      <h2>Application Received ✓</h2>
      <p>Dear ${applicantName},</p>
      <p>Thank you for submitting your adoption application for <strong>${puppyName}</strong> to PuppyHub USA!</p>
      <p>We have received your application and will review it within 4-5 business days.</p>
      <p><strong>Application ID:</strong> ${applicationId}</p>
      <h3>What Happens Next:</h3>
      <ol>
        <li>Our team will thoroughly review your application</li>
        <li>You'll receive an email with our decision within 4-5 business days</li>
        <li>If approved, our support team will guide you through the payment process</li>
        <li>Once payment is complete, you'll be on our waiting list for available puppies</li>
      </ol>
      <p>If you have any questions, our support team is here to help!</p>
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

  generateAdminNotificationEmail(
    applicantName: string,
    applicantEmail: string,
    applicantPhone: string,
    puppyName: string,
    paymentMethod: string,
    applicationId: string,
    puppyDetails?: {
      id: string;
      name: string;
      breed: string;
      gender: string;
      color: string;
      price: number;
      birthDate: string;
      images: string[];
      generation?: string;
      vaccinations?: string[];
    }
  ): string {
    const puppyInfoHtml = puppyDetails ? `
      <h3>Puppy Information:</h3>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        ${puppyDetails.images && puppyDetails.images.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <img src="${puppyDetails.images[0]}" alt="${puppyDetails.name}" style="max-width: 300px; height: auto; border-radius: 5px;">
          </div>
        ` : ''}
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 8px;"><strong>Name:</strong> ${puppyDetails.name}</li>
          <li style="margin-bottom: 8px;"><strong>Breed:</strong> ${puppyDetails.breed}</li>
          <li style="margin-bottom: 8px;"><strong>Gender:</strong> ${puppyDetails.gender}</li>
          <li style="margin-bottom: 8px;"><strong>Color:</strong> ${puppyDetails.color}</li>
          <li style="margin-bottom: 8px;"><strong>Price:</strong> $${puppyDetails.price}</li>
          <li style="margin-bottom: 8px;"><strong>Birth Date:</strong> ${new Date(puppyDetails.birthDate).toLocaleDateString()}</li>
          ${puppyDetails.generation ? `<li style="margin-bottom: 8px;"><strong>Generation:</strong> ${puppyDetails.generation}</li>` : ''}
          ${puppyDetails.vaccinations && puppyDetails.vaccinations.length > 0 ? `<li style="margin-bottom: 8px;"><strong>Vaccinations:</strong> ${puppyDetails.vaccinations.join(', ')}</li>` : ''}
        </ul>
      </div>
    ` : '';

    return `
      <h2>🐕 New Application Submitted</h2>
      <p>A new adoption application has been received.</p>
      
      <h3>Applicant Information:</h3>
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 8px;"><strong>Name:</strong> ${applicantName}</li>
          <li style="margin-bottom: 8px;"><strong>Email:</strong> ${applicantEmail}</li>
          <li style="margin-bottom: 8px;"><strong>Phone:</strong> ${applicantPhone}</li>
        </ul>
      </div>
      
      <h3>Application Details:</h3>
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 8px;"><strong>Application ID:</strong> ${applicationId}</li>
          <li style="margin-bottom: 8px;"><strong>Breed Applied For:</strong> ${puppyName}</li>
          <li style="margin-bottom: 8px;"><strong>Preferred Payment Method:</strong> ${paymentMethod}</li>
        </ul>
      </div>
      
      ${puppyInfoHtml}
      
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/admin/applications/${applicationId}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Review Full Application</a>
      </p>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">Best regards,<br/>PuppyHub USA System</p>
    `;
  }
}

export const emailService = new EmailService();
