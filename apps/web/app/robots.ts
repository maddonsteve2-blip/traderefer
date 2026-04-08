import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/dashboard/',
                    '/settings/',
                    '/admin/',
                    '/onboarding/',
                    '/login/',
                    '/register/',
                    '/account/',
                    '/sitemaps/jobs/',
                ],
            },
        ],
        sitemap: 'https://traderefer.au/sitemap.xml',
        host: 'https://traderefer.au',
    };
}
