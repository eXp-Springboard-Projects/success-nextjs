import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, format = 'csv', days = '30' } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Fetch the report data
    const reportRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/crm/reports/${type}?days=${days}`,
      {
        headers: {
          cookie: req.headers.cookie || '',
        },
      }
    );

    if (!reportRes.ok) {
      throw new Error('Failed to fetch report data');
    }

    const reportData = await reportRes.json();

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(type, reportData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csv);
    } else if (format === 'pdf') {
      // For PDF, we'd normally use a library like puppeteer or pdfkit
      // For now, we'll return a simple text response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.status(200).send('PDF generation not implemented yet');
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return res.status(500).json({ error: 'Failed to export report' });
  }
}

function generateCSV(type: string, data: any): string {
  const lines: string[] = [];

  switch (type) {
    case 'email':
      lines.push('Date,Sends,Opens,Clicks');
      if (data.sendsOverTime) {
        data.sendsOverTime.forEach((row: any) => {
          lines.push(`${row.date},${row.sends},${row.opens},${row.clicks}`);
        });
      }
      lines.push('');
      lines.push('Top Campaigns');
      lines.push('Campaign,Sent,Open Rate,Click Rate');
      if (data.topCampaigns) {
        data.topCampaigns.forEach((row: any) => {
          lines.push(`${row.name},${row.sent},${row.openRate.toFixed(2)}%,${row.clickRate.toFixed(2)}%`);
        });
      }
      break;

    case 'contacts':
      lines.push('Date,New Contacts');
      if (data.contactsOverTime) {
        data.contactsOverTime.forEach((row: any) => {
          lines.push(`${row.date},${row.count}`);
        });
      }
      lines.push('');
      lines.push('Contacts by Source');
      lines.push('Source,Count');
      if (data.contactsBySource) {
        data.contactsBySource.forEach((row: any) => {
          lines.push(`${row.name},${row.value}`);
        });
      }
      break;

    case 'deals':
      lines.push('Date,Pipeline Value');
      if (data.pipelineOverTime) {
        data.pipelineOverTime.forEach((row: any) => {
          lines.push(`${row.date},${row.value}`);
        });
      }
      lines.push('');
      lines.push('Revenue by Owner');
      lines.push('Owner,Revenue');
      if (data.revenueByOwner) {
        data.revenueByOwner.forEach((row: any) => {
          lines.push(`${row.owner},${row.revenue}`);
        });
      }
      break;

    case 'tickets':
      lines.push('Date,Ticket Count');
      if (data.ticketsOverTime) {
        data.ticketsOverTime.forEach((row: any) => {
          lines.push(`${row.date},${row.count}`);
        });
      }
      lines.push('');
      lines.push('Tickets by Category');
      lines.push('Category,Count');
      if (data.ticketsByCategory) {
        data.ticketsByCategory.forEach((row: any) => {
          lines.push(`${row.category},${row.count}`);
        });
      }
      break;
  }

  return lines.join('\n');
}
