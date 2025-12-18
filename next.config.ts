import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/investment-tech-tree',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure API routes work properly
  async rewrites() {
    return [
      {
        source: '/investment-tech-tree/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;