import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                ],
            },
        ],
        sitemap: 'https://traderefer.au/sitemap.xml',
        host: 'https://traderefer.au',
    };
}
