"use client";

import { motion } from "framer-motion";
import { Users, FileText, DollarSign, BarChart3, FileEdit, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
    const supabase = createClient();
    const [stats, setStats] = useState({
        memberCount: 0,
        activeCampaigns: 0,
        totalBalance: 0,
        invoiceCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch member count (from people table)
                const { count: memberCount, error: memberError } = await supabase
                    .from('people')
                    .select('*', { count: 'exact', head: true });

                // Fetch active campaigns
                const { count: campaignCount, error: campaignError } = await supabase
                    .from('campaigns')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Active');

                // Fetch invoices stats
                const { data: invoices, error: invoiceError } = await supabase
                    .from('invoices')
                    .select('balance, status');

                if (memberError) console.error("Error fetching members:", memberError);
                if (campaignError) console.error("Error fetching campaigns:", campaignError);
                if (invoiceError) console.error("Error fetching invoices:", invoiceError);

                const totalBalance = invoices?.reduce((acc, inv) => acc + (Number(inv.balance) || 0), 0) || 0;
                const openInvoices = invoices?.filter(inv => Number(inv.balance) > 0).length || 0;

                setStats({
                    memberCount: memberCount || 0,
                    activeCampaigns: campaignCount || 0,
                    totalBalance,
                    invoiceCount: openInvoices
                });

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        { label: "Total Members", value: stats.memberCount.toString(), subtext: "Click to view all", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Active Campaigns", value: stats.activeCampaigns.toString(), subtext: "Click to view all", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Outstanding Invoices", value: `$${stats.totalBalance.toFixed(2)}`, subtext: stats.totalBalance === 0 ? "All clear" : `${stats.invoiceCount} invoices`, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Reports & Analytics", value: "View", subtext: "Click to see insights", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    const quickActions = [
        {
            icon: Users,
            title: "Manage Members",
            description: "View, edit, and add member profiles",
            href: "/members",
            color: "bg-blue-50",
            iconColor: "text-blue-600"
        },
        {
            icon: FileText,
            title: "Create Invoice",
            description: "Bill members and track payments",
            href: "/invoices",
            color: "bg-emerald-50",
            iconColor: "text-emerald-600"
        },
        {
            icon: DollarSign,
            title: "Manage Campaigns",
            description: "Memberships and fund-raising",
            href: "/campaigns",
            color: "bg-amber-50",
            iconColor: "text-amber-600"
        },
        {
            icon: BarChart3,
            title: "View Reports",
            description: "Analytics and data exports",
            href: "/reports",
            color: "bg-purple-50",
            iconColor: "text-purple-600"
        },
        {
            icon: FileEdit,
            title: "Form Builder",
            description: "Create custom forms",
            href: "/forms",
            color: "bg-pink-50",
            iconColor: "text-pink-600"
        },
        {
            icon: MapPin,
            title: "Seating Charts",
            description: "Manage seat assignments",
            href: "/seating",
            color: "bg-indigo-50",
            iconColor: "text-indigo-600"
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header / Welcome */}
            <div>
                <h1 className="text-3xl font-bold font-serif text-stone-900 mb-2">Welcome back!</h1>
                <p className="text-stone-600">Here's what's happening with your Shul today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-stone-600 mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-stone-900 mb-1">
                            {loading ? "..." : stat.value}
                        </h3>
                        <p className="text-xs text-blue-600 font-medium">{stat.subtext}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold font-serif text-stone-900 mb-1">Quick Actions</h2>
                    <p className="text-sm text-stone-500">Get started with common tasks</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (i * 0.05) }}
                        >
                            <Link
                                href={action.href}
                                className="bg-white rounded-xl p-5 border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all group block"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                                        <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 mb-1 text-base">{action.title}</h3>
                                        <p className="text-sm text-stone-500">{action.description}</p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
