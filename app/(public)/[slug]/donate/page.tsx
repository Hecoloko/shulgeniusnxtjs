"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, CheckCircle, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Campaign {
    id: string;
    name: string;
    description: string | null;
}

const PRESET_AMOUNTS = [18, 36, 54, 100, 180, 360];

export default function DonatePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;

    const initialCampaignId = searchParams.get("campaignId") || searchParams.get("campaign") || undefined;
    const initialAmount = searchParams.get("amount") || undefined;

    const [shul, setShul] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form state
    const [selectedCampaign, setSelectedCampaign] = useState(initialCampaignId || "");
    const [amount, setAmount] = useState(initialAmount || "");
    const [paymentType, setPaymentType] = useState<"one_time" | "recurring">("one_time");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;

            // Fetch shul
            const { data: shulData } = await supabase
                .from("shuls")
                .select("*")
                .eq("slug", slug.toLowerCase())
                .single();

            if (shulData) {
                setShul(shulData);

                // Fetch campaigns for this shul
                const { data: campaignsData } = await supabase
                    .from("campaigns")
                    .select("id, name, description")
                    .eq("shul_id", shulData.id)
                    .eq("is_active", true)
                    .order("name");

                if (campaignsData) {
                    setCampaigns(campaignsData);
                    if (!selectedCampaign && campaignsData.length > 0) {
                        setSelectedCampaign(campaignsData[0].id);
                    }
                }
            }

            setLoading(false);
        };

        fetchData();
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCampaign || !amount || !firstName || !lastName || !email) {
            alert("Please fill in all required fields");
            return;
        }

        setSubmitting(true);

        try {
            // Call the Edge Function for processing donation
            const { data, error } = await supabase.functions.invoke("process-public-donation", {
                body: {
                    shul_id: shul.id,
                    first_name: firstName,
                    last_name: lastName,
                    email: email.toLowerCase(),
                    phone: phone || null,
                    amount: parseFloat(amount),
                    campaign_id: selectedCampaign,
                    campaign_name: campaigns.find(c => c.id === selectedCampaign)?.name || "General",
                    payment_type: paymentType,
                },
            });

            if (error) throw error;

            // If we get a checkout URL (Stripe), redirect
            if (data?.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }

            // Otherwise, show success
            if (data?.success || data?.intent_id) {
                setSuccess(true);
            } else {
                throw new Error(data?.error || "Payment failed");
            }
        } catch (err: any) {
            console.error("Donation error:", err);
            alert(err.message || "Failed to process donation. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
            </div>
        );
    }

    if (!shul) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-stone-500">Organization not found</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center py-12">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md mx-auto text-center px-6"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">Thank You!</h1>
                    <p className="text-lg text-stone-600 mb-6">
                        Your donation of <span className="font-bold text-green-600">${parseFloat(amount).toFixed(2)}</span> was successful.
                    </p>
                    <p className="text-stone-500 mb-8">
                        A confirmation email has been sent to {email}.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setAmount("");
                                setFirstName("");
                                setLastName("");
                                setEmail("");
                                setPhone("");
                            }}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl transition-all"
                        >
                            Make Another Donation
                        </button>
                        <Link
                            href={`/s/${slug}`}
                            className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-all"
                        >
                            Return Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="py-12">
            <div className="container mx-auto px-4 max-w-lg">
                {/* Back Link */}
                <Link
                    href={`/s/${slug}`}
                    className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {shul.name}
                </Link>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">Make a Donation</h1>
                    <p className="text-stone-600">Support {shul.name} with a tax-deductible contribution</p>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden"
                >
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Campaign Select */}
                        {campaigns.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Donation For (Fund/Campaign)
                                </label>
                                <select
                                    value={selectedCampaign}
                                    onChange={(e) => setSelectedCampaign(e.target.value)}
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                >
                                    {campaigns.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Amount Section */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Amount
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {PRESET_AMOUNTS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setAmount(String(preset))}
                                        className={`py-2.5 px-4 rounded-xl font-bold text-lg transition-all ${amount === String(preset)
                                                ? "bg-amber-500 text-white shadow-md"
                                                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                            }`}
                                    >
                                        ${preset}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-stone-400">$</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Other amount"
                                    className="w-full pl-10 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-xl text-2xl font-bold text-right focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Payment Type */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Donation Type
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentType("one_time")}
                                    className={`py-3 px-4 rounded-xl font-medium transition-all ${paymentType === "one_time"
                                            ? "bg-stone-900 text-white"
                                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                        }`}
                                >
                                    One Time
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentType("recurring")}
                                    className={`py-3 px-4 rounded-xl font-medium transition-all ${paymentType === "recurring"
                                            ? "bg-stone-900 text-white"
                                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                        }`}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>

                        {/* Donor Info */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="First Name *"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name *"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                            </div>
                            <input
                                type="email"
                                placeholder="Email *"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                            />
                            <input
                                type="tel"
                                placeholder="Phone (optional)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                            />
                        </div>

                        {/* Payment Info Note */}
                        <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl text-stone-600 text-sm">
                            <CreditCard className="w-5 h-5 text-stone-400 flex-shrink-0" />
                            <p>You'll be redirected to our secure payment processor to complete your donation.</p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !amount || parseFloat(amount) <= 0}
                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-900 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Heart className="w-5 h-5" />
                                    Donate {amount ? `$${parseFloat(amount).toFixed(2)}` : ""}
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Security Note */}
                <p className="text-center text-xs text-stone-400 mt-6">
                    🔒 Your payment information is securely processed. All donations are tax-deductible.
                </p>
            </div>
        </div>
    );
}
