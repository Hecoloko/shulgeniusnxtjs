"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save, ShieldCheck, Key, CreditCard } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AddProcessorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    shulId: string; // We need to know which shul we are adding for
}

export default function AddProcessorDialog({ isOpen, onClose, onCreated, shulId }: AddProcessorDialogProps) {
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        type: "cardknox", // Default to Cardknox as requested
        // Config logic
        ifields_key: "",
        transaction_key: "",
        recurring_key: "",
        webhook_secret: "",
        software_name: "ShulGenius",
        software_version: "2.0.0"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Create Processor
            const { data: processor, error: procError } = await supabase
                .from('payment_processors')
                .insert({
                    shul_id: shulId,
                    name: formData.name,
                    type: formData.type,
                    is_active: true,
                    is_default: false // Logic for default handled by list or trigger usually, safe to init false
                })
                .select()
                .single();

            if (procError) throw procError;
            if (!processor) throw new Error("Failed to create processor record");

            // 2. Add Credentials
            // Only add non-empty keys
            const credentialPayload: any = {
                processor_id: processor.id,
                software_name: formData.software_name,
                software_version: formData.software_version
            };

            if (formData.ifields_key) credentialPayload.ifields_key = formData.ifields_key;
            if (formData.transaction_key) credentialPayload.transaction_key = formData.transaction_key;
            if (formData.recurring_key) credentialPayload.recurring_key = formData.recurring_key;
            if (formData.webhook_secret) credentialPayload.webhook_secret = formData.webhook_secret;

            const { error: credError } = await supabase
                .from('payment_processor_credentials')
                .insert(credentialPayload);

            if (credError) {
                // Rollback processor
                await supabase.from('payment_processors').delete().eq('id', processor.id);
                throw credError;
            }

            onCreated();
            onClose();
            // Reset form
            setFormData({
                name: "",
                type: "cardknox",
                ifields_key: "",
                transaction_key: "",
                recurring_key: "",
                webhook_secret: "",
                software_name: "ShulGenius",
                software_version: "2.0.0"
            });
        } catch (err: any) {
            console.error("Error creating processor:", err);
            setError(err.message || "Failed to create processor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
                            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-amber-600" />
                                    Connect Processor
                                </h2>
                                <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1">Account Name</label>
                                        <input
                                            required
                                            placeholder="e.g. Main Shul Cardknox"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1">Processor Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: 'cardknox' })}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${formData.type === 'cardknox'
                                                    ? 'bg-amber-50 border-amber-500 text-amber-700'
                                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                                    }`}
                                            >
                                                <CreditCard className="w-4 h-4" /> Cardknox
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: 'stripe' })}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${formData.type === 'stripe'
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                                    }`}
                                            >
                                                <CreditCard className="w-4 h-4" /> Stripe
                                            </button>
                                        </div>
                                    </div>

                                    {formData.type === 'cardknox' && (
                                        <div className="space-y-4 pt-4 border-t border-stone-100">
                                            <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">
                                                <Key className="w-4 h-4" />
                                                <span>Enter your Cardknox API keys. Use the transaction key (`xKey`) for backend processing and iFields key for frontend.</span>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-stone-700 mb-1">Transaction Key (xKey)</label>
                                                <input
                                                    type="password"
                                                    required
                                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                    value={formData.transaction_key}
                                                    onChange={e => setFormData({ ...formData, transaction_key: e.target.value })}
                                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-stone-700 mb-1">iFields Key</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Add iFields Key here needed for frontend"
                                                    value={formData.ifields_key}
                                                    onChange={e => setFormData({ ...formData, ifields_key: e.target.value })}
                                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono text-sm"
                                                />
                                                <p className="text-xs text-stone-500 mt-1">Required for secure credit card entry form</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-stone-700 mb-1">Recurring API Key (Optional)</label>
                                                <input
                                                    type="password"
                                                    placeholder="If different from Transaction Key"
                                                    value={formData.recurring_key}
                                                    onChange={e => setFormData({ ...formData, recurring_key: e.target.value })}
                                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.type === 'stripe' && (
                                        <div className="space-y-4 pt-4 border-t border-stone-100">
                                            <div className="p-3 bg-stone-50 rounded text-sm text-stone-600">
                                                Stripe support is currently limited. Cardknox is recommended for full feature support.
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-stone-700 mb-1">Secret Key (sk_live_...)</label>
                                                <input
                                                    type="password"
                                                    value={formData.transaction_key} // Mapping to transaction_key col for storage
                                                    onChange={e => setFormData({ ...formData, transaction_key: e.target.value })}
                                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-stone-700 mb-1">Publishable Key (pk_live_...)</label>
                                                <input
                                                    type="text"
                                                    value={formData.ifields_key} // Mapping to ifields_key col for storage
                                                    onChange={e => setFormData({ ...formData, ifields_key: e.target.value })}
                                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>

                            <div className="p-6 border-t border-stone-200 flex justify-end items-center gap-3 bg-stone-50 rounded-b-2xl">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.name || (formData.type === 'cardknox' && !formData.transaction_key) || (formData.type === 'stripe' && !formData.transaction_key)}
                                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-lg shadow-stone-900/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Connecting...' : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Connect Processor
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
