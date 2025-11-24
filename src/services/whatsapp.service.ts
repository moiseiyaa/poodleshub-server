import twilio from 'twilio';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

interface WhatsAppOptions {
  to: string;
  body: string;
  type: 'application_confirmation' | 'status_update' | 'notification';
}

class WhatsAppService {
  private client: ReturnType<typeof twilio>;

  constructor() {
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  async sendMessage(options: WhatsAppOptions): Promise<boolean> {
    try {
      await this.client.messages.create({
        from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${options.to}`,
        body: options.body,
      });

      // Log successful message
      await prisma.messageLog.create({
        data: {
          to: options.to,
          body: options.body,
          type: options.type,
          status: 'sent',
          channel: 'whatsapp',
        },
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed message
      await prisma.messageLog.create({
        data: {
          to: options.to,
          body: options.body,
          type: options.type,
          status: 'failed',
          channel: 'whatsapp',
          error: errorMessage,
        },
      });

      console.error('WhatsApp send failed:', errorMessage);
      return false;
    }
  }

  generateApplicationConfirmationMessage(
    applicantName: string,
    puppyName: string,
    applicationId: string
  ): string {
    return `Hi ${applicantName}! 👋

Thank you for submitting your adoption application for ${puppyName} to PuppyHub USA! 🐕

We have received your application (ID: ${applicationId}) and will review it within 4-5 business days.

Our support team will guide you through the payment and next steps. You'll receive an email with more details soon.

Best regards,
PuppyHub USA Team`;
  }

  generateStatusUpdateMessage(
    applicantName: string,
    status: 'approved' | 'rejected'
  ): string {
    if (status === 'approved') {
      return `Congratulations ${applicantName}! 🎉

Your adoption application has been approved! 

Our support team will contact you soon to guide you through the payment process and next steps.

Best regards,
PuppyHub USA Team`;
    }

    return `Hi ${applicantName},

Thank you for your interest in PuppyHub USA. Unfortunately, we are unable to move forward with your application at this time.

We encourage you to reapply in the future.

Best regards,
PuppyHub USA Team`;
  }
}

export const whatsappService = new WhatsAppService();
