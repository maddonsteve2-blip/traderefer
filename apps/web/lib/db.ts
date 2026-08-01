import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

const query = neon(DATABASE_URL);

// postgres.js-compatible tagged-template signature (sql<Rows[]>`...`) over
// Neon's stateless HTTP driver. Required on Cloudflare Workers — TCP drivers
// hang in workerd and pooled module-scope connections break across requests —
// and works identically on Node/Vercel.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- match postgres.js's permissive untyped rows
export function sql<T = Record<string, any>[]>(
    strings: TemplateStringsArray,
    ...params: unknown[]
): Promise<T> {
    return query(strings, ...params) as unknown as Promise<T>;
}
