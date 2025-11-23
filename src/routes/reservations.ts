import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * POST /api/reservations
 * Create a new reservation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { puppyId, customerEmail, customerName } = req.body;

    // Validate required fields
    if (!puppyId || !customerEmail || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if puppy exists
    const puppy = await prisma.puppy.findUnique({
      where: { id: puppyId },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    // Check if puppy is available
    if (puppy.status !== 'available') {
      return res.status(400).json({ error: 'Puppy is not available for reservation' });
    }

    // Create reservation (expires in 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const reservation = await prisma.reservation.create({
      data: {
        puppyId,
        customerEmail,
        customerName,
        expiresAt,
      },
    });

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

/**
 * GET /api/reservations/:id
 * Fetch reservation by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { puppy: true },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

/**
 * GET /api/reservations
 * Fetch reservations by email
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { email, status } = req.query;

    const where: Record<string, any> = {};

    if (email) where.customerEmail = email as string;
    if (status) where.status = status as string;

    const reservations = await prisma.reservation.findMany({
      where,
      include: { puppy: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

/**
 * PATCH /api/reservations/:id/cancel
 * Cancel a reservation
 */
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({
      message: 'Reservation cancelled',
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

export default router;
