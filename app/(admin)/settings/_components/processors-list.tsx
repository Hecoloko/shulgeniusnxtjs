"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Check, AlertCircle, CreditCard, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AddProcessorDialog from "./add-processor-dialog";

// Default shul ID for development/fallback
const DEFAULT_SHUL_ID = "4248b82a-f29d-4ff2-9f8c-631cb37cd0d5";

export default function ProcessorsList() {
    const supabase = createClient();
    const [processors, setProcessors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [shulId, setShulId] = useState<string | null>(DEFAULT_SHUL_ID);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Get Shul ID if not set (though we have default now)
            if (!shulId || shulId === DEFAULT_SHUL_ID) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: role } = await supabase
                        .from('user_roles')
                        .select('shul_id')
                        .eq('user_id', user.id)
                        .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

                    if (role) setShulId(role.shul_id);
                }
            }

            // 2. Get Processors
            const { data, error } = await supabase
                .from('payment_processors')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setProcessors(data || []);

        } catch (err: any) {
            console.error("Error fetching processors:", err);
            setError("Failed to load processors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSetDefault = async (id: string) => {
        if (!shulId) return;

        try {
            // Optimistic update
            setProcessors(current => current.map(p => ({
                ...p,
                is_default: p.id === id
            })));

            // 1. Unset current default (if any)
            await supabase
                .from('payment_processors')
                .update({ is_default: false })
                .eq('shul_id', shulId)
                .eq('is_default', true);

            // 2. Set new default
            const { error } = await supabase
                .from('payment_processors')
                .update({ is_default: true })
                .eq('id', id);

            if (error) throw error;

        } catch (err: any) {
            console.error("Error setting default:", err);
            fetchData(); // Revert on error
            alert("Failed to set default processor");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will disable payments for this processor.")) return;

        try {
            const { error } = await supabase
                .from('payment_processors')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProcessors(current => current.filter(p => p.id !== id));
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Failed to delete processor. It may have related transaction data.");
        }
    };

    if (loading) return <div className="p-8 text-center text-stone-500">Loading processors...</div>;

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-stone-700" />
                        Payment Processors
                    </h2>
                    <p className="text-sm text-stone-500">Manage your connected payment gateways</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Processor
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Account Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Default</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-stone-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {processors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-stone-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <p className="font-medium text-stone-900">No processors connected</p>
                                        <p className="text-sm">Connect your Cardknox account to start accepting payments</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processors.map((proc) => (
                                <tr key={proc.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-stone-900 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-stone-400" />
                                        {proc.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-stone-600 capitalize">
                                        {proc.type}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${proc.is_active
                                            ? 'bg-green-50 text-green-700 border border-green-100'
                                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${proc.is_active ? 'bg-green-500' : 'bg-stone-400'}`} />
                                            {proc.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {proc.is_default ? (
                                            <span className="text-blue-600 text-xs font-bold flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full w-fit border border-blue-100">
                                                <Check className="w-3 h-3" /> Default
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(proc.id)}
                                                className="text-xs text-stone-400 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                Set as Default
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(proc.id)}
                                            className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                            title="Remove processor"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {shulId && (
                <AddProcessorDialog
                    isOpen={isAdding}
                    onClose={() => setIsAdding(false)}
                    onCreated={fetchData}
                    shulId={shulId}
                />
            )}
        </div>
    );
}
