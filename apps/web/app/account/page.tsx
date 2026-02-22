import { UserProfile } from '@clerk/nextjs';

export default async function AccountPage() {
    return (
        <main className="container mx-auto py-24 flex justify-center min-h-[70vh]">
            <UserProfile routing="hash" />
        </main>
    );
}
