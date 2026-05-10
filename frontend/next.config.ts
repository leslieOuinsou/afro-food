import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/menu', destination: '/catalogue', permanent: true },
      { source: '/menu/:path*', destination: '/catalogue', permanent: true },
      { source: '/vendeurs', destination: '/catalogue', permanent: false },
      { source: '/vendeurs/:slug', destination: '/catalogue', permanent: false },
    ];
  },
};

export default nextConfig;
