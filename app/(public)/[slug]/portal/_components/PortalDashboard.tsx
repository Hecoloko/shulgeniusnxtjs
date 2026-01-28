"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    FileText,
    CreditCard,
    DollarSign,
    User,
    LogOut,
    Wallet,
    Settings,
    ChevronRight,
    Download,
    ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface PortalDashboardProps {
    shulId: string;
    slug: string;
}

export default function PortalDashboard({ shulId, slug }: PortalDashboardProps) {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [member, setMember] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("invoices");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get User
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push(`/s/${slug}/login`);
                    return;
                }

                const userEmail = session.user.email;
                if (!userEmail) {
                    // Should theoretically not happen if logged in via magic link
                    console.error("User email missing");
                    setLoading(false);
                    return;
                }

                // 2. Get Person/Member Record using email
                // We use the email to link Auth User -> Person
                const { data: person, error: personError } = await supabase
                    .from("people")
                    .select("*")
                    .eq("shul_id", shulId)
                    .eq("email", userEmail)
                    .single();

                if (personError || !person) {
                    console.error("Member not found", personError);
                    setLoading(false);
                    return;
                }

                setMember(person);

                // 3. Fetch Invoices
                const { data: invoicesData } = await supabase
                    .from("invoices")
                    .select("*, invoice_items(*)")
                    .eq("customer_id", person.id)
                    .eq("shul_id", shulId)
                    .order("created_at", { ascending: false });

                setInvoices(invoicesData || []);

                // 4. Fetch Payments
                const { data: paymentsData } = await supabase
                    .from("payments")
                    .select("*")
                    .eq("person_id", person.id)
                    .eq("shul_id", shulId)
                    .order("payment_date", { ascending: false });

                setPayments(paymentsData || []);

            } catch (error) {
                console.error("Error loading portal data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [shulId, slug, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push(`/s/${slug}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
            </div>
        );
    }

    if (!member) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Membership Not Found</h3>
                <p className="text-stone-600 mb-6 max-w-md mx-auto">
                    We couldn't find a member profile linked to your email address.
                    Please contact the office to ensure your email is updated in our system.
                </p>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    const tabs = [
        { id: "invoices", label: "Invoices", icon: FileText },
        { id: "payments", label: "Payments", icon: CreditCard },
        { id: "profile", label: "Profile", icon: User },
    ];

    return (
        <div className="space-y-6">
            {/* Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <p className="text-stone-400 text-sm font-medium mb-1">Current Balance</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                            ${Math.abs(member.balance || 0).toFixed(2)}
                        </span>
                        {(member.balance || 0) < 0 && (
                            <span className="text-emerald-400 text-sm font-medium">Credit</span>
                        )}
                    </div>

                    {(member.balance || 0) > 0 && (
                        <button className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-lg transition-colors text-sm">
                            Pay Balance
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
                    <p className="text-stone-500 text-sm font-medium mb-1">Open Invoices</p>
                    <p className="text-3xl font-bold text-stone-900">
                        {invoices.filter(i => i.status !== 'paid' && i.status !== 'void').length}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
                    <p className="text-stone-500 text-sm font-medium mb-1">Last Payment</p>
                    <p className="text-3xl font-bold text-stone-900">
                        {payments.length > 0 ? `$${payments[0].amount.toFixed(2)}` : "—"}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                        {payments.length > 0 ? format(new Date(payments[0].payment_date), 'MMM d, yyyy') : "No payments yet"}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 min-h-[500px] flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200 p-4">
                    <div className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                                    ? "bg-white text-amber-700 shadow-sm ring-1 ring-stone-200"
                                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-amber-600" : "text-stone-400"}`} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <ChevronRight className="w-4 h-4 ml-auto text-amber-500 opacity-50" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-stone-200">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'invoices' && (
                            <motion.div
                                key="invoices"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-stone-900">Your Invoices</h2>
                                </div>

                                {invoices.length === 0 ? (
                                    <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                                        <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                                        <p className="text-stone-500 font-medium">No invoices found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {invoices.map((invoice) => (
                                            <div key={invoice.id} className="group bg-white border border-stone-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-md transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-2 rounded-lg ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-stone-900">#{invoice.invoice_number}</span>
                                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                    invoice.status === 'void' ? 'bg-stone-100 text-stone-500' :
                                                                        'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                    {invoice.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-stone-500 mt-1">
                                                                {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 sm:ml-auto">
                                                        <div className="text-right">
                                                            <p className="font-bold text-stone-900">${invoice.total_amount.toFixed(2)}</p>
                                                            {invoice.balance > 0 && (
                                                                <p className="text-xs text-red-600 font-medium">Due: ${invoice.balance.toFixed(2)}</p>
                                                            )}
                                                        </div>
                                                        {invoice.balance > 0 && invoice.status !== 'void' && (
                                                            <button className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors">
                                                                Pay
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'payments' && (
                            <motion.div
                                key="payments"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-stone-900 mb-6">Payment History</h2>

                                <div className="overflow-hidden rounded-xl border border-stone-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Method</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {payments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-stone-50/50">
                                                    <td className="px-4 py-3 text-stone-900">
                                                        {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                                    </td>
                                                    <td className="px-4 py-3 text-stone-600 capitalize">
                                                        {payment.method}
                                                    </td>
                                                    <td className="px-4 py-3 text-stone-900 font-medium text-right">
                                                        ${payment.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                            Completed
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {payments.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                                                        No payments found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-stone-900 mb-6">Member Profile</h2>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                                        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Personal Information</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                            <div>
                                                <p className="text-xs text-stone-400 uppercase">First Name</p>
                                                <p className="text-stone-900 font-medium">{member.first_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-400 uppercase">Last Name</p>
                                                <p className="text-stone-900 font-medium">{member.last_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-400 uppercase">Email</p>
                                                <p className="text-stone-900 font-medium">{member.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-stone-400 uppercase">Phone</p>
                                                <p className="text-stone-900 font-medium">{member.mobile || member.phone || "—"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                                        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Address</h3>
                                        <div className="space-y-1">
                                            <p className="text-stone-900">{member.address || "No address on file"}</p>
                                            {member.city && (
                                                <p className="text-stone-900">
                                                    {member.city}, {member.state} {member.zip}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
