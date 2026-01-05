/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure build ID
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  
  typescript: {
    // TypeScript validation enabled - all errors fixed
    ignoreBuildErrors: false,
  },

  // URL Redirects for old WordPress URLs that changed during migration
  // CRITICAL: These redirects preserve QR codes and printed magazine URLs
  async redirects() {
    return [
      // ============================================
      // MAGAZINE QR CODE REDIRECTS - DO NOT REMOVE
      // ============================================
      
      // Daily SMS signup page - QR code in Mar/Apr 2025 magazine (going to press 1/6)
      // Redirect removed - page now exists at /daily-sms
      // {
      //   source: '/daily-sms',
      //   destination: '/daily-inspo-text',
      //   permanent: true,
      // },
      // {
      //   source: '/daily-sms/',
      //   destination: '/daily-inspo-text',
      //   permanent: true,
      // },
      
      // Jim Rohn Children's Book - QR code in Jan/Feb 2025 magazine
      // /yourenotatree → Amazon product page
      {
        source: '/yourenotatree',
        destination: 'https://www.amazon.com/dp/1733831339',
        permanent: true,
      },
      {
        source: '/yourenotatree/',
        destination: 'https://www.amazon.com/dp/1733831339',
        permanent: true,
      },
      
      // Jan/Feb house ad for Jim Rohn Children's Book
      {
        source: '/jan-feb-house-ad-jim-rohn-children-book',
        destination: 'https://www.amazon.com/dp/1733831339',
        permanent: true,
      },
      {
        source: '/jan-feb-house-ad-jim-rohn-children-book/',
        destination: 'https://www.amazon.com/dp/1733831339',
        permanent: true,
      },
      
      // SUCCESS+ BOGO Gamechanger offer - Nov/Dec magazine QR code
      {
        source: '/gamechanger',
        destination: 'https://offer.success.com/bogo/?utm_medium=qr-code&utm_source=magazine&utm_campaign=success-plus&utm_content=dts&utm_term=nov-dec-house-ad-bogo-blow-in-tip-on-gamechanger',
        permanent: true,
      },
      {
        source: '/gamechanger/',
        destination: 'https://offer.success.com/bogo/?utm_medium=qr-code&utm_source=magazine&utm_campaign=success-plus&utm_content=dts&utm_term=nov-dec-house-ad-bogo-blow-in-tip-on-gamechanger',
        permanent: true,
      },
      
      // ============================================
      // ADD MORE REDIRECTS BELOW
      // Format:
      // {
      //   source: '/old-url',
      //   destination: '/new-url-or-external-url',
      //   permanent: true,
      // },
      // ============================================
    ];
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

  // Disable Turbopack explicitly - it causes symlink errors with bcryptjs/jspdf
  turbopack: {},
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;