import { redirect } from "next/navigation";

export default async function ReferPageRedirect({
    params
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    redirect(`/dashboard/referrer/refer/${slug}`);
}
