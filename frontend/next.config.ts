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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
      {
        // Espaces privés : jamais indexés par les moteurs de recherche
        source: '/:prive(admin-.*|commande-admin|dashboard|livreur|panier|commande|fidelite|favoris|login|inscription|mot-de-passe-oublie|email-templates)/:rest*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/:prive(admin-.*|commande-admin|dashboard|livreur|panier|fidelite|favoris|login|inscription|mot-de-passe-oublie)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
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
