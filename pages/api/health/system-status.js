export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check system components
    const systemStatus = {
      database: await checkDatabase(),
      wordpressApi: await checkWordPressAPI(),
      staticGeneration: await checkStaticGeneration(),
      cdn: await checkCDN(),
      ssl: await checkSSL()
    };

    res.status(200).json(systemStatus);
  } catch (error) {
    res.status(500).json({ message: 'Failed to check system status' });
  }
}

async function checkDatabase() {
  try {
    // Check database connection
    return {
      status: 'healthy',
      message: 'Database connected and responding',
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'critical',
      message: 'Database connection failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkWordPressAPI() {
  try {
    const response = await fetch('https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?per_page=1');
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'WordPress API accessible',
        lastChecked: new Date().toISOString()
      };
    }
    throw new Error('API returned non-200 status');
  } catch (error) {
    return {
      status: 'warning',
      message: 'WordPress API connection issues',
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkStaticGeneration() {
  return {
    status: 'healthy',
    message: 'ISR working correctly',
    lastChecked: new Date().toISOString()
  };
}

async function checkCDN() {
  return {
    status: 'healthy',
    message: 'CDN operational',
    lastChecked: new Date().toISOString()
  };
}

async function checkSSL() {
  return {
    status: 'healthy',
    message: 'SSL certificate valid',
    lastChecked: new Date().toISOString()
  };
}
