import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { Department } from '@/lib/types';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as any;

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.SUCCESS_PLUS)) {
    return res.status(403).json({ error: 'Forbidden - SUCCESS+ access required' });
  }

  const supabase = supabaseAdmin();

  try {
    switch (req.method) {
      case 'GET':
        return await getEvents(req, res, supabase);
      case 'POST':
        return await createEvent(req, res, supabase);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Events API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getEvents(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
    filter = 'all',
    month,
    year,
    eventType,
    limit = '50',
    offset = '0'
  } = req.query;

  let query = supabase
    .from('events')
    .select(`
      *,
      event_registrations(count)
    `)
    .order('startDateTime', { ascending: true })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  // Apply filters
  if (filter === 'upcoming') {
    query = query.gte('startDateTime', new Date().toISOString());
  } else if (filter === 'past') {
    query = query.lt('startDateTime', new Date().toISOString());
  } else if (filter === 'published') {
    query = query.eq('isPublished', true);
  } else if (filter === 'draft') {
    query = query.eq('isPublished', false);
  }

  if (eventType) {
    query = query.eq('eventType', eventType);
  }

  // Filter by month/year for calendar view
  if (month && year) {
    const startOfMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endOfMonth = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);

    query = query
      .gte('startDateTime', startOfMonth.toISOString())
      .lte('startDateTime', endOfMonth.toISOString());
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }

  const formattedEvents = events?.map((event: any) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    eventType: event.eventType,
    startDateTime: event.startDateTime,
    endDateTime: event.endDateTime,
    timezone: event.timezone,
    location: event.location,
    thumbnail: event.thumbnail,
    hostName: event.hostName,
    hostBio: event.hostBio,
    hostImage: event.hostImage,
    isPremium: event.isPremium,
    maxAttendees: event.maxAttendees,
    currentAttendees: event.event_registrations?.[0]?.count || 0,
    isPublished: event.isPublished,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  })) || [];

  return res.status(200).json({
    success: true,
    events: formattedEvents,
    total: formattedEvents.length,
  });
}

async function createEvent(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
    title,
    slug,
    description,
    eventType = 'WEBINAR',
    startDateTime,
    endDateTime,
    timezone = 'America/New_York',
    location,
    thumbnail,
    hostName,
    hostBio,
    hostImage,
    isPremium = true,
    maxAttendees,
    isPublished = false,
  } = req.body;

  if (!title || !slug || !startDateTime) {
    return res.status(400).json({ error: 'Title, slug, and start date/time are required' });
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'An event with this slug already exists' });
  }

  const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      id: eventId,
      title,
      slug,
      description,
      eventType,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
      timezone,
      location,
      thumbnail,
      hostName,
      hostBio,
      hostImage,
      isPremium,
      maxAttendees,
      currentAttendees: 0,
      isPublished,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }

  return res.status(201).json({
    success: true,
    event,
  });
}
