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
    // Lien stable vers les étapes du pipeline Jenkins : afrofood…/pipeline (adresse réelle dans JENKINS_PUBLIC_URL)
    const jenkins = (process.env.JENKINS_PUBLIC_URL || '').replace(/\/$/, '');
    return [
      {
        source: '/pipeline',
        // Sans Jenkins hébergé : le lien mène aux étapes du pipeline GitHub Actions
        destination: jenkins ? `${jenkins}/job/afro-food/job/main/` : 'https://github.com/leslieOuinsou/afro-food/actions/workflows/ci.yml',
        permanent: false,
      },
      { source: '/menu', destination: '/catalogue', permanent: true },
      { source: '/menu/:path*', destination: '/catalogue', permanent: true },
      { source: '/vendeurs', destination: '/catalogue', permanent: false },
      { source: '/vendeurs/:slug', destination: '/catalogue', permanent: false },
    ];
  },
};

export default nextConfig;
