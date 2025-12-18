export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      message: 'Missing required fields',
      errors: {
        name: !name ? 'Name is required' : null,
        email: !email ? 'Email is required' : null,
        subject: !subject ? 'Subject is required' : null,
        message: !message ? 'Message is required' : null,
      }
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format',
      errors: { email: 'Please enter a valid email address' }
    });
  }

  // Validate message length
  if (message.length < 10) {
    return res.status(400).json({
      message: 'Message too short',
      errors: { message: 'Message must be at least 10 characters' }
    });
  }

  try {
    // TODO: In production, you would:
    // 1. Store in database (add ContactSubmission model to Prisma)
    // 2. Send email notification to admin
    // 3. Send confirmation email to user
    // 4. Integrate with email service (SendGrid, Mailgun, etc.)

    // For now, return success
    return res.status(200).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit contact form. Please try again later.',
      error: error.message,
    });
  }
}
