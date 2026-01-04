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

  const { id } = req.query;
  const supabase = supabaseAdmin();

  try {
    switch (req.method) {
      case 'GET':
        return await getEvent(id as string, res, supabase);
      case 'PUT':
        return await updateEvent(id as string, req, res, supabase);
      case 'DELETE':
        return await deleteEvent(id as string, res, supabase);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Event API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getEvent(id: string, res: NextApiResponse, supabase: any) {
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      event_registrations (
        *,
        users:userId (
          id,
          name,
          email
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  return res.status(200).json({
    success: true,
    event: {
      ...event,
      registrations: event.event_registrations || [],
      currentAttendees: event.event_registrations?.length || 0,
    },
  });
}

async function updateEvent(id: string, req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
    title,
    slug,
    description,
    eventType,
    startDateTime,
    endDateTime,
    timezone,
    location,
    thumbnail,
    hostName,
    hostBio,
    hostImage,
    isPremium,
    maxAttendees,
    isPublished,
  } = req.body;

  // Check if slug is being changed and already exists
  if (slug) {
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'An event with this slug already exists' });
    }
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (description !== undefined) updateData.description = description;
  if (eventType !== undefined) updateData.eventType = eventType;
  if (startDateTime !== undefined) updateData.startDateTime = new Date(startDateTime).toISOString();
  if (endDateTime !== undefined) updateData.endDateTime = endDateTime ? new Date(endDateTime).toISOString() : null;
  if (timezone !== undefined) updateData.timezone = timezone;
  if (location !== undefined) updateData.location = location;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
  if (hostName !== undefined) updateData.hostName = hostName;
  if (hostBio !== undefined) updateData.hostBio = hostBio;
  if (hostImage !== undefined) updateData.hostImage = hostImage;
  if (isPremium !== undefined) updateData.isPremium = isPremium;
  if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees;
  if (isPublished !== undefined) updateData.isPublished = isPublished;

  const { data: event, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update event' });
  }

  return res.status(200).json({
    success: true,
    event,
  });
}

async function deleteEvent(id: string, res: NextApiResponse, supabase: any) {
  // Check if event has registrations
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('id, status')
    .eq('eventId', id);

  const activeRegistrations = registrations?.filter(
    (r: any) => r.status === 'REGISTERED' || r.status === 'WAITLISTED'
  );

  if (activeRegistrations && activeRegistrations.length > 0) {
    return res.status(400).json({
      error: 'Cannot delete event with active registrations',
      activeRegistrationCount: activeRegistrations.length,
    });
  }

  // Delete all registrations (canceled/attended)
  if (registrations && registrations.length > 0) {
    await supabase
      .from('event_registrations')
      .delete()
      .eq('eventId', id);
  }

  // Delete the event
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }

  return res.status(200).json({
    success: true,
    message: 'Event deleted successfully',
  });
}
