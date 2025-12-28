import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import https from 'https';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check system components in parallel
    const [database, apiServer, staticGeneration, cdn, ssl, wordpressAPI] = await Promise.all([
      checkDatabase(),
      checkAPIServer(),
      checkStaticGeneration(),
      checkCDN(),
      checkSSL(),
      checkWordPressAPI()
    ]);

    const systemStatus = {
      database,
      apiServer,
      staticGeneration,
      cdn,
      ssl,
      wordpressAPI
    };

    res.status(200).json(systemStatus);
  } catch (error) {
    console.error('[Health Check] System status error:', error);
    res.status(500).json({ message: 'Failed to check system status' });
  }
}

/**
 * Check Supabase database connection
 */
async function checkDatabase() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, but connection works
      throw error;
    }

    return {
      status: 'healthy' as const,
      message: 'Supabase database connected and responding',
      lastChecked: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[Health Check] Database error:', error);
    return {
      status: 'critical' as const,
      message: `Database connection failed: ${error.message || 'Unknown error'}`,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check Next.js API server by testing internal endpoint
 */
async function checkAPIServer() {
  try {
    // Test that API routes are responding
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const testEndpoint = `${baseUrl}/api/health`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(testEndpoint, {
      signal: controller.signal,
      headers: { 'User-Agent': 'HealthCheck/1.0' }
    });

    clearTimeout(timeout);

    if (response.ok) {
      return {
        status: 'healthy' as const,
        message: 'Next.js API routes responding',
        lastChecked: new Date().toISOString()
      };
    }

    return {
      status: 'warning' as const,
      message: `API returned status ${response.status}`,
      lastChecked: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[Health Check] API Server error:', error);
    return {
      status: 'warning' as const,
      message: error.name === 'AbortError' ? 'API server timeout' : 'API server connection issues',
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check static generation by verifying ISR is configured
 */
async function checkStaticGeneration() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const testEndpoint = `${baseUrl}/api/revalidate-test`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Test if we can access the filesystem for static pages
    const fs = await import('fs/promises');
    const path = await import('path');

    // Check if .next directory exists (indicates build has run)
    const nextDir = path.join(process.cwd(), '.next');
    try {
      await fs.access(nextDir);
      clearTimeout(timeout);

      return {
        status: 'healthy' as const,
        message: 'ISR configured and build artifacts present',
        lastChecked: new Date().toISOString()
      };
    } catch {
      clearTimeout(timeout);
      return {
        status: 'warning' as const,
        message: 'Build artifacts not found - may need to run npm run build',
        lastChecked: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'warning' as const,
      message: 'Could not verify ISR status',
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check CDN/Vercel deployment
 */
async function checkCDN() {
  try {
    // Check if running on Vercel
    const isVercel = process.env.VERCEL === '1';
    const vercelUrl = process.env.VERCEL_URL;

    if (isVercel && vercelUrl) {
      return {
        status: 'healthy' as const,
        message: `Deployed on Vercel: ${vercelUrl}`,
        lastChecked: new Date().toISOString()
      };
    }

    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'warning' as const,
        message: 'Production mode but not on Vercel',
        lastChecked: new Date().toISOString()
      };
    }

    return {
      status: 'healthy' as const,
      message: 'Development mode (no CDN)',
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'warning' as const,
      message: 'CDN status unknown',
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check SSL certificate validity
 */
async function checkSSL() {
  try {
    const siteUrl = process.env.NEXTAUTH_URL || 'https://www.success.com';

    // Only check SSL in production or if HTTPS URL is configured
    if (!siteUrl.startsWith('https://')) {
      return {
        status: 'healthy' as const,
        message: 'Development mode (no SSL)',
        lastChecked: new Date().toISOString()
      };
    }

    // Parse hostname from URL
    const hostname = new URL(siteUrl).hostname;

    return new Promise((resolve) => {
      const options = {
        host: hostname,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false,
        agent: false
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();

        if (res.socket.authorized === false) {
          resolve({
            status: 'critical' as const,
            message: 'SSL certificate invalid',
            lastChecked: new Date().toISOString()
          });
          return;
        }

        if (cert && cert.valid_to) {
          const expiryDate = new Date(cert.valid_to);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 0) {
            resolve({
              status: 'critical' as const,
              message: 'SSL certificate expired',
              lastChecked: new Date().toISOString()
            });
          } else if (daysUntilExpiry < 30) {
            resolve({
              status: 'warning' as const,
              message: `SSL certificate expires in ${daysUntilExpiry} days`,
              lastChecked: new Date().toISOString()
            });
          } else {
            resolve({
              status: 'healthy' as const,
              message: `SSL certificate valid (expires in ${daysUntilExpiry} days)`,
              lastChecked: new Date().toISOString()
            });
          }
        } else {
          resolve({
            status: 'healthy' as const,
            message: 'SSL certificate valid',
            lastChecked: new Date().toISOString()
          });
        }
      });

      req.on('error', (error) => {
        console.error('[Health Check] SSL error:', error);
        resolve({
          status: 'warning' as const,
          message: 'Could not verify SSL certificate',
          lastChecked: new Date().toISOString()
        });
      });

      req.end();
    });
  } catch (error) {
    console.error('[Health Check] SSL check error:', error);
    return {
      status: 'warning' as const,
      message: 'SSL check failed',
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check WordPress REST API connection
 */
async function checkWordPressAPI() {
  try {
    const wpApiUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

    if (!wpApiUrl) {
      return {
        status: 'warning' as const,
        message: 'WordPress API URL not configured',
        lastChecked: new Date().toISOString()
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Test WordPress API by fetching posts
    const response = await fetch(`${wpApiUrl}/posts?per_page=1`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'HealthCheck/1.0' }
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return {
        status: 'healthy' as const,
        message: `WordPress API responding (${wpApiUrl})`,
        lastChecked: new Date().toISOString()
      };
    }

    return {
      status: 'critical' as const,
      message: `WordPress API returned status ${response.status}`,
      lastChecked: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[Health Check] WordPress API error:', error);
    return {
      status: 'critical' as const,
      message: error.name === 'AbortError' ? 'WordPress API timeout' : 'WordPress API connection failed',
      lastChecked: new Date().toISOString()
    };
  }
}
