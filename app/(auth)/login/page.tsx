"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"signIn" | "signUp">("signIn");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            if (step === "signUp") {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                window.location.href = "/dashboard";
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                window.location.href = "/dashboard";
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || "Authentication failed");
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden"
        >
            <div className="p-8 md:p-10 space-y-8">
                <div className="text-center space-y-2">
                    <Link href="/" className="inline-block">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold font-serif text-2xl mx-auto shadow-lg shadow-amber-500/30">
                            S
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold font-serif text-stone-900">
                        {step === "signIn" ? "Welcome Back" : "Join ShulGenius"}
                    </h1>
                    <p className="text-stone-500">
                        {step === "signIn" ? "Sign in to manage your Kehilla" : "Create an account for your Shul"}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-stone-700 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="gabbai@shul.com"
                                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-stone-700 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-stone-900/20 hover:shadow-stone-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {step === "signIn" ? "Sign In" : "Create Account"}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="pt-4 border-t border-stone-100 text-center">
                    <p className="text-sm text-stone-500">
                        {step === "signIn" ? "New to ShulGenius?" : "Already have an account?"}
                        <button
                            type="button"
                            onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
                            className="ml-1.5 font-bold text-amber-600 hover:text-amber-700 hover:underline"
                        >
                            {step === "signIn" ? "Create Account" : "Log in"}
                        </button>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
