"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, DollarSign, Check, Loader2, Plus, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Invoice } from "@/hooks";
import AddPaymentMethodDialog from "../../members/[id]/_components/add-payment-method-dialog";

interface ProcessPaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoice: Invoice | null;
    shulId: string;
}

export default function ProcessPaymentDialog({ isOpen, onClose, onSuccess, invoice, shulId }: ProcessPaymentDialogProps) {
    const supabase = createClient();
    const [methods, setMethods] = useState<any[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [showAddCard, setShowAddCard] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && invoice) {
            setAmount(Number(invoice.balance || 0));
            fetchMethods();
        }
    }, [isOpen, invoice]);

    const fetchMethods = async () => {
        if (!invoice?.customer_id) return;
        try {
            setLoadingMethods(true);
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('person_id', invoice.customer_id)
                .eq('is_active', true)
                .order('is_default', { ascending: false });

            if (error) throw error;
            setMethods(data || []);

            // Auto-select default
            const defaultMethod = data?.find((m: any) => m.is_default);
            if (defaultMethod) setSelectedMethodId(defaultMethod.id);
            else if (data && data.length > 0) setSelectedMethodId(data[0].id);

        } catch (err) {
            console.error("Error fetching methods:", err);
        } finally {
            setLoadingMethods(false);
        }
    };

    const handleProcess = async () => {
        if (!selectedMethodId) return setError("Please select a payment method");
        if (amount <= 0) return setError("Amount must be greater than 0");
        if (!invoice) return;

        setProcessing(true);
        setError(null);

        try {
            const { data, error } = await supabase.functions.invoke('cardknox-charge', {
                body: {
                    shul_id: shulId, // Should rely on user context or passed prop
                    amount: amount,
                    invoice_id: invoice.id,
                    method_id: selectedMethodId
                }
            });

            if (error) throw error;
            // Check if function returned an error in the body
            // My edge function usually throws or returns error in json
            if (data?.error) throw new Error(data.error);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Charge Error:", err);
            setError("Payment Failed: " + (err.message || "Unknown error"));
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen || !invoice) return null;

    return (
        <AnimatePresence>
            {/* Nested Add Card Dialog */}
            {showAddCard && (
                <AddPaymentMethodDialog
                    isOpen={showAddCard}
                    onClose={() => setShowAddCard(false)}
                    onSuccess={() => {
                        setShowAddCard(false);
                        fetchMethods();
                    }}
                    personId={invoice.customer_id!}
                    shulId={shulId}
                />
            )}

            {!showAddCard && (
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
                                <div>
                                    <h2 className="text-xl font-bold font-serif text-stone-900">Process Payment</h2>
                                    <p className="text-sm text-stone-500">Invoice #{invoice.invoice_number}</p>
                                </div>
                                <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 mb-4">
                                        {error}
                                    </div>
                                )}

                                {/* Amount */}
                                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex flex-col items-center">
                                    <label className="text-xs text-stone-500 font-semibold uppercase tracking-wider mb-1">Payment Amount</label>
                                    <div className="relative flex items-center">
                                        <span className="text-2xl font-bold text-stone-400 mr-1">$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                            className="bg-transparent text-3xl font-bold text-stone-900 w-32 text-center outline-none border-b-2 border-stone-300 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <p className="text-xs text-stone-400 mt-2">Balance Due: ${Number(invoice.balance).toFixed(2)}</p>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold text-stone-700">Payment Method</label>
                                        <button
                                            onClick={() => setShowAddCard(true)}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> New Card
                                        </button>
                                    </div>

                                    {loadingMethods ? (
                                        <div className="text-center py-4 text-stone-400">Loading methods...</div>
                                    ) : methods.length === 0 ? (
                                        <div
                                            onClick={() => setShowAddCard(true)}
                                            className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100">
                                                <Plus className="w-5 h-5 text-stone-400 group-hover:text-blue-600" />
                                            </div>
                                            <p className="text-sm font-medium text-stone-600 group-hover:text-blue-700">Add Payment Method</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {methods.map(method => (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setSelectedMethodId(method.id)}
                                                    className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${selectedMethodId === method.id
                                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/20'
                                                            : 'bg-white border-stone-200 hover:border-stone-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded border border-stone-100">
                                                            <CreditCard className="w-5 h-5 text-stone-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-stone-900 text-sm">•••• {method.last4}</p>
                                                            <p className="text-xs text-stone-500 uppercase">{method.brand} · Exp {method.exp_month}/{method.exp_year}</p>
                                                        </div>
                                                    </div>
                                                    {selectedMethodId === method.id && (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
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
                                    onClick={handleProcess}
                                    disabled={processing || !selectedMethodId || amount <= 0}
                                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-lg shadow-stone-900/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign className="w-4 h-4" />
                                            Process Payment
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
