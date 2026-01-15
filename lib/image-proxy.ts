/**
 * Proxies external images through our API to bypass CORS restrictions
 * @param imageUrl The original image URL
 * @returns The proxied URL or original if already local
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/images/placeholder.png';
  }

  // If it's already a local image, return as-is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // If it's from mysuccessplus.com, proxy it to avoid CORS issues
  if (imageUrl.startsWith('https://mysuccessplus.com/')) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  // For other external URLs, return as-is (they should work)
  return imageUrl;
}
