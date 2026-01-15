import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }

  // Only allow mysuccessplus.com images
  if (!url.startsWith('https://mysuccessplus.com/')) {
    return res.status(403).json({ error: 'Invalid image source' });
  }

  try {
    // Fetch the image from the external source
    const imageResponse = await fetch(url);

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({
        error: `Failed to fetch image: ${imageResponse.statusText}`
      });
    }

    // Get the content type
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Set cache headers (cache for 1 day)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('CDN-Cache-Control', 'public, max-age=86400');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=86400');

    // Stream the image to the response
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.status(200).send(buffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}
