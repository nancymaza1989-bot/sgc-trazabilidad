/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async redirects() {
    return [
      { source: '/', destination: '/dashboard', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // El HTML de las páginas NO debe cachearse durante un año: eso impide ver
        // las actualizaciones tras cada deploy. Solo se cachean los estáticos de _next.
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  poweredByHeader: false,
};

module.exports = nextConfig;