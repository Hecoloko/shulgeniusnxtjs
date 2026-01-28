"use client";

import { motion } from "framer-motion";

import { User, FileText, CreditCard, ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, Edit, DollarSign, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePerson, useInvoices, useShul, Person } from "@/hooks";
import type { Invoice } from "@/types/supabase";
import PaymentMethodsTab from "./_components/payment-methods-tab";
import InviteMemberDialog from "@/components/members/invite-member-dialog";
import MemberSubscriptionsTab from "./_components/member-subscriptions-tab";

const tabs = ["PROFILE", "INVOICES", "PAYMENTS", "SUBSCRIPTIONS", "PAYMENT METHODS"];

// Default shul ID - in production this would come from context/auth
const DEFAULT_SHUL_ID = "4248b82a-f29d-4ff2-9f8c-631cb37cd0d5";

export default function MemberDetailPage() {
    const params = useParams();
    const router = useRouter();
    const personId = params.id as string;

    const [activeTab, setActiveTab] = useState("PROFILE");
    const [inviteOpen, setInviteOpen] = useState(false);

    const { data: person, isLoading, error } = usePerson(personId);
    const { data: shul } = useShul(person?.shul_id || "");

    if (isLoading) {
        return <div className="p-8 text-center text-stone-500">Loading member details...</div>;
    }

    if (error || !person) {
        return (
            <div className="p-8 text-center">
                <h3 className="text-xl font-bold text-stone-900">Member not found</h3>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Go back
                </button>
            </div>
        );
    }

    // Combine first and last name for display
    const fullName = `${person.first_name} ${person.last_name}`;

    return (
        <div className="space-y-6">
            {/* Header / Back Button */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Members
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-8 h-8 text-stone-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold font-serif text-stone-900">{fullName}</h1>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-stone-500">
                                {person.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        {person.email}
                                    </div>
                                )}
                                {person.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" />
                                        {person.phone}
                                    </div>
                                )}
                                {person.address && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {person.city ? `${person.address}, ${person.city}` : person.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-sm font-medium text-stone-500">Current Balance</p>
                            <p className={`text-2xl font-bold ${(Number(person.balance) || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${(Number(person.balance) || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 font-medium text-sm flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setInviteOpen(true)}
                                className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 font-medium text-sm flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Invite to Portal
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                                New Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-stone-200">
                <div className="flex gap-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-1 text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === tab
                                ? 'text-blue-600'
                                : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === "PROFILE" && <ProfileTab person={person} />}
                {activeTab === "INVOICES" && <InvoicesTab personId={personId} shulId={person.shul_id} />}
                {activeTab === "PAYMENTS" && <PaymentsTab />}
                {activeTab === "SUBSCRIPTIONS" && <MemberSubscriptionsTab personId={personId} shulId={person.shul_id || DEFAULT_SHUL_ID} />}
                {activeTab === "PAYMENT METHODS" && <PaymentMethodsTab personId={personId} shulId={person.shul_id || DEFAULT_SHUL_ID} />}
            </motion.div>

            {/* Invite Dialog */}
            {person && shul && (
                <InviteMemberDialog
                    isOpen={inviteOpen}
                    onClose={() => setInviteOpen(false)}
                    member={person}
                    shulSlug={shul.slug}
                    shulName={shul.name}
                />
            )}
        </div>
    );
}

function ProfileTab({ person }: { person: Person }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-stone-400" />
                    Personal Information
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Gender</div>
                        <div className="text-sm font-medium text-stone-900">{person.gender || '-'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Date of Birth</div>
                        <div className="text-sm font-medium text-stone-900">{person.date_of_birth || '-'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Spouse</div>
                        <div className="text-sm font-medium text-stone-900">
                            {person.spouse_first_name ? `${person.spouse_first_name} ${person.spouse_last_name || ''}` : '-'}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Hebrew Name</div>
                        <div className="text-sm font-medium text-stone-900">{person.hebrew_name || '-'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Kohen/Levi/Yisroel</div>
                        <div className="text-sm font-medium text-stone-900 capitalize">{person.kohen_levi_yisroel || '-'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pb-1">
                        <div className="text-sm text-stone-500">Tags</div>
                        <div className="flex flex-wrap gap-1">
                            {person.tags_raw?.map((tag: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
                                    {tag}
                                </span>
                            )) || <span className="text-sm text-stone-400">-</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm h-fit">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-stone-400" />
                    Contact & Address
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Email</div>
                        <div className="text-sm font-medium text-stone-900 sm:col-span-2 break-all">{person.email || '-'}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Phone</div>
                        <div className="text-sm font-medium text-stone-900 sm:col-span-2">{person.phone || '-'}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Cell</div>
                        <div className="text-sm font-medium text-stone-900 sm:col-span-2">{person.cell || '-'}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-stone-100 pb-3">
                        <div className="text-sm text-stone-500">Address</div>
                        <div className="text-sm font-medium text-stone-900 sm:col-span-2">
                            {person.address || '-'}<br />
                            {person.city && `${person.city}, `}{person.state} {person.zip}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pb-1">
                        <div className="text-sm text-stone-500">Member #</div>
                        <div className="text-sm font-medium text-stone-900 sm:col-span-2">
                            {person.member_number || '-'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InvoicesTab({ personId, shulId }: { personId: string; shulId: string }) {
    const { data, isLoading } = useInvoices(shulId, { customerId: personId });
    const invoices = data?.data ?? [];

    if (isLoading) {
        return <div className="p-8 text-center text-stone-500">Loading invoices...</div>;
    }

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                <h3 className="font-semibold text-stone-900">Invoice History</h3>
                <button className="text-sm text-blue-600 hover:underline font-medium">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Description / Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-stone-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                                    No invoices found for this member.
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-stone-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-stone-900">{inv.invoice_number}</div>
                                        <div className="text-xs text-stone-500">{inv.notes || 'Invoice'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-600">
                                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-stone-900">
                                        ${Number(inv.total || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <span className={Number(inv.balance) > 0 ? 'text-red-600' : 'text-green-600'}>
                                            ${Number(inv.balance || 0).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            View PDF
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PaymentsTab() {
    return (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-900 mb-1">No payment history</h3>
            <p className="text-stone-500 mb-4">Payments recorded for this member will appear here.</p>
        </div>
    );
}


