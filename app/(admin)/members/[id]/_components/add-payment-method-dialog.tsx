"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

interface AddPaymentMethodDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personId: string;
    shulId: string;
}

declare global {
    interface Window {
        ck_ifields?: any;
        setAccount?: (key: string, softwareName: string, softwareVersion: string) => void;
        getTokens?: (onSuccess: () => void, onError: (err: any) => void, data?: any) => void;
    }
}

export default function AddPaymentMethodDialog({ isOpen, onClose, onSuccess, personId, shulId }: AddPaymentMethodDialogProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false); // Helper to track script load
    const [ifieldsKey, setIfieldsKey] = useState<string | null>(null);

    // Form State
    const [cardHolder, setCardHolder] = useState("");
    const [expMonth, setExpMonth] = useState("");
    const [expYear, setExpYear] = useState("");

    // Initialize iFields when key is available and script is loaded
    useEffect(() => {
        if (isOpen && isScriptLoaded && ifieldsKey) {
            // Small delay to ensure DOM elements exist
            setTimeout(() => {
                if (window.setAccount) {
                    console.log("Initializing Cardknox iFields with key:", ifieldsKey.substring(0, 5) + "...");
                    window.setAccount(ifieldsKey, "ShulGenius", "2.0.0");
                }
            }, 500);
        }
    }, [isOpen, isScriptLoaded, ifieldsKey]);

    // Fetch Config
    useEffect(() => {
        async function fetchConfig() {
            if (!isOpen) return;
            try {
                setLoading(true);
                setError(null);

                const { data, error } = await supabase.functions.invoke('cardknox-config', {
                    body: { shul_id: shulId }
                });

                if (error) throw error;
                if (!data.ifields_key) throw new Error("Payment processor not configured for this shul.");

                setIfieldsKey(data.ifields_key);
            } catch (err: any) {
                console.error("Config Error:", err);
                setError("Failed to load payment configuration: " + (err.message || "Unknown error"));
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, [isOpen, shulId, supabase]);

    const handleSubmit = async () => {
        if (!cardHolder || !expMonth || !expYear) {
            setError("Please fill in all fields.");
            return;
        }

        setSubmitting(true);
        setError(null);

        // 1. Get Token from Cardknox
        if (!window.getTokens) {
            setError("Payment system not initialized. Please refresh.");
            setSubmitting(false);
            return;
        }

        window.getTokens(
            async () => {
                // Success Callback - fields are now populated with hidden tokens?
                // Actually standard iFields puts tokens in hidden inputs or access via global object.
                // Usually `document.getElementsByName("xCardNum")[0].value`.
                // But simpler usage: create a hidden input with id xCardNum?
                // Let's check Cardknox docs or assume standard behavior:
                // We need to define input fields with `data-ifields-id`.
                // Upon success, the iframe posts a message back?
                // Wait, `getTokens` expects callbacks.
                // Inside success callback, we grab the token.

                // The Cardknox library updates the hidden fields if they exist?
                // Actually, `getTokens` submits the form if passed? No.

                // Let's follow standard pattern:
                // We need hidden inputs that Cardknox will populate?
                // "The getTokens function will replace the data in the ifields with a token."
                // But we can't read the iframe content.
                // We need to listen to the `message` event usually or use the updated input values if we used inputs?
                // No, `getTokens` takes success/error callbacks.
                // The token is returned in the response? No, it's populated in a hidden field named "xCardNum" if it exists, or one with `data-ifields-token` attribute.

                const tokenInput = document.getElementById('xCardNum') as HTMLInputElement;
                const cvcTokenInput = document.getElementById('xCVV') as HTMLInputElement;

                if (!tokenInput?.value) {
                    setError("Failed to generate payment token.");
                    setSubmitting(false);
                    return;
                }

                const xToken = tokenInput.value;
                const xCVVToken = cvcTokenInput?.value;

                // 2. Send to Backend
                try {
                    const { data, error } = await supabase.functions.invoke('cardknox-method', {
                        body: {
                            shul_id: shulId,
                            person_id: personId,
                            xToken,
                            xCVV: xCVVToken,
                            xName: cardHolder,
                            xExp: `${expMonth}${expYear.slice(-2)}`
                        }
                    });

                    if (error) throw error;

                    onSuccess();
                    onClose();
                } catch (err: any) {
                    console.error("Save Error:", err);
                    setError("Failed to save card: " + (err.message || "Unknown error"));
                } finally {
                    setSubmitting(false);
                }
            },
            (err: any) => {
                console.error("Token Error:", err);
                // iFields puts errors in a specific div usually, or passes to callback
                // Cardknox error structure might vary.
                // err might be the error message itself
                setError("Card Verification Failed: " + JSON.stringify(err));
                setSubmitting(false);
            }
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Script
                        src="https://cdn.cardknox.com/ifields/2.15.2401.3101/ifields.min.js"
                        onLoad={() => setIsScriptLoaded(true)}
                    />

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
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col">
                            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-stone-700" />
                                    Add New Card
                                </h2>
                                <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 break-words">
                                        {error}
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                                        <p className="text-stone-500 text-sm">Initializing Secure Payment...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* iFields Container */}
                                        <form id="payment-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-stone-700 mb-1">Cardholder Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                        value={cardHolder}
                                                        onChange={(e) => setCardHolder(e.target.value)}
                                                        placeholder="Name on Card"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-stone-700 mb-1">Card Number</label>
                                                    <div className="h-11 px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                                        <iframe
                                                            data-ifields-id="card-number"
                                                            data-ifields-placeholder="Card Number"
                                                            src={`https://cdn.cardknox.com/ifields/2.15.2401.3101/ifield.htm`}
                                                            title="Card Number"
                                                            className="w-full h-full border-0"
                                                            style={{ height: '24px' }}
                                                        />
                                                    </div>
                                                    <input type="hidden" id="xCardNum" name="xCardNum" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-stone-700 mb-1">Expiration</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                maxLength={2}
                                                                placeholder="MM"
                                                                className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-center"
                                                                value={expMonth}
                                                                onChange={(e) => setExpMonth(e.target.value)}
                                                            />
                                                            <input
                                                                type="text"
                                                                maxLength={4}
                                                                placeholder="YYYY"
                                                                className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-center"
                                                                value={expYear}
                                                                onChange={(e) => setExpYear(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-stone-700 mb-1">CVV</label>
                                                        <div className="h-11 px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                                            <iframe
                                                                data-ifields-id="cvv"
                                                                data-ifields-placeholder="123"
                                                                src={`https://cdn.cardknox.com/ifields/2.15.2401.3101/ifield.htm`}
                                                                title="CVV"
                                                                className="w-full h-full border-0"
                                                                style={{ height: '24px' }}
                                                            />
                                                        </div>
                                                        <input type="hidden" id="xCVV" name="xCVV" />
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="mt-6 flex items-center justify-center text-xs text-stone-400 gap-1.5">
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>Payments are securely processed by Cardknox</span>
                                            </div>
                                        </form>
                                    </div>
                                )}
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
                                    disabled={submitting || loading}
                                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-lg shadow-stone-900/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? 'Processing...' : 'Save Card'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
