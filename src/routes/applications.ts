import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { emailService } from '../services/email.service';
import { createApplicationSchema, updateApplicationStatusSchema } from '../schemas/application.schema';

const router = Router();

/**
 * POST /api/applications
 * Submit a new adoption application
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createApplicationSchema.parse(req.body);

    const application = await prisma.application.create({
      data: {
        ...validatedData,
        breedChoices: validatedData.breedChoices,
      },
    });

    // Send confirmation email
    const confirmationEmail = emailService.generateApplicationConfirmationEmail(
      validatedData.firstName,
      application.id
    );

    await emailService.sendEmail({
      to: validatedData.email,
      subject: 'Application Received - PuppyHub USA',
      html: confirmationEmail,
      type: 'application_confirmation',
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application.id,
    });
  } catch (error) {
    console.error('Error creating application:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ error: 'Invalid application data' });
    }

    res.status(500).json({ error: 'Failed to submit application' });
  }
});

/**
 * GET /api/applications/:id
 * Fetch application by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { puppy: true },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

/**
 * GET /api/applications
 * Fetch all applications (admin only)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, email } = req.query;

    const where: Record<string, any> = {};

    if (status) where.status = status as string;
    if (email) where.email = email as string;

    const applications = await prisma.application.findMany({
      where,
      include: { puppy: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * PATCH /api/applications/:id/status
 * Update application status (admin only)
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateApplicationStatusSchema.parse(req.body);

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: validatedData.status,
        rejectionReason: validatedData.rejectionReason,
      },
    });

    // Send status update email
    const statusEmail = emailService.generateStatusUpdateEmail(
      application.firstName,
      validatedData.status as 'approved' | 'rejected',
      validatedData.rejectionReason
    );

    await emailService.sendEmail({
      to: application.email,
      subject: `Application ${validatedData.status} - PuppyHub USA`,
      html: statusEmail,
      type: 'status_update',
    });

    res.json({
      message: 'Application status updated',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application status:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ error: 'Invalid status data' });
    }

    res.status(500).json({ error: 'Failed to update application status' });
  }
});

export default router;
