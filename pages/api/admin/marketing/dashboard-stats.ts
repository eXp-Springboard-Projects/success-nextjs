import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Department } from '@/lib/types';
import { hasDepartmentAccess } from '@/lib/departmentAuth';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.MARKETING)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const supabase = supabaseAdmin();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // TODO: These complex aggregation queries should use Supabase RPC functions for better performance

    // Get active campaigns count
    const { count: activeCampaigns } = await supabase
      .from('email_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Calculate email open rate (simplified version)
    const { data: emailSends } = await supabase
      .from('email_sends')
      .select('opened_at')
      .gte('sent_at', thirtyDaysAgo.toISOString());

    const totalSent = emailSends?.length || 0;
    const totalOpened = emailSends?.filter(e => e.opened_at !== null).length || 0;
    const emailOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    // Calculate conversion rate from landing pages
    const { data: landingPages } = await supabase
      .from('landing_pages')
      .select('views, conversions')
      .eq('status', 'published');

    const totalViews = landingPages?.reduce((sum, lp) => sum + (lp.views || 0), 0) || 0;
    const totalConversions = landingPages?.reduce((sum, lp) => sum + (lp.conversions || 0), 0) || 0;
    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    // Get site traffic (using email sends as proxy)
    const { count: siteTrafficToday } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', today.toISOString());

    // Get top performing campaigns (simplified - needs RPC for proper aggregation)
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('id, name, type, created_at')
      .in('status', ['active', 'completed'])
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // TODO: This needs an RPC function to properly calculate conversions and CTR
    const topCampaigns = campaigns?.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type || 'Email',
      conversions: 0, // Placeholder - needs RPC function
      clickThroughRate: 0, // Placeholder - needs RPC function
    })) || [];

    const stats = {
      siteTrafficToday: siteTrafficToday || 0,
      emailOpenRate,
      activeCampaigns: activeCampaigns || 0,
      conversionRate,
      topCampaigns,
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
