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
      // Build a clean, branded FROM header so emails appear as coming from
      // "PuppyHub Sales <sales@puppyhubusa.com>" (or whatever SMTP_FROM is set to)
      const fromAddress = env.SMTP_FROM.includes('<')
        ? env.SMTP_FROM
        : `"PuppyHub Sales" <${env.SMTP_FROM}>`;

      await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      // Log successful email
      await prisma.emailLog.create({
        data: {
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          to: options.to,
          subject: options.subject,
          type: options.type,
          status: 'sent',
          createdAt: new Date()
        },
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed email
      await prisma.emailLog.create({
        data: {
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          to: options.to,
          subject: options.subject,
          type: options.type,
          status: 'failed',
          error: errorMessage,
          createdAt: new Date()
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
    application: {
      displayId: string;
      firstName: string;
      lastName: string;
      email: string;
      mobileNumber: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      paymentMethod: string | null;
      breedChoices: any;
      id: string;
    },
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
    // Payment method mapping
    const paymentMethodMap: Record<string, string> = {
      creditCard: 'Credit Card',
      bankTransfer: 'Bank Transfer',
      applePay: 'Apple Pay',
      googlePay: 'Google Pay',
      binance: 'Binance',
      crypto: 'Crypto',
    };
    const paymentMethod = application.paymentMethod 
      ? (paymentMethodMap[application.paymentMethod] || application.paymentMethod)
      : 'Not specified';

    // Get puppy name from breed choices
    const puppyName = application.breedChoices?.[0]?.breed || 'our puppies';

    // Full address
    const fullAddress = `${application.address}, ${application.city}, ${application.state} ${application.zipCode}`;

    // Logo URL - using the logo from the public folder
    const logoUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/images/icons/logo.png`
      : 'https://puppyhubusa.com/images/icons/logo.png';

    // Puppy information table
    // Ensure we use an absolute URL for the puppy image so it works in email clients
    const puppyImageUrl =
      puppyDetails && puppyDetails.images && puppyDetails.images.length > 0
        ? (puppyDetails.images[0].startsWith('http')
            ? puppyDetails.images[0]
            : `${process.env.FRONTEND_URL || 'https://puppyhubusa.com'}${puppyDetails.images[0]}`)
        : null;

    const puppyInfoHtml = puppyDetails ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <thead>
          <tr>
            <th colspan="2" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 20px; text-align: left; font-size: 18px; font-weight: 600;">
              🐕 Puppy Information
            </th>
          </tr>
        </thead>
        <tbody>
          ${puppyImageUrl ? `
          <tr>
            <td colspan="2" style="padding: 20px; text-align: center; background-color: #f8f9fa;">
              <img src="${puppyImageUrl}" alt="${puppyDetails.name}" style="max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057; width: 40%;">Name:</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${puppyDetails.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Breed:</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${puppyDetails.breed}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Gender:</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${puppyDetails.gender}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Color:</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${puppyDetails.color}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Price:</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529; font-weight: 600; color: #28a745;">$${puppyDetails.price.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Birth Date:</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${new Date(puppyDetails.birthDate).toLocaleDateString()}</td>
          </tr>
          ${puppyDetails.generation ? `
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Generation:</td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${puppyDetails.generation}</td>
          </tr>
          ` : ''}
          ${puppyDetails.vaccinations && puppyDetails.vaccinations.length > 0 ? `
          <tr>
            <td style="padding: 12px 20px; font-weight: 600; color: #495057;">Vaccinations:</td>
            <td style="padding: 12px 20px; color: #212529;">${puppyDetails.vaccinations.join(', ')}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Application - ${application.displayId}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <img src="${logoUrl}" alt="PuppyHub USA Logo" style="max-width: 200px; height: auto; margin-bottom: 10px;">
            <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: 600;">New Application Submitted</h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <p style="color: #6c757d; font-size: 16px; margin-bottom: 30px;">A new adoption application has been received and requires your review.</p>

            <!-- Applicant Information Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr>
                  <th colspan="2" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 20px; text-align: left; font-size: 18px; font-weight: 600;">
                    👤 Applicant Information
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057; width: 40%;">Application ID:</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529; font-weight: 600; font-size: 18px; color: #667eea;">#${application.displayId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">First Name:</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${application.firstName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Last Name:</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${application.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Email:</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">
                    <a href="mailto:${application.email}" style="color: #667eea; text-decoration: none;">${application.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Phone:</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">
                    <a href="tel:${application.mobileNumber}" style="color: #667eea; text-decoration: none;">${application.mobileNumber}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Full Address:</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${fullAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Breed Applied For:</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #e9ecef; color: #212529;">${puppyName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; font-weight: 600; color: #495057;">Payment Method:</td>
                  <td style="padding: 12px 20px; color: #212529;">${paymentMethod}</td>
                </tr>
              </tbody>
            </table>

            ${puppyInfoHtml}

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://puppyhubusa.com'}/admin/applications/${application.id}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;">
                Review Full Application
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              Best regards,<br/>
              <strong style="color: #495057;">PuppyHub USA System</strong>
            </p>
            <p style="color: #adb5bd; font-size: 12px; margin: 10px 0 0 0;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
