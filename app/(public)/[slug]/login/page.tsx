"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ShulData {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
}

export default function LoginPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const [shul, setShul] = useState<ShulData | null>(null);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            if (!slug) return;

            // 1. Fetch Shul Data
            const { data: shulData } = await supabase
                .from("shuls")
                .select("id, name, slug, logo_url")
                .eq("slug", slug.toLowerCase())
                .single();

            if (shulData) setShul(shulData);

            // 2. Check if already logged in
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace(`/s/${slug}/portal`);
            } else {
                setPageLoading(false);
            }
        };

        init();
    }, [slug, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/s/${slug}/portal`,
                },
            });

            if (error) throw error;
            setSent(true);
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to send login link. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
            </div>
        );
    }

    if (!shul) return null;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-stone-100"
            >
                <div className="text-center">
                    {shul.logo_url && (
                        <img
                            src={shul.logo_url}
                            alt={shul.name}
                            className="mx-auto h-20 w-20 rounded-full object-cover mb-4 ring-4 ring-stone-100"
                        />
                    )}
                    <h2 className="text-3xl font-bold text-stone-900 tracking-tight">
                        Member Login
                    </h2>
                    <p className="mt-2 text-sm text-stone-600">
                        Sign in to manage your account at {shul.name}
                    </p>
                </div>

                {sent ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
                    >
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-green-900">Check your email</h3>
                        <p className="mt-2 text-sm text-green-700">
                            We've sent a magic login link to <strong>{email}</strong>.
                            <br />
                            Click the link to sign in instantly.
                        </p>
                        <button
                            onClick={() => setSent(false)}
                            className="mt-6 text-sm text-green-700 font-medium hover:text-green-800 underline"
                        >
                            Use a different email
                        </button>
                    </motion.div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                                Email address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-stone-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-shadow"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-stone-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Send Magic Link
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link href={`/s/${slug}`} className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
