"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ClipboardCheck, CreditCard, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import AddPaymentMethodDialog from "./add-payment-method-dialog";

interface AddSubscriptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    personId: string;
    shulId: string;
}

const FREQUENCIES = [
    { value: "monthly", label: "Monthly" },
    { value: "monthly_hebrew", label: "Monthly (Hebrew)" },
    { value: "weekly", label: "Weekly" },
    { value: "daily", label: "Daily" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annual", label: "Annual" },
];

const DURATION_OPTIONS = [
    { value: "indefinitely", label: "Indefinitely" },
    { value: "12", label: "12 Months" },
    { value: "6", label: "6 Months" },
    { value: "custom", label: "Custom" },
];

const INSTALLMENT_OPTIONS = [
    { value: "3", label: "3 Payments" },
    { value: "6", label: "6 Payments" },
    { value: "12", label: "12 Payments" },
    { value: "custom", label: "Custom" },
];

const BILLING_TYPE_OPTIONS = [
    { value: "invoiced", label: "Invoiced", description: "Generate invoices for manual payment" },
    { value: "recurring_cc", label: "Auto Charge", description: "Charge saved card automatically" },
];

export default function AddSubscriptionDialog({ isOpen, onClose, onCreated, personId, shulId }: AddSubscriptionDialogProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Data Loading State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Form State
    const [selectedCampaign, setSelectedCampaign] = useState("");
    const [campaignProcessorId, setCampaignProcessorId] = useState<string | null>(null);
    const [subscriptionName, setSubscriptionName] = useState("");
    const [amount, setAmount] = useState("");
    const [subscriptionType, setSubscriptionType] = useState("recurring"); // recurring | installments
    const [billingType, setBillingType] = useState("invoiced"); // invoiced | recurring_cc
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

    // Recurring options
    const [frequency, setFrequency] = useState("monthly");
    const [duration, setDuration] = useState("indefinitely");
    const [customDuration, setCustomDuration] = useState("12");

    // Installment options
    const [installmentCount, setInstallmentCount] = useState("3");
    const [customInstallments, setCustomInstallments] = useState("6");
    const [installmentFrequency, setInstallmentFrequency] = useState("monthly");

    const [startDate, setStartDate] = useState("");

    // Nested Dialog State
    const [isAddingCard, setIsAddingCard] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            loadInitialData();
        }
    }, [isOpen]);

    const loadInitialData = async () => {
        setIsLoadingData(true);
        await Promise.all([fetchCampaigns(), fetchPaymentMethods()]);
        setIsLoadingData(false);
    };

    const fetchCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
                    id, 
                    name, 
                    campaign_type,
                    campaign_processors(
                        processor_account_id,
                        is_primary
                    )
                `)
                .eq('shul_id', shulId) // Validate shul ownership
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
        }
    };

    const fetchPaymentMethods = async (processorFilter?: string | null) => {
        try {
            let query = supabase
                .from('payment_methods') // Use unified view/table if possible, logic adapted
                .select('*')
                .eq('person_id', personId);

            // Note: In new schema, 'payment_methods' might not have 'processor_account_id' directly unless joined. 
            // Assuming simplified schema from current codebase context: payment_methods usually stores token.
            // If strict processor filtering is needed, we need to know which processor the method belongs to.
            // For now, fetching all and filtering in memory if needed, or assuming methods are universal if using a gateway that supports multiple? 
            // Actually, Cardknox/Stripe methods are distinct.

            const { data, error } = await query.order('is_default', { ascending: false });

            if (error) throw error;
            setPaymentMethods(data || []);

            // Auto-select Default
            const defaultMethod = (data || []).find((m: any) => m.is_default);
            if (defaultMethod) setSelectedPaymentMethod(defaultMethod.id);

        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };

    const calculateNextBilling = (start: string, freq: string) => {
        const date = new Date(start);
        switch (freq) {
            case 'daily': date.setDate(date.getDate() + 1); break;
            case 'weekly': date.setDate(date.getDate() + 7); break;
            case 'monthly':
            case 'monthly_hebrew': date.setMonth(date.getMonth() + 1); break;
            case 'quarterly': date.setMonth(date.getMonth() + 3); break;
            case 'annual': date.setFullYear(date.getFullYear() + 1); break;
        }
        return date.toISOString().split('T')[0];
    };

    const calculateEndDate = (start: string, freq: string, durationMonths: number | null) => {
        if (durationMonths === null) return null;
        const date = new Date(start);
        date.setMonth(date.getMonth() + durationMonths);
        return date.toISOString().split('T')[0];
    };

    const handleSubmit = async () => {
        if (!selectedCampaign || !subscriptionName || !amount || parseFloat(amount) <= 0) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (billingType === 'recurring_cc' && !selectedPaymentMethod) {
            toast.error("Please select a payment method for automatic billing");
            return;
        }

        try {
            setLoading(true);

            const actualFrequency = subscriptionType === 'installments' ? installmentFrequency : frequency;
            const durationMonths = subscriptionType === 'recurring'
                ? (duration === 'indefinitely' ? null : (duration === 'custom' ? parseInt(customDuration) : parseInt(duration)))
                : null;
            const numInstallments = subscriptionType === 'installments'
                ? (installmentCount === 'custom' ? parseInt(customInstallments) : parseInt(installmentCount))
                : null;

            // Prepare Payload
            const payload = {
                shul_id: shulId,
                person_id: personId,
                campaign_id: selectedCampaign,
                subscription_name: subscriptionName,
                amount: parseFloat(amount),
                frequency: actualFrequency,
                start_date: startDate,
                next_billing_date: calculateNextBilling(startDate, actualFrequency),
                end_date: durationMonths ? calculateEndDate(startDate, actualFrequency, durationMonths) : null,
                number_of_installments: numInstallments,
                installments_paid: 0,
                total_amount: numInstallments ? parseFloat(amount) : null,
                type: subscriptionType,
                billing_type: billingType,
                payment_method_id: billingType === 'recurring_cc' ? selectedPaymentMethod : null,
                status: 'active',
                metadata: {
                    subscription_type: subscriptionType,
                    duration: duration,
                    custom_duration: customDuration,
                }
            };

            const { data: newSub, error } = await supabase
                .from('subscriptions')
                .insert(payload)
                .select('id')
                .single();

            if (error) throw error;

            toast.success("Subscription created successfully!");

            // Optional: Trigger initial billing immediately if start date is today
            if (new Date(startDate) <= new Date()) {
                // Determine which edge function to call - simplified to generic 'process-billing' or similar
                // For now, we'll let the scheduler pick it up unless requested otherwise.
            }

            onCreated();
            onClose();

        } catch (error: any) {
            console.error('Error creating subscription:', error);
            toast.error("Failed to create subscription: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCampaignChange = (val: string) => {
        setSelectedCampaign(val);
        const campaign = campaigns.find(c => c.id === val);
        if (campaign) {
            setSubscriptionName(campaign.name);
            // Future: Logic to filter payment methods by campaign's processor
            // const primaryProcessor = campaign.campaign_processors?.find((cp: any) => cp.is_primary);
            // fetchPaymentMethods(primaryProcessor?.processor_account_id);
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
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">

                            {/* Header */}
                            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-bold font-serif text-stone-900">Add Subscription</h2>
                                    <p className="text-sm text-stone-500">Create a recurring payment or pledge</p>
                                </div>
                                <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                                {/* Campaign */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-stone-700">Campaign *</label>
                                    <select
                                        value={selectedCampaign}
                                        onChange={(e) => handleCampaignChange(e.target.value)}
                                        className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Select a campaign...</option>
                                        {campaigns.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-stone-700">Total Amount *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-mono">$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-lg"
                                        />
                                    </div>
                                </div>

                                {/* Frequency & Type Toggles */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Type</label>
                                        <div className="flex bg-stone-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setSubscriptionType("recurring")}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${subscriptionType === "recurring" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
                                            >
                                                Recurring
                                            </button>
                                            <button
                                                onClick={() => setSubscriptionType("installments")}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${subscriptionType === "installments" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
                                            >
                                                Installments
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-stone-700">Billing</label>
                                        <div className="flex bg-stone-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setBillingType("invoiced")}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${billingType === "invoiced" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
                                            >
                                                Invoiced
                                            </button>
                                            <button
                                                onClick={() => setBillingType("recurring_cc")}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${billingType === "recurring_cc" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
                                            >
                                                Auto Card
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Recurring Options */}
                                {subscriptionType === "recurring" && (
                                    <div className="space-y-4 pt-2 border-t border-stone-100 animate-in fade-in">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-stone-700">Frequency</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {FREQUENCIES.map(f => (
                                                    <button
                                                        key={f.value}
                                                        onClick={() => setFrequency(f.value)}
                                                        className={`py-2 px-1 text-xs border rounded-lg transition-colors ${frequency === f.value ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"}`}
                                                    >
                                                        {f.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-stone-700">Duration</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {DURATION_OPTIONS.map(d => (
                                                    <button
                                                        key={d.value}
                                                        onClick={() => setDuration(d.value)}
                                                        className={`py-2 px-1 text-xs border rounded-lg transition-colors ${duration === d.value ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"}`}
                                                    >
                                                        {d.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Method Selection */}
                                {billingType === 'recurring_cc' && (
                                    <div className="space-y-3 pt-2 border-t border-stone-100 animate-in fade-in">
                                        <label className="text-sm font-semibold text-stone-700">Use Saved Card</label>

                                        {paymentMethods.length > 0 ? (
                                            <select
                                                value={selectedPaymentMethod}
                                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            >
                                                <option value="">Select a card...</option>
                                                {paymentMethods.map((m: any) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.brand?.toUpperCase()} •••• {m.last4} {m.is_default && '(Default)'}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                                <CreditCard className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                                                <p className="text-amber-900 font-medium text-sm mb-2">No active cards found</p>
                                                <button
                                                    onClick={() => setIsAddingCard(true)}
                                                    className="inline-flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add New Card
                                                </button>
                                            </div>
                                        )}

                                        {/* Helper for adding card even if list not empty */}
                                        {paymentMethods.length > 0 && (
                                            <button
                                                onClick={() => setIsAddingCard(true)}
                                                className="text-xs text-stone-500 hover:text-stone-900 underline flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Add different card
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-stone-700">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-2.5 bg-white border border-stone-200 rounded-lg outline-none focus:border-stone-400"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-stone-200 bg-stone-50 flex justify-end gap-3 rounded-b-2xl">
                                <button onClick={onClose} className="px-5 py-2.5 text-stone-600 font-medium hover:bg-stone-200 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || (billingType === 'recurring_cc' && !selectedPaymentMethod)}
                                    className="px-6 py-2.5 bg-stone-900 text-white font-medium rounded-lg shadow hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Subscription
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Nested Dialog for Adding Card */}
                    {isAddingCard && (
                        <AddPaymentMethodDialog
                            isOpen={isAddingCard}
                            onClose={() => setIsAddingCard(false)}
                            onSuccess={() => {
                                setIsAddingCard(false);
                                fetchPaymentMethods(); // Refresh list to show new card
                                toast.success("Card added! You can now select it.");
                            }}
                            personId={personId}
                            shulId={shulId}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
