import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has SUCCESS+ subscription
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        member:members!inner (
          id,
          subscriptions (
            status
          )
        )
      `)
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription = (user as any).member?.subscriptions?.some((s: any) => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    if (req.method === 'GET') {
      const { eventType, upcoming } = req.query;

      let query = supabase
        .from('events')
        .select(`
          *,
          registrations:event_registrations (
            status
          )
        `)
        .eq('isPublished', true)
        .eq('isPremium', true)
        .eq('registrations.userId', user.id);

      if (eventType && eventType !== 'all') {
        query = query.eq('eventType', eventType as string);
      }

      if (upcoming === 'true') {
        query = query.gte('startDateTime', new Date().toISOString());
      }

      const { data: events, error: eventsError } = await query.order('startDateTime', { ascending: true });

      if (eventsError) {
        throw eventsError;
      }

      const eventsWithRegistration = (events || []).map((event: any) => ({
        ...event,
        isRegistered: event.registrations?.length > 0,
        registrationStatus: event.registrations?.[0]?.status || null,
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
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !event || !event.isPublished) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('userId', user.id)
        .eq('eventId', eventId)
        .single();

      if (existingRegistration) {
        return res.status(400).json({ error: 'Already registered for this event' });
      }

      // Check if event is full
      if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        // Add to waitlist
        const { data: registration, error: regError } = await supabase
          .from('event_registrations')
          .insert({
            userId: user.id,
            eventId,
            status: 'WAITLISTED',
          })
          .select()
          .single();

        if (regError) throw regError;

        return res.status(201).json({ ...registration, message: 'Added to waitlist' });
      }

      // Create registration
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          userId: user.id,
          eventId,
          status: 'REGISTERED',
        })
        .select()
        .single();

      if (regError) throw regError;

      // Increment attendee count
      const { error: updateError } = await supabase
        .from('events')
        .update({ currentAttendees: (event.currentAttendees || 0) + 1 })
        .eq('id', eventId);

      if (updateError) throw updateError;

      return res.status(201).json(registration);
    }

    if (req.method === 'DELETE') {
      // Cancel registration
      const { eventId } = req.query;

      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .select('status')
        .eq('userId', user.id)
        .eq('eventId', eventId as string)
        .single();

      if (regError || !registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      // Update registration status
      const { error: updateRegError } = await supabase
        .from('event_registrations')
        .update({
          status: 'CANCELED',
          canceledAt: new Date().toISOString(),
        })
        .eq('userId', user.id)
        .eq('eventId', eventId as string);

      if (updateRegError) throw updateRegError;

      // Decrement attendee count if was registered (not waitlisted)
      if (registration.status === 'REGISTERED') {
        const { data: event } = await supabase
          .from('events')
          .select('currentAttendees')
          .eq('id', eventId as string)
          .single();

        if (event) {
          const { error: updateEventError } = await supabase
            .from('events')
            .update({ currentAttendees: Math.max(0, (event.currentAttendees || 0) - 1) })
            .eq('id', eventId as string);

          if (updateEventError) throw updateEventError;
        }
      }

      return res.status(200).json({ message: 'Registration canceled' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
