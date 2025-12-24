import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../lib/supabase';

const supabase = supabaseAdmin();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Email Analytics
      const [emailStatsResult, campaignsResult, emailTimeseriesResult] = await Promise.all([
        // Email stats - using email_events table
        supabase.rpc('get_email_stats', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        }),
        // TODO: Create database function:
        // CREATE OR REPLACE FUNCTION get_email_stats(start_date timestamptz, end_date timestamptz)
        // RETURNS TABLE(total_sent bigint, total_opens bigint, total_clicks bigint, total_bounced bigint, total_unsubscribed bigint)
        // AS $$
        // BEGIN
        //   RETURN QUERY
        //   SELECT
        //     COUNT(CASE WHEN event = 'sent' THEN 1 END) as total_sent,
        //     COUNT(CASE WHEN event = 'opened' THEN 1 END) as total_opens,
        //     COUNT(CASE WHEN event = 'clicked' THEN 1 END) as total_clicks,
        //     COUNT(CASE WHEN event = 'bounced' THEN 1 END) as total_bounced,
        //     0::bigint as total_unsubscribed
        //   FROM email_events
        //   WHERE "createdAt" >= start_date AND "createdAt" <= end_date;
        // END;
        // $$ LANGUAGE plpgsql;

        // Top campaigns
        supabase
          .from('campaigns')
          .select('id, name, sentCount, openedCount, clickedCount')
          .gte('createdAt', start.toISOString())
          .lte('createdAt', end.toISOString())
          .order('openedCount', { ascending: false })
          .limit(5),

        // Email timeseries - using email_events
        supabase.rpc('get_email_timeseries', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        }),
        // TODO: Create database function:
        // CREATE OR REPLACE FUNCTION get_email_timeseries(start_date timestamptz, end_date timestamptz)
        // RETURNS TABLE(date date, sends bigint, opens bigint, clicks bigint)
        // AS $$
        // BEGIN
        //   RETURN QUERY
        //   SELECT
        //     DATE("createdAt") as date,
        //     COUNT(CASE WHEN event = 'sent' THEN 1 END) as sends,
        //     COUNT(CASE WHEN event = 'opened' THEN 1 END) as opens,
        //     COUNT(CASE WHEN event = 'clicked' THEN 1 END) as clicks
        //   FROM email_events
        //   WHERE "createdAt" >= start_date AND "createdAt" <= end_date
        //   GROUP BY DATE("createdAt")
        //   ORDER BY date ASC;
        // END;
        // $$ LANGUAGE plpgsql;
      ]);

      if (emailStatsResult.error) throw emailStatsResult.error;
      if (campaignsResult.error) throw campaignsResult.error;
      if (emailTimeseriesResult.error) throw emailTimeseriesResult.error;

      const emailStats = emailStatsResult.data || [{ total_sent: 0, total_opens: 0, total_clicks: 0, total_bounced: 0, total_unsubscribed: 0 }];
      const campaigns = campaignsResult.data || [];
      const emailTimeseries = emailTimeseriesResult.data || [];

      const emailStatsData = emailStats[0];
      const totalSent = Number(emailStatsData.total_sent);
      const totalOpens = Number(emailStatsData.total_opens);
      const totalClicks = Number(emailStatsData.total_clicks);
      const totalBounced = Number(emailStatsData.total_bounced);

      const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
      const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

      // Contact Analytics
      const [contactTimeseriesResult, contactsBySourceResult, contactsByStatusResult] = await Promise.all([
        supabase.rpc('get_contacts_timeseries', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        }),
        // TODO: Create database function:
        // CREATE OR REPLACE FUNCTION get_contacts_timeseries(start_date timestamptz, end_date timestamptz)
        // RETURNS TABLE(date date, count bigint)
        // AS $$
        // BEGIN
        //   RETURN QUERY
        //   SELECT
        //     DATE(created_at) as date,
        //     COUNT(*) as count
        //   FROM contacts
        //   WHERE created_at >= start_date AND created_at <= end_date
        //   GROUP BY DATE(created_at)
        //   ORDER BY date ASC;
        // END;
        // $$ LANGUAGE plpgsql;

        supabase.rpc('get_contacts_by_source', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        }),
        // TODO: Create database function:
        // CREATE OR REPLACE FUNCTION get_contacts_by_source(start_date timestamptz, end_date timestamptz)
        // RETURNS TABLE(source text, count bigint)
        // AS $$
        // BEGIN
        //   RETURN QUERY
        //   SELECT
        //     COALESCE(source, 'Unknown') as source,
        //     COUNT(*) as count
        //   FROM contacts
        //   WHERE created_at >= start_date AND created_at <= end_date
        //   GROUP BY source
        //   ORDER BY count DESC;
        // END;
        // $$ LANGUAGE plpgsql;

        supabase.rpc('get_contacts_by_status', {
          start_date: start.toISOString(),
          end_date: end.toISOString()
        }),
        // TODO: Create database function:
        // CREATE OR REPLACE FUNCTION get_contacts_by_status(start_date timestamptz, end_date timestamptz)
        // RETURNS TABLE(status text, count bigint)
        // AS $$
        // BEGIN
        //   RETURN QUERY
        //   SELECT
        //     status,
        //     COUNT(*) as count
        //   FROM contacts
        //   WHERE created_at >= start_date AND created_at <= end_date
        //   GROUP BY status;
        // END;
        // $$ LANGUAGE plpgsql;
      ]);

      if (contactTimeseriesResult.error) throw contactTimeseriesResult.error;
      if (contactsBySourceResult.error) throw contactsBySourceResult.error;
      if (contactsByStatusResult.error) throw contactsByStatusResult.error;

      const contactTimeseries = contactTimeseriesResult.data || [];
      const contactsBySource = contactsBySourceResult.data || [];
      const contactsByStatus = contactsByStatusResult.data || [];

      // Deal Analytics (if deals table exists)
      let dealStats: {
        totalValue: number;
        winRate: number;
        avgDealSize: number;
        dealsByStage: Array<{ stage: string; count: number; value: number }>;
        dealsTimeseries: Array<{ date: string; count: number; value: number }>;
      } = {
        totalValue: 0,
        winRate: 0,
        avgDealSize: 0,
        dealsByStage: [],
        dealsTimeseries: [],
      };

      try {
        const [dealsDataResult, dealsByStageResult, dealsTimeseriesResult] = await Promise.all([
          supabase.rpc('get_deals_stats', {
            start_date: start.toISOString(),
            end_date: end.toISOString()
          }),
          // TODO: Create database function:
          // CREATE OR REPLACE FUNCTION get_deals_stats(start_date timestamptz, end_date timestamptz)
          // RETURNS TABLE(total_value numeric, won_count bigint, total_count bigint)
          // AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT
          //     SUM(value) as total_value,
          //     COUNT(CASE WHEN stage = 'WON' THEN 1 END) as won_count,
          //     COUNT(*) as total_count
          //   FROM deals
          //   WHERE created_at >= start_date AND created_at <= end_date;
          // END;
          // $$ LANGUAGE plpgsql;

          supabase.rpc('get_deals_by_stage', {
            start_date: start.toISOString(),
            end_date: end.toISOString()
          }),
          // TODO: Create database function:
          // CREATE OR REPLACE FUNCTION get_deals_by_stage(start_date timestamptz, end_date timestamptz)
          // RETURNS TABLE(stage text, count bigint, total_value numeric)
          // AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT
          //     stage,
          //     COUNT(*) as count,
          //     SUM(value) as total_value
          //   FROM deals
          //   WHERE created_at >= start_date AND created_at <= end_date
          //   GROUP BY stage
          //   ORDER BY
          //     CASE stage
          //       WHEN 'LEAD' THEN 1
          //       WHEN 'QUALIFIED' THEN 2
          //       WHEN 'PROPOSAL' THEN 3
          //       WHEN 'NEGOTIATION' THEN 4
          //       WHEN 'WON' THEN 5
          //       WHEN 'LOST' THEN 6
          //       ELSE 7
          //     END;
          // END;
          // $$ LANGUAGE plpgsql;

          supabase.rpc('get_deals_timeseries', {
            start_date: start.toISOString(),
            end_date: end.toISOString()
          }),
          // TODO: Create database function:
          // CREATE OR REPLACE FUNCTION get_deals_timeseries(start_date timestamptz, end_date timestamptz)
          // RETURNS TABLE(date date, count bigint, total_value numeric)
          // AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT
          //     DATE(created_at) as date,
          //     COUNT(*) as count,
          //     SUM(value) as total_value
          //   FROM deals
          //   WHERE created_at >= start_date AND created_at <= end_date
          //   GROUP BY DATE(created_at)
          //   ORDER BY date ASC;
          // END;
          // $$ LANGUAGE plpgsql;
        ]);

        if (dealsDataResult.error) throw dealsDataResult.error;
        if (dealsByStageResult.error) throw dealsByStageResult.error;
        if (dealsTimeseriesResult.error) throw dealsTimeseriesResult.error;

        const dealsData = dealsDataResult.data || [{ total_value: 0, won_count: 0, total_count: 0 }];
        const dealsByStage = dealsByStageResult.data || [];
        const dealsTimeseries = dealsTimeseriesResult.data || [];

        const dealsDataRow = dealsData[0];
        const totalValue = Number(dealsDataRow.total_value || 0);
        const wonCount = Number(dealsDataRow.won_count);
        const totalCount = Number(dealsDataRow.total_count);
        const winRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;
        const avgDealSize = totalCount > 0 ? totalValue / totalCount : 0;

        dealStats = {
          totalValue,
          winRate,
          avgDealSize,
          dealsByStage: dealsByStage.map((d: any) => ({
            stage: d.stage,
            count: Number(d.count),
            value: Number(d.total_value || 0),
          })),
          dealsTimeseries: dealsTimeseries.map((d: any) => ({
            date: new Date(d.date).toISOString().split('T')[0],
            count: Number(d.count),
            value: Number(d.total_value || 0),
          })),
        };
      } catch (error) {
        // Deals table might not exist
      }

      // Ticket Analytics (if tickets table exists)
      let ticketStats: {
        totalTickets: number;
        avgResolutionTime: number;
        ticketsByCategory: Array<{ category: string; count: number }>;
        ticketsByPriority: Array<{ priority: string; count: number }>;
        ticketsTimeseries: Array<{ date: string; count: number }>;
      } = {
        totalTickets: 0,
        avgResolutionTime: 0,
        ticketsByCategory: [],
        ticketsByPriority: [],
        ticketsTimeseries: [],
      };

      try {
        const [ticketsDataResult, ticketsByCategoryResult, ticketsByPriorityResult, ticketsTimeseriesResult] = await Promise.all([
          supabase.rpc('get_tickets_stats', {
            start_date: start.toISOString(),
            end_date: end.toISOString()
          }),
          // TODO: Create database function:
          // CREATE OR REPLACE FUNCTION get_tickets_stats(start_date timestamptz, end_date timestamptz)
          // RETURNS TABLE(total_count bigint, avg_resolution_hours numeric)
          // AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT
          //     COUNT(*) as total_count,
          //     AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours
          //   FROM tickets
          //   WHERE created_at >= start_date AND created_at <= end_date;
          // END;
          // $$ LANGUAGE plpgsql;

          supabase.rpc('get_tickets_by_category', {
            start_date: start.toISOString(),
            end_date: end.toISOString()
          }),
          // TODO: Create database function:
          // CREATE OR REPLACE FUNCTION get_tickets_by_category(start_date timestamptz, end_date timestamptz)
          // RETURNS TABLE(category text, count bigint)
          // AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT
          //     category,
          //     COUNT(*) as count
          //   FROM tickets
          //   WHERE created_at >= start_date AND created_at <= end_date
          //   GROUP BY category
          //   ORDER BY count DESC;
          // END;
          // $$ LANGUAGE plpgsql;

          supabase.rpc('get_tickets_by_priority', {
            start_date: start.toISOString(),
            end_date: end.toISOString()
          }),
          // TODO: Create database function:
          // CREATE OR REPLACE FUNCTION get_tickets_by_priority(start_date timestamptz, end_date timestamptz)
          // RETURNS TABLE(priority text, count bigint)
          // AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT
          //     priority,
          //     COUNT(*) as count
          //   FROM tickets
          //   WHERE created_at >= start_date AND created_at <= end_date
          //   GROUP BY priority
          //   ORDER BY
          //     CASE priority
          //       WHEN 'URGENT' THEN 1
          //       WHEN 'HIGH' THEN 2
          //       WHEN 'MEDIUM' THEN 3
          //       WHEN 'LOW' THEN 4
          //       ELSE 5
          //     END;
          // END;
          // $$ LANGUAGE plpgsql;

          supabase.rpc('get_tickets_timeseries', {
            start_date: start.toISOString(),
            end_date: end.toISOString()
          }),
          // TODO: Create database function:
          // CREATE OR REPLACE FUNCTION get_tickets_timeseries(start_date timestamptz, end_date timestamptz)
          // RETURNS TABLE(date date, count bigint)
          // AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT
          //     DATE(created_at) as date,
          //     COUNT(*) as count
          //   FROM tickets
          //   WHERE created_at >= start_date AND created_at <= end_date
          //   GROUP BY DATE(created_at)
          //   ORDER BY date ASC;
          // END;
          // $$ LANGUAGE plpgsql;
        ]);

        if (ticketsDataResult.error) throw ticketsDataResult.error;
        if (ticketsByCategoryResult.error) throw ticketsByCategoryResult.error;
        if (ticketsByPriorityResult.error) throw ticketsByPriorityResult.error;
        if (ticketsTimeseriesResult.error) throw ticketsTimeseriesResult.error;

        const ticketsData = ticketsDataResult.data || [{ total_count: 0, avg_resolution_hours: 0 }];
        const ticketsByCategory = ticketsByCategoryResult.data || [];
        const ticketsByPriority = ticketsByPriorityResult.data || [];
        const ticketsTimeseries = ticketsTimeseriesResult.data || [];

        const ticketsDataRow = ticketsData[0];

        ticketStats = {
          totalTickets: Number(ticketsDataRow.total_count),
          avgResolutionTime: Number(ticketsDataRow.avg_resolution_hours || 0),
          ticketsByCategory: ticketsByCategory.map((t: any) => ({
            category: t.category,
            count: Number(t.count),
          })),
          ticketsByPriority: ticketsByPriority.map((t: any) => ({
            priority: t.priority,
            count: Number(t.count),
          })),
          ticketsTimeseries: ticketsTimeseries.map((t: any) => ({
            date: new Date(t.date).toISOString().split('T')[0],
            count: Number(t.count),
          })),
        };
      } catch (error) {
        // Tickets table might not exist
      }

      // Unsubscribe rate
      const { count: unsubscribeCount, error: unsubscribeError } = await supabase
        .from('email_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('unsubscribed', true)
        .gte('unsubscribedAt', start.toISOString())
        .lte('unsubscribedAt', end.toISOString());

      if (unsubscribeError) throw unsubscribeError;

      const unsubscribeRate = totalSent > 0 ? ((unsubscribeCount || 0) / totalSent) * 100 : 0;

      return res.status(200).json({
        email: {
          totalSent,
          totalOpens,
          totalClicks,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100,
          unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
          timeseries: emailTimeseries.map((t: any) => ({
            date: t.date,
            sends: Number(t.sends),
            opens: Number(t.opens),
            clicks: Number(t.clicks),
          })),
          topCampaigns: campaigns.map((c: any) => ({
            id: c.id,
            name: c.name,
            sent: c.sentCount,
            opens: c.openedCount,
            clicks: c.clickedCount,
            openRate: c.sentCount > 0 ? Math.round((c.openedCount / c.sentCount) * 10000) / 100 : 0,
          })),
        },
        contacts: {
          timeseries: contactTimeseries.map((c: any) => ({
            date: c.date,
            count: Number(c.count),
          })),
          bySource: contactsBySource.map((c: any) => ({
            source: c.source,
            count: Number(c.count),
          })),
          byStatus: contactsByStatus.map((c: any) => ({
            status: c.status,
            count: Number(c.count),
          })),
        },
        deals: dealStats,
        tickets: ticketStats,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
