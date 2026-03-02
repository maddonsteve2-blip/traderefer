// Next.js requires a default export from sitemap.ts or the build fails.
// The /sitemap.xml route is intercepted by a beforeFiles rewrite in next.config.ts
// before this function is ever called — actual sitemap logic is in app/api/sitemaps/*.
// See docs/README.md Sitemap Architecture section.
export default function sitemap() {
    return [];
}


