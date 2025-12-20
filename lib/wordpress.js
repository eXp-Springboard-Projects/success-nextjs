// Simple in-memory cache to reduce redundant API calls during build
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute cache during build

export async function fetchWordPressData(endpoint, retries = 5, delay = 2000) {
  const API_URL = process.env.WORDPRESS_API_URL;

  if (!API_URL) {
    throw new Error("WORDPRESS_API_URL is not defined in .env.local");
  }

  // Check cache first
  const cacheKey = endpoint;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add small delay between all requests to avoid rate limiting
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }

      const response = await fetch(`${API_URL}/${endpoint}`, {
        headers: {
          'User-Agent': 'SUCCESS-Next.js',
        },
      });

      if (!response.ok) {
        // If rate limited or server error, retry with exponential backoff
        if (response.status === 429 || response.status >= 500) {
          console.warn(`[WordPress API] Rate limited or server error on endpoint "${endpoint}" (Status: ${response.status}), attempt ${attempt + 1}/${retries}`);
          if (attempt < retries - 1) {
            const backoffDelay = delay * Math.pow(2, attempt + 1);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
        }
        console.error(`[WordPress API] Failed to fetch from "${API_URL}/${endpoint}" - Status: ${response.status}`);
        throw new Error(`Failed to fetch data from endpoint: ${endpoint} (Status: ${response.status})`);
      }

      const data = await response.json();

      // Cache the result
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      if (attempt === retries - 1) {
        console.error(`[WordPress API] Failed after ${retries} attempts for endpoint "${endpoint}":`, error.message);
        throw error;
      }
      console.warn(`[WordPress API] Retry ${attempt + 1}/${retries} for endpoint "${endpoint}" due to error:`, error.message);
      const backoffDelay = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}