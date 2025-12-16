import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { testEmail, testData = {} } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  if (!testEmail) {
    return res.status(400).json({ error: 'Test email address is required' });
  }

  try {
    const template = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_templates WHERE id = ${id}
    `;

    if (template.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const tpl = template[0];

    // Replace variables in HTML content
    let htmlContent = tpl.html_content;
    const variables = tpl.variables || [];

    for (const variable of variables) {
      const value = testData[variable] || `{{${variable}}}`;
      htmlContent = htmlContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    }

    // Log the test send (in real implementation, this would actually send the email)
    const sendId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO email_sends (
        id, template_id, to_email, from_email, from_name, subject, status, metadata
      ) VALUES (
        ${sendId}, ${id}, ${testEmail}, 'noreply@success.com', 'SUCCESS Magazine',
        ${'[TEST] ' + tpl.subject}, 'sent',
        ${JSON.stringify({ isTest: true, testData })}::jsonb
      )
    `;

    // In a real implementation, you would send the email here using AWS SES or similar
    // For now, we'll just return success with the rendered HTML
    return res.status(200).json({
      success: true,
      message: `Test email would be sent to ${testEmail}`,
      renderedHtml: htmlContent,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ error: 'Failed to send test email' });
  }
}
