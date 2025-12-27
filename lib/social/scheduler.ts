/**
 * Queue & Scheduler Utilities
 *
 * Manages post queue, scheduling slots, and queue operations
 */

import { supabaseAdmin } from '@/lib/supabase';
import { SocialPost, QueueSlot, Platform } from '@/types/social';

/**
 * Get the next available time slot for a user
 */
export async function getNextAvailableSlot(
  userId: string,
  platforms: Platform[]
): Promise<Date | null> {
  const db = supabaseAdmin();

  // Get user's active queue slots
  const { data: slots, error } = await db
    .from('social_queue_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error || !slots || slots.length === 0) {
    return null;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  // Find next slot
  for (let i = 0; i < 14; i++) {
    // Check 2 weeks ahead
    const checkDay = (currentDay + i) % 7;

    for (const slot of slots) {
      if (slot.day_of_week !== checkDay) continue;

      // Skip if platforms don't match
      const hasMatchingPlatform = platforms.some((p) => slot.platforms.includes(p));
      if (!hasMatchingPlatform) continue;

      // Calculate the actual date/time
      const daysUntil = i;
      const slotDate = new Date(now);
      slotDate.setDate(slotDate.getDate() + daysUntil);

      const [hours, minutes] = slot.time_slot.split(':').map(Number);
      slotDate.setHours(hours, minutes, 0, 0);

      // Skip if in the past
      if (slotDate <= now) continue;

      // Check if this slot is already occupied
      const { data: existingPost } = await db
        .from('social_posts')
        .select('id')
        .gte('scheduled_at', new Date(slotDate.getTime() - 5 * 60000).toISOString()) // 5 min before
        .lte('scheduled_at', new Date(slotDate.getTime() + 5 * 60000).toISOString()) // 5 min after
        .in('status', ['scheduled', 'publishing', 'published'])
        .limit(1)
        .single();

      if (!existingPost) {
        return slotDate;
      }
    }
  }

  return null;
}

/**
 * Add a post to the queue (assigns next available slot)
 */
export async function addToQueue(userId: string, postId: string, platforms: Platform[]): Promise<Date | null> {
  const nextSlot = await getNextAvailableSlot(userId, platforms);

  if (nextSlot) {
    const db = supabaseAdmin();
    await db
      .from('social_posts')
      .update({
        scheduled_at: nextSlot.toISOString(),
        status: 'scheduled',
      })
      .eq('id', postId);
  }

  return nextSlot;
}

/**
 * Reorder posts in the queue
 */
export async function reorderQueue(
  userId: string,
  postIds: string[]
): Promise<void> {
  const db = supabaseAdmin();

  // Update queue positions
  const updates = postIds.map((id, index) => ({
    id,
    queue_position: index,
  }));

  for (const update of updates) {
    await db
      .from('social_posts')
      .update({ queue_position: update.queue_position })
      .eq('id', update.id)
      .eq('user_id', userId); // Ensure user owns the post
  }

  // Re-assign time slots based on new order
  await reassignQueueSlots(userId);
}

/**
 * Reassign time slots to posts based on queue position
 */
async function reassignQueueSlots(userId: string): Promise<void> {
  const db = supabaseAdmin();

  // Get all queued posts ordered by position
  const { data: posts } = await db
    .from('social_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .order('queue_position', { ascending: true });

  if (!posts || posts.length === 0) return;

  // Get queue slots
  const { data: slots } = await db
    .from('social_queue_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('time_slot', { ascending: true });

  if (!slots || slots.length === 0) return;

  const now = new Date();
  let slotIndex = 0;
  let dayOffset = 0;

  for (const post of posts) {
    let assigned = false;

    while (!assigned && dayOffset < 365) {
      // Max 1 year ahead
      const slot = slots[slotIndex % slots.length];
      const checkDay = (now.getDay() + dayOffset) % 7;

      if (slot.day_of_week === checkDay) {
        const hasMatchingPlatform = (post.target_platforms as Platform[]).some((p) =>
          slot.platforms.includes(p)
        );

        if (hasMatchingPlatform) {
          const slotDate = new Date(now);
          slotDate.setDate(slotDate.getDate() + dayOffset);

          const [hours, minutes] = slot.time_slot.split(':').map(Number);
          slotDate.setHours(hours, minutes, 0, 0);

          if (slotDate > now) {
            await db
              .from('social_posts')
              .update({ scheduled_at: slotDate.toISOString() })
              .eq('id', post.id);

            assigned = true;
          }
        }
      }

      slotIndex++;
      if (slotIndex % slots.length === 0) {
        dayOffset++;
      }
    }
  }
}

/**
 * Fill empty queue slots with evergreen content
 */
export async function fillQueueWithEvergreen(
  userId: string,
  daysAhead: number = 7
): Promise<number> {
  const db = supabaseAdmin();

  // Get published evergreen posts
  const { data: evergreenPosts } = await db
    .from('social_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_evergreen', true)
    .eq('status', 'published')
    .order('last_recycled_at', { ascending: true });

  if (!evergreenPosts || evergreenPosts.length === 0) {
    return 0;
  }

  let filled = 0;

  for (const post of evergreenPosts) {
    const nextSlot = await getNextAvailableSlot(userId, post.target_platforms);

    if (nextSlot && nextSlot <= new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)) {
      // Create a new scheduled post from evergreen
      await db.from('social_posts').insert({
        user_id: userId,
        content: post.content,
        content_variants: post.content_variants,
        media_urls: post.media_urls,
        media_ids: post.media_ids,
        link_url: post.link_url,
        link_preview: post.link_preview,
        scheduled_at: nextSlot.toISOString(),
        status: 'scheduled',
        target_platforms: post.target_platforms,
        is_evergreen: false,
        recycle_count: (post.recycle_count || 0) + 1,
      });

      filled++;

      // Update last recycled time
      await db
        .from('social_posts')
        .update({ last_recycled_at: new Date().toISOString() })
        .eq('id', post.id);
    }
  }

  return filled;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(userId: string): Promise<{
  totalScheduled: number;
  nextPostDate: Date | null;
  emptySlots: number;
}> {
  const db = supabaseAdmin();

  const { data: scheduled } = await db
    .from('social_posts')
    .select('scheduled_at')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  const totalScheduled = scheduled?.length || 0;
  const nextPostDate = scheduled?.[0]?.scheduled_at ? new Date(scheduled[0].scheduled_at) : null;

  // Calculate empty slots in next 7 days
  const { data: slots } = await db
    .from('social_queue_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  const totalSlots = slots?.length || 0;
  const emptySlots = Math.max(0, totalSlots * 7 - totalScheduled);

  return {
    totalScheduled,
    nextPostDate,
    emptySlots,
  };
}
