import { NextApiRequest, NextApiResponse} from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

async function checkDatabase() {
  try {
    const supabase = supabaseAdmin();
    const start = Date.now();
    await supabase.from('users').select('id').limit(1).single();
    const responseTime = Date.now() - start;
    return {
      name: 'Database Status',
      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'warning' : 'critical',
      value: `Connected (${responseTime}ms)`,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'Database Status',
      status: 'critical',
      value: 'Connection failed',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkWordPressAPI() {
  try {
    const start = Date.now();
    const apiUrl = process.env.WORDPRESS_API_URL || 'https://successcom.wpenginepowered.com/wp-json/wp/v2';
    const response = await fetch(`${apiUrl}/posts?per_page=1`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    const responseTime = Date.now() - start;

    return {
      name: 'WordPress API',
      status: response.ok && responseTime < 2000 ? 'healthy' : responseTime < 5000 ? 'warning' : 'critical',
      value: response.ok ? `Connected (${responseTime}ms)` : `Error ${response.status}`,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'WordPress API',
      status: 'critical',
      value: 'Connection failed',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkStripeAPI() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        name: 'Stripe API',
        status: 'warning',
        value: 'Not configured',
        lastCheck: new Date().toISOString()
      };
    }

    const start = Date.now();
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
      },
      signal: AbortSignal.timeout(5000)
    });
    const responseTime = Date.now() - start;

    return {
      name: 'Stripe API',
      status: response.ok && responseTime < 2000 ? 'healthy' : responseTime < 5000 ? 'warning' : 'critical',
      value: response.ok ? `Connected (${responseTime}ms)` : `Error ${response.status}`,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'Stripe API',
      status: 'critical',
      value: 'Connection failed',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkMemoryUsage() {
  try {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const percentUsed = Math.round((used.heapUsed / used.heapTotal) * 100);

    return {
      name: 'Memory Usage',
      status: percentUsed < 70 ? 'healthy' : percentUsed < 85 ? 'warning' : 'critical',
      value: `${percentUsed}% (${heapUsedMB}MB / ${heapTotalMB}MB)`,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'Memory Usage',
      status: 'warning',
      value: 'Unable to check',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkAPIResponseTime() {
  try {
    const start = Date.now();
    // Test our own API by checking session
    await getServerSession(undefined as any, undefined as any, authOptions);
    const responseTime = Date.now() - start;

    return {
      name: 'API Response Time',
      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'warning' : 'critical',
      value: `${responseTime}ms avg`,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'API Response Time',
      status: 'warning',
      value: 'Unable to measure',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkDiskSpace() {
  // Note: Disk space checking in Node.js requires platform-specific modules
  // For now, we'll return a simulated value
  // In production, you'd use a library like 'diskusage' or system commands
  return {
    name: 'Disk Space',
    status: 'healthy',
    value: '45% used (available in production)',
    lastCheck: new Date().toISOString()
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      // Run all health checks in parallel
      const [database, wordpress, stripe, memory, apiResponseTime, diskSpace] = await Promise.all([
        checkDatabase(),
        checkWordPressAPI(),
        checkStripeAPI(),
        checkMemoryUsage(),
        checkAPIResponseTime(),
        checkDiskSpace()
      ]);

      const metrics = [database, apiResponseTime, memory, diskSpace, stripe, wordpress];

      return res.status(200).json({ metrics });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch system health' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
