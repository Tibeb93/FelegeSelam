import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  const locales = ['am', 'en'];

  const routes = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/news', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/mezmur', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/calendar', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/courses', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/login', changeFrequency: 'yearly' as const, priority: 0.5 },
    { path: '/register', changeFrequency: 'yearly' as const, priority: 0.6 },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    routes.forEach((route) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    });
  });

  return sitemapEntries;
}
