import { redirect } from "next/navigation";

export default async function OldBusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    redirect(`/b/${slug}`);
}
