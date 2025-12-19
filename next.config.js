/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for AWS Amplify SSR deployment (skip in CI)
  ...(process.env.SKIP_STANDALONE !== 'true' && { output: 'standalone' }),
  
  // Configure build ID
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.success.com',
      },
      {
        protocol: 'https',
        hostname: 'successcom.wpenginepowered.com',
      },
      {
        protocol: 'https',
        hostname: 'mysuccessplus.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable compression
  compress: true,
  // Optimize production build
  productionBrowserSourceMaps: false,

  // Enable Turbopack explicitly
  turbopack: {},
};

module.exports = nextConfig;