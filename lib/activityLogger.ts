import { Department } from '@/lib/types';
import { supabaseAdmin } from './supabase';

export interface ActivityLog {
  userId?: string;
  userEmail: string;
  userName?: string;
  department?: Department;
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  description?: string;
  metadata?: any;
}

/**
 * Log an activity to the staff activity feed
 * This creates a cross-department visible activity log
 */
export async function logActivity(activity: ActivityLog): Promise<void> {
  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from('staff_activity_feed').insert({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: activity.userId,
      userEmail: activity.userEmail,
      userName: activity.userName,
      department: activity.department,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      entityName: activity.entityName,
      description: activity.description,
      metadata: activity.metadata ? JSON.parse(JSON.stringify(activity.metadata)) : undefined,
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error('Activity logging error:', error);
    }
  } catch (error) {
    // Don't throw - logging failure shouldn't break the app
  }
}

/**
 * Get recent activity feed
 */
export async function getRecentActivity(
  limit: number = 50,
  department?: Department
): Promise<any[]> {
  try {
    const supabase = supabaseAdmin();
    let query = supabase
      .from('staff_activity_feed')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get recent activity error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get activity feed for a specific user
 */
export async function getUserActivity(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('staff_activity_feed')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get user activity error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Action type constants for consistent logging
 */
export const ActivityActions = {
  // User management
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_DEPARTMENT_ASSIGNED: 'user.department_assigned',

  // Content management
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_PUBLISHED: 'post.published',
  POST_DELETED: 'post.deleted',

  // Subscription management
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_PAUSED: 'subscription.paused',
  SUBSCRIPTION_RESUMED: 'subscription.resumed',

  // Order management
  ORDER_CREATED: 'order.created',
  ORDER_FULFILLED: 'order.fulfilled',
  ORDER_REFUNDED: 'order.refunded',

  // System actions
  SETTING_CHANGED: 'setting.changed',
  DEPLOYMENT_TRIGGERED: 'deployment.triggered',
  CACHE_CLEARED: 'cache.cleared',

  // Marketing actions
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_SENT: 'campaign.sent',
  LANDING_PAGE_CREATED: 'landing_page.created',

  // Coaching actions
  PROGRAM_CREATED: 'program.created',
  SESSION_SCHEDULED: 'session.scheduled',
  CLIENT_ASSIGNED: 'client.assigned',
} as const;

export type ActivityAction = typeof ActivityActions[keyof typeof ActivityActions];
