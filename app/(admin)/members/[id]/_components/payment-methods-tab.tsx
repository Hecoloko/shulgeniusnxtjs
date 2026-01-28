"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CreditCard, Calendar, Star, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import AddPaymentMethodDialog from "./add-payment-method-dialog";

interface PaymentMethodsTabProps {
    personId: string;
    shulId: string;
}

export default function PaymentMethodsTab({ personId, shulId }: PaymentMethodsTabProps) {
    const supabase = createClient();
    const [methods, setMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMethods = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('person_id', personId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMethods(data || []);
        } catch (err: any) {
            console.error("Error fetching methods:", err);
            setError("Failed to load payment methods");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, [personId]);

    const handleDelete = async (id: string, isDefault: boolean) => {
        if (isDefault && methods.length > 1) {
            alert("Please set another method as default before deleting this one.");
            return;
        }
        if (!confirm("Are you sure you want to remove this payment method?")) return;

        try {
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMethods(current => current.filter(m => m.id !== id));
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Failed to delete payment method");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            // Optimistic Update
            setMethods(prev => prev.map(m => ({
                ...m,
                is_default: m.id === id
            })).sort((a, b) => (a.id === id ? -1 : 1))); // Move new default to top

            // 1. Unset all for this person
            await supabase
                .from('payment_methods')
                .update({ is_default: false })
                .eq('person_id', personId);

            // 2. Set new default
            const { error } = await supabase
                .from('payment_methods')
                .update({ is_default: true })
                .eq('id', id);

            if (error) throw error;

        } catch (err: any) {
            console.error("Set default error:", err);
            fetchMethods(); // Revert
            alert("Failed to set default method");
        }
    };

    const getCardIcon = (brand: string) => {
        // Simple loop for now, can be expanded
        return <CreditCard className="w-6 h-6 text-stone-600" />;
    };

    const isExpired = (month: string, year: string) => {
        if (!month || !year) return false;
        const today = new Date();
        const exp = new Date(parseInt("20" + year), parseInt(month), 0); // Last day of month
        return exp < today;
    };

    if (loading) return (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto" />
            <p className="text-stone-500 mt-2 text-sm">Loading payment methods...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-stone-400" />
                    Saved Payment Methods
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add New Card
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {methods.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-stone-100">
                        <CreditCard className="w-6 h-6 text-stone-300" />
                    </div>
                    <h4 className="text-stone-900 font-medium mb-1">No payment methods saved</h4>
                    <p className="text-sm text-stone-500 max-w-xs mx-auto">
                        Add a credit card to easily process donations and payments for this member.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {methods.map((method) => {
                        const expired = isExpired(method.exp_month, method.exp_year);
                        return (
                            <div
                                key={method.id}
                                className={`relative rounded-xl border p-5 transition-all ${method.is_default
                                        ? 'bg-white border-blue-200 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20'
                                        : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-sm'
                                    }`}
                            >
                                {method.is_default && (
                                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg border-b border-l border-blue-100 flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-blue-600" /> Default
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-stone-50 rounded-lg border border-stone-100">
                                        {getCardIcon(method.brand)}
                                    </div>
                                    <div className="flex gap-1">
                                        {!method.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(method.id)}
                                                className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Set as Default"
                                            >
                                                <Star className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(method.id, method.is_default)}
                                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Method"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <div className="font-mono text-lg text-stone-700 tracking-wide">
                                        •••• •••• •••• {method.last4}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className={`flex items-center gap-1 ${expired ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {method.exp_month}/{method.exp_year}
                                        </span>
                                        {expired && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Expired</span>}
                                    </div>
                                </div>

                                <div className="text-xs text-stone-400 uppercase tracking-wider font-medium">
                                    {method.brand || 'Card'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isAdding && (
                <AddPaymentMethodDialog
                    isOpen={isAdding}
                    onClose={() => setIsAdding(false)}
                    onSuccess={() => {
                        fetchMethods();
                    }}
                    personId={personId}
                    shulId={shulId}
                />
            )}
        </div>
    );
}
