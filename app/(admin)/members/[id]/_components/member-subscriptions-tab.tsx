"use client";

import { useState, useEffect } from "react";
import { Plus, CreditCard, Calendar, Repeat, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import AddSubscriptionDialog from "./add-subscription-dialog";

interface MemberSubscriptionsTabProps {
    personId: string;
    shulId: string;
}

export default function MemberSubscriptionsTab({ personId, shulId }: MemberSubscriptionsTabProps) {
    const supabase = createClient();
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
                    *,
                    campaign:campaigns(name)
                `)
                .eq('person_id', personId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSubscriptions(data || []);
        } catch (err: any) {
            console.error("Error fetching subscriptions:", err);
            setError("Failed to load subscriptions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [personId]);

    const handleCancelSubscription = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this subscription? API integrations will be stopped.")) return;

        try {
            // Check if it's a Stripe subscription to cancel there too?
            // For now, we update local status. 
            // The Edge Function 'mcp-stripe-cancel-subscription' or similar logic might be needed if integrated deeply.
            // But we'll just set status to 'canceled' in DB for now.

            const { error } = await supabase
                .from('subscriptions')
                .update({ status: 'canceled', end_date: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            fetchSubscriptions();
        } catch (err: any) {
            alert("Error canceling subscription: " + err.message);
        }
    };

    if (loading) return (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto" />
            <p className="text-stone-500 mt-2 text-sm">Loading subscriptions...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-stone-400" />
                    Recurring Subscriptions
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Subscription
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {subscriptions.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-stone-100">
                        <Repeat className="w-6 h-6 text-stone-300" />
                    </div>
                    <h4 className="text-stone-900 font-medium mb-1">No active subscriptions</h4>
                    <p className="text-sm text-stone-500 max-w-xs mx-auto">
                        Set up recurring payments or pledges for this member.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {subscriptions.map((sub) => (
                        <div key={sub.id} className="border border-stone-200 rounded-xl p-5 hover:border-stone-300 transition-colors bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-stone-900 text-lg mb-1">{sub.subscription_name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                                        <span className="capitalize">{sub.frequency}</span>
                                        <span>•</span>
                                        <span>{sub.campaign?.name || 'General'}</span>
                                        <span>•</span>
                                        <span className={`capitalize px-2 py-0.5 rounded text-xs font-semibold ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                                sub.status === 'canceled' ? 'bg-stone-100 text-stone-500' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <div className="text-sm">
                                        Starting: {new Date(sub.start_date).toLocaleDateString()}
                                        {sub.next_billing_date && sub.status === 'active' && (
                                            <span className="ml-2 text-stone-400">Next: {new Date(sub.next_billing_date).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-bold text-xl text-stone-900">
                                        ${sub.amount.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-stone-500 mt-1 capitalize">
                                        {sub.billing_type === 'recurring_cc' ? 'Auto Charge' : 'Invoiced'}
                                    </div>
                                </div>
                            </div>

                            {sub.status === 'active' && (
                                <div className="mt-4 pt-4 border-t border-stone-100 flex justify-end">
                                    <button
                                        onClick={() => handleCancelSubscription(sub.id)}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline"
                                    >
                                        Cancel Subscription
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isAdding && (
                <AddSubscriptionDialog
                    isOpen={isAdding}
                    onClose={() => setIsAdding(false)}
                    onCreated={fetchSubscriptions}
                    personId={personId}
                    shulId={shulId}
                />
            )}
        </div>
    );
}
