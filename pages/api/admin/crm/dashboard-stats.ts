import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    // Get date ranges
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total contacts with trend
    const { data: totalContactsData, error: totalContactsError } = await supabase
      .rpc('count_contacts');

    if (totalContactsError) throw totalContactsError;

    const { data: contactsLastMonthData, error: contactsLastMonthError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', firstOfMonth.toISOString());

    if (contactsLastMonthError) throw contactsLastMonthError;

    const totalContacts = totalContactsData || 0;
    const contactsLastMonth = contactsLastMonthData || 0;
    const contactsTrend = totalContacts - contactsLastMonth;

    // Active deals
    const { data: activeDealsData, error: activeDealsError } = await supabase
      .from('deals')
      .select('value')
      .eq('status', 'open');

    if (activeDealsError) throw activeDealsError;

    const activeDealsCount = activeDealsData?.length || 0;
    const dealsTotalValue = activeDealsData?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

    // Open tickets
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select('status, resolved_at, created_at')
      .neq('status', 'closed');

    if (ticketsError) throw ticketsError;

    const openTicketsCount = ticketsData?.length || 0;
    const resolvedTickets = ticketsData?.filter(t => t.resolved_at) || [];
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const hours = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / resolvedTickets.length
      : 0;

    // Emails sent this month
    const { data: emailsData, error: emailsError } = await supabase
      .from('email_sends')
      .select('opened_at')
      .gte('sent_at', firstOfThisMonth.toISOString());

    if (emailsError) throw emailsError;

    const emailsSent = emailsData?.length || 0;
    const emailsOpened = emailsData?.filter(e => e.opened_at).length || 0;
    const openRate = emailsSent > 0
      ? ((emailsOpened / emailsSent) * 100).toFixed(1)
      : '0.0';

    // Recent activities (across contacts, deals, tickets)
    const { data: contactActivities, error: contactActError } = await supabase
      .from('contact_activities')
      .select('type, description, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(5);

    if (contactActError) throw contactActError;

    const { data: dealActivities, error: dealActError } = await supabase
      .from('deal_activities')
      .select('type, description, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(5);

    if (dealActError) throw dealActError;

    const recentActivities = [
      ...(contactActivities || []).map(a => ({ ...a, source: 'contact' })),
      ...(dealActivities || []).map(a => ({ ...a, source: 'deal' }))
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    // Top performing campaigns
    const { data: topCampaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('id, name, total_sent, total_opened, total_clicked, sent_at')
      .in('status', ['completed', 'sending'])
      .order('total_opened', { ascending: false })
      .limit(5);

    if (campaignsError) throw campaignsError;

    const campaignsWithRate = (topCampaigns || []).map(c => ({
      ...c,
      open_rate: c.total_sent > 0 ? (c.total_opened / c.total_sent * 100) : 0
    })).sort((a, b) => b.open_rate - a.open_rate);

    // Pipeline summary
    const { data: dealStages, error: stagesError } = await supabase
      .from('deal_stages')
      .select('id, name, color, order')
      .order('order', { ascending: true });

    if (stagesError) throw stagesError;

    const { data: openDeals, error: openDealsError } = await supabase
      .from('deals')
      .select('stage_id, value')
      .eq('status', 'open');

    if (openDealsError) throw openDealsError;

    const pipelineSummary = (dealStages || []).map(stage => {
      const stageDeals = (openDeals || []).filter(d => d.stage_id === stage.id);
      return {
        stage_id: stage.id,
        stage_name: stage.name,
        stage_color: stage.color,
        stage_order: stage.order,
        deal_count: stageDeals.length,
        total_value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)
      };
    });

    // Tickets by priority
    const { data: ticketsByPriorityData, error: priorityError } = await supabase
      .from('tickets')
      .select('priority')
      .neq('status', 'closed');

    if (priorityError) throw priorityError;

    const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
    const ticketsByPriority = Object.entries(
      (ticketsByPriorityData || []).reduce((acc: any, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {})
    ).map(([priority, count]) => ({ priority, count }))
      .sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 99));

    return res.status(200).json({
      stats: {
        totalContacts,
        contactsTrend,
        activeDeals: activeDealsCount,
        dealsTotalValue,
        openTickets: openTicketsCount,
        avgResolutionTime,
        emailsSent,
        emailOpenRate: openRate,
      },
      recentActivities,
      topCampaigns: campaignsWithRate,
      pipelineSummary,
      ticketsByPriority,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
