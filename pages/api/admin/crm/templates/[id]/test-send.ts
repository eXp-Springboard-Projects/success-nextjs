import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { nanoid } from 'nanoid';

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
    const supabase = supabaseAdmin();

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Replace variables in HTML content
    let htmlContent = template.html_content;
    const variables = template.variables || [];

    for (const variable of variables) {
      const value = testData[variable] || `{{${variable}}}`;
      htmlContent = htmlContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    }

    // Log the test send (in real implementation, this would actually send the email)
    const sendId = nanoid();

    const { error: sendError } = await supabase
      .from('email_sends')
      .insert({
        id: sendId,
        template_id: id,
        to_email: testEmail,
        from_email: 'noreply@success.com',
        from_name: 'SUCCESS Magazine',
        subject: '[TEST] ' + template.subject,
        status: 'sent',
        metadata: { isTest: true, testData },
      });

    if (sendError) {
      throw sendError;
    }

    // In a real implementation, you would send the email here using AWS SES or similar
    // For now, we'll just return success with the rendered HTML
    return res.status(200).json({
      success: true,
      message: `Test email would be sent to ${testEmail}`,
      renderedHtml: htmlContent,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send test email' });
  }
}
