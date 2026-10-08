import type { MetadataRoute } from 'next';
import { SITE_URL, listerPlatsServeur } from '@/lib/seo';

export const revalidate = 3600;

const PAGES: { chemin: string; priorite: number; frequence: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { chemin: '', priorite: 1, frequence: 'weekly' },
  { chemin: '/catalogue', priorite: 0.9, frequence: 'daily' },
  { chemin: '/blog', priorite: 0.6, frequence: 'weekly' },
  { chemin: '/about', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/faq', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/contact', priorite: 0.5, frequence: 'monthly' },
  { chemin: '/careers', priorite: 0.3, frequence: 'monthly' },
  { chemin: '/help', priorite: 0.4, frequence: 'monthly' },
  { chemin: '/terms', priorite: 0.2, frequence: 'yearly' },
  { chemin: '/privacy', priorite: 0.2, frequence: 'yearly' },
  { chemin: '/refund', priorite: 0.2, frequence: 'yearly' },
  { chemin: '/cookies', priorite: 0.2, frequence: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const plats = await listerPlatsServeur();
  return [
    ...PAGES.map((p) => ({ url: `${SITE_URL}${p.chemin}`, changeFrequency: p.frequence, priority: p.priorite })),
    ...plats.map((p) => ({ url: `${SITE_URL}/produit/${p._id}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
