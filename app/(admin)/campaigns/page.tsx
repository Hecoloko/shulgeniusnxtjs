"use client";

import { motion } from "framer-motion";
import { Plus, DollarSign, Target, Settings2, Edit, Link as LinkIcon, Trash2, Copy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Campaign } from "@/types/supabase";
import { CreateCampaignDialog } from "@/components/finance/CreateCampaignDialog";
import { toast } from "sonner";

export default function CampaignsPage() {
    const supabase = createClient();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState({
        activeCount: 0,
        drives: 0,
        buckets: 0,
        totalGoal: 0,
        totalRaised: 0
    });
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

    const fetchCampaigns = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .is('archived_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const fetchedCampaigns = data || [];
            setCampaigns(fetchedCampaigns);

            // Calculate stats - use status field to determine active campaigns
            const active = fetchedCampaigns.filter(c => c.status === 'active');
            setStats({
                activeCount: active.length,
                drives: active.length, // All are considered drives for now
                buckets: 0,
                totalGoal: active.reduce((acc, c) => acc + (Number(c.goal) || 0), 0),
                totalRaised: active.reduce((acc, c) => acc + (Number(c.raised) || 0), 0)
            });

        } catch (err) {
            console.error("Error fetching campaigns:", err);
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleCreate = () => {
        setEditingCampaign(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the drive "${name}"?`)) return;

        try {
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Drive deleted successfully");
            fetchCampaigns();
        } catch (err) {
            console.error("Error deleting campaign:", err);
            toast.error("Failed to delete drive");
        }
    };

    const handleCopyLink = (id: string) => {
        // Placeholder for public link
        const link = `${window.location.origin}/donate/${id}`;
        navigator.clipboard.writeText(link);
        toast.success("Donation link copied to clipboard");
    };

    const isActive = (campaign: Campaign) => campaign.status === 'active';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-stone-900 mb-1">Drives & Funds</h1>
                    <p className="text-stone-600">Manage fundraising buckets and drives</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Drive / Fund
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-stone-600 mb-1">Active Drives/Funds</p>
                    <h3 className="text-3xl font-bold text-stone-900 mb-2">{stats.activeCount}</h3>
                    <p className="text-xs text-stone-500">{campaigns.length} Total Campaigns</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Target className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-stone-600 mb-1">Total Goal Amount</p>
                    <h3 className="text-3xl font-bold text-stone-900 mb-2">${stats.totalGoal.toLocaleString()}</h3>
                    <p className="text-xs text-stone-500">Combined drive goals</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Settings2 className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-stone-600 mb-1">Raised</p>
                    <h3 className="text-3xl font-bold text-stone-900 mb-2">${stats.totalRaised.toLocaleString()}</h3>
                    <p className="text-xs text-stone-500">Total collected so far</p>
                </motion.div>
            </div>

            {/* Table Section */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold font-serif text-stone-900 mb-1">All Drives & Funds</h2>
                    <p className="text-sm text-stone-500">View and manage your buckets and drives</p>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Goal</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Raised</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Start Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">End Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-stone-500">Loading campaigns...</td>
                                    </tr>
                                ) : campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                                                    <Target className="w-8 h-8 text-stone-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-stone-900 mb-1">No drives or funds yet</h3>
                                                    <p className="text-sm text-stone-500">Create your first fundraising campaign</p>
                                                </div>
                                                <button
                                                    onClick={handleCreate}
                                                    className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-medium text-sm"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Create Drive / Fund
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <span className="font-medium text-stone-900">{campaign.name}</span>
                                                    {campaign.description && (
                                                        <p className="text-xs text-stone-500 mt-0.5 truncate max-w-xs">{campaign.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-600">
                                                {campaign.goal ? `$${Number(campaign.goal).toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-green-600">
                                                ${Number(campaign.raised || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-600">
                                                {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-600">
                                                {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${isActive(campaign) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {campaign.status || 'draft'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(campaign)}
                                                        className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyLink(campaign.id)}
                                                        className="p-1.5 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Copy Link"
                                                    >
                                                        <LinkIcon className="w-4 h-4" />
                                                    </button>
                                                    {/* Settings - reuse edit for now */}
                                                    <button
                                                        onClick={() => handleEdit(campaign)}
                                                        className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                        title="Settings"
                                                    >
                                                        <Settings2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(campaign.id, campaign.name)}
                                                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CreateCampaignDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onCampaignSaved={fetchCampaigns}
                editingCampaign={editingCampaign}
            />
        </div>
    );
}
