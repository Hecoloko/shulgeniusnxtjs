import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalDashboard from "./_components/PortalDashboard";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function PortalPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch Shul ID from slug
    const { data: shul } = await supabase
        .from("shuls")
        .select("id, name")
        .eq("slug", slug.toLowerCase())
        .single();

    if (!shul) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-12">
            <div className="bg-stone-900 border-b border-stone-800">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Member Portal
                    </h1>
                    <p className="text-stone-400">
                        Manage your account, payments, and pledges for {shul.name}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8">
                <PortalDashboard shulId={shul.id} slug={slug} />
            </div>
        </div>
    );
}
