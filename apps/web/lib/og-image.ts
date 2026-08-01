type OgTemplate =
    | "home"
    | "profile"
    | "local-trade"
    | "suburb"
    | "top"
    | "near-me"
    | "trade-guide"
    | "job";

type OgImageParams = {
    template: OgTemplate;
    title: string;
    subtitle?: string;
    eyebrow?: string;
    badge?: string;
    stat1?: string;
    stat2?: string;
    stat3?: string;
};

const SITE_URL = "https://traderefer.au";

export function buildOgImageUrl(params: OgImageParams) {
    const url = new URL("/api/og", SITE_URL);

    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
}
