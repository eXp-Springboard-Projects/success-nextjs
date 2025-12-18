// Temporary mock API endpoint for staff management
// This prevents the "<!DOCTYPE..." JSON parsing error
// by returning valid JSON instead of HTML 404 page

export default async function handler(req, res) {
  const { method } = req;

  // Only allow GET for now
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return mock staff data
    // TODO: Replace with real database query once DATABASE_URL is configured
    const mockStaff = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@success.com',
        role: 'SUPER_ADMIN',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        postsCount: 0,
      },
    ];

    return res.status(200).json({
      success: true,
      staff: mockStaff,
      count: mockStaff.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
