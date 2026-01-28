"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/utils/animations";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function EmailSettingsPage() {
    const supabase = createClient();

    // Simple state form for MVP
    const [formData, setFormData] = useState({
        email_from: "",
        smtp_host: "smtp.gmail.com",
        smtp_port: 587,
        smtp_user: "",
        smtp_pass: "",
    });

    const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
    const [loading, setLoading] = useState(true);

    // Load existing config on mount
    useEffect(() => {
        async function loadConfig() {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value')
                .in('key', ['email_from', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass']);

            if (!error && data) {
                const configMap = data.reduce((acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                }, {} as Record<string, string | null>);

                setFormData(prev => ({
                    email_from: configMap['email_from'] || prev.email_from,
                    smtp_host: configMap['smtp_host'] || prev.smtp_host,
                    smtp_port: Number(configMap['smtp_port']) || prev.smtp_port,
                    smtp_user: configMap['smtp_user'] || prev.smtp_user,
                    smtp_pass: configMap['smtp_pass'] || prev.smtp_pass,
                }));
            }
            setLoading(false);
        }
        loadConfig();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("saving");
        try {
            // Upsert each setting
            const settings = [
                { key: 'email_from', value: formData.email_from, category: 'email' },
                { key: 'smtp_host', value: formData.smtp_host, category: 'email' },
                { key: 'smtp_port', value: String(formData.smtp_port), category: 'email' },
                { key: 'smtp_user', value: formData.smtp_user, category: 'email' },
                { key: 'smtp_pass', value: formData.smtp_pass, category: 'email' },
            ];

            for (const setting of settings) {
                const { error } = await supabase
                    .from('settings')
                    .upsert(setting as never, { onConflict: 'key' });

                if (error) throw error;
            }

            setStatus("success");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-stone-500">Loading settings...</div>;
    }

    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-4xl mx-auto space-y-8"
        >
            <motion.div variants={fadeInUp}>
                <h1 className="text-3xl font-bold font-serif text-stone-900">
                    Email Configuration
                </h1>
                <p className="text-stone-500 mt-2">
                    Connect your Shul's Gmail account to send official emails.
                </p>
            </motion.div>

            <motion.div
                variants={fadeInUp}
                className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-700">From Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email_from}
                                onChange={e => setFormData({ ...formData, email_from: e.target.value })}
                                placeholder="office@shul.org"
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-stone-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-700">SMTP Host</label>
                            <input
                                type="text"
                                required
                                value={formData.smtp_host}
                                onChange={e => setFormData({ ...formData, smtp_host: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-stone-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-700">SMTP User (Gmail Address)</label>
                            <input
                                type="email"
                                required
                                value={formData.smtp_user}
                                onChange={e => setFormData({ ...formData, smtp_user: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-stone-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-700">SMTP Password (App Password)</label>
                            <input
                                type="password"
                                required
                                value={formData.smtp_pass}
                                onChange={e => setFormData({ ...formData, smtp_pass: e.target.value })}
                                placeholder="****************"
                                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-stone-900"
                            />
                            <p className="text-xs text-stone-500">
                                Make sure to use an App Password from Google Account Security.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                        <div className="flex items-center gap-2">
                            {status === 'success' && (
                                <span className="text-green-600 flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle className="w-4 h-4" /> Saved Successfully
                                </span>
                            )}
                            {status === 'error' && (
                                <span className="text-red-500 flex items-center gap-2 text-sm font-medium">
                                    <AlertCircle className="w-4 h-4" /> Failed to save
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'saving'}
                            className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-stone-900/10 flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {status === 'saving' ? 'Saving...' : (
                                <>
                                    <Save className="w-4 h-4" /> Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
