import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has SUCCESS+ subscription
    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: { member: { include: { subscriptions: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription = user.member?.subscriptions?.some(s => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    if (req.method === 'GET') {
      const { eventType, upcoming } = req.query;

      const where: any = { isPublished: true, isPremium: true };

      if (eventType && eventType !== 'all') {
        where.eventType = eventType;
      }

      if (upcoming === 'true') {
        where.startDateTime = {
          gte: new Date(),
        };
      }

      const events = await prisma.events.findMany({
        where,
        include: {
          registrations: {
            where: { userId: user.id },
          },
        },
        orderBy: { startDateTime: 'asc' },
      });

      const eventsWithRegistration = events.map((event) => ({
        ...event,
        isRegistered: event.registrations.length > 0,
        registrationStatus: event.registrations[0]?.status || null,
      }));

      return res.status(200).json(eventsWithRegistration);
    }

    if (req.method === 'POST') {
      // Register for an event
      const { eventId } = req.body;

      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      // Check if event exists
      const event = await prisma.events.findUnique({
        where: { id: eventId },
      });

      if (!event || !event.isPublished) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Check if already registered
      const existingRegistration = await prisma.event_registrations.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId,
          },
        },
      });

      if (existingRegistration) {
        return res.status(400).json({ error: 'Already registered for this event' });
      }

      // Check if event is full
      if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        // Add to waitlist
        const registration = await prisma.event_registrations.create({
          data: {
            userId: user.id,
            eventId,
            status: 'WAITLISTED',
          },
        });

        return res.status(201).json({ ...registration, message: 'Added to waitlist' });
      }

      // Create registration and increment attendee count
      const registration = await prisma.event_registrations.create({
        data: {
          userId: user.id,
          eventId,
          status: 'REGISTERED',
        },
      });

      await prisma.events.update({
        where: { id: eventId },
        data: {
          currentAttendees: {
            increment: 1,
          },
        },
      });

      return res.status(201).json(registration);
    }

    if (req.method === 'DELETE') {
      // Cancel registration
      const { eventId } = req.query;

      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      const registration = await prisma.event_registrations.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventId as string,
          },
        },
      });

      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      // Update registration status
      await prisma.event_registrations.update({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventId as string,
          },
        },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      // Decrement attendee count if was registered (not waitlisted)
      if (registration.status === 'REGISTERED') {
        await prisma.events.update({
          where: { id: eventId as string },
          data: {
            currentAttendees: {
              decrement: 1,
            },
          },
        });
      }

      return res.status(200).json({ message: 'Registration canceled' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
