import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin-', '/commande-admin', '/dashboard', '/livreur', '/panier', '/commande/', '/fidelite', '/favoris', '/login', '/inscription', '/mot-de-passe-oublie', '/email-templates', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
