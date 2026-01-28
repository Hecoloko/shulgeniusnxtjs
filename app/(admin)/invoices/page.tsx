"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, DollarSign, Search, Columns3, Download, ArrowUpDown, ArrowUp, ArrowDown, X, MoreVertical, CheckCircle, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { useInvoices, Invoice } from "@/hooks";
import { CreateInvoiceDialog } from "@/components/finance/CreateInvoiceDialog";
import ProcessPaymentDialog from "./_components/process-payment-dialog";
import InvoiceDetailDialog from "./_components/InvoiceDetailDialog";

// Default shul ID - in production this would come from context/auth
const DEFAULT_SHUL_ID = "4248b82a-f29d-4ff2-9f8c-631cb37cd0d5";

const tabs = ["INVOICES", "DONATIONS", "SUBSCRIPTIONS", "LINE ITEMS"];

const allColumns = [
    { key: "invoice_number", label: "Invoice #", enabled: true },
    { key: "customer_name", label: "Name", enabled: true },
    { key: "customer_email", label: "Email", enabled: true },
    { key: "total", label: "Total", enabled: true },
    { key: "balance", label: "Balance", enabled: true },
    { key: "status", label: "Status", enabled: true },
    { key: "created_at", label: "Date", enabled: true },
    { key: "actions", label: "Actions", enabled: true },
];

export default function InvoicesPage() {
    const [activeTab, setActiveTab] = useState("INVOICES");
    const [searchQuery, setSearchQuery] = useState("");
    const [showColumnPicker, setShowColumnPicker] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState<any>(null); // Invoice to pay
    const [viewInvoice, setViewInvoice] = useState<any>(null); // Invoice to view details
    const [columns, setColumns] = useState(allColumns);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Use TanStack Query hook
    const { data: invoicesData, isLoading, refetch } = useInvoices(DEFAULT_SHUL_ID, {
        sortBy: sortConfig?.key || 'created_at',
        sortOrder: sortConfig?.direction || 'desc',
    });

    const invoices = invoicesData?.data ?? [];

    // Calculate stats
    const stats = useMemo(() => {
        return invoices.reduce((acc, inv) => ({
            totalPledged: acc.totalPledged + (Number(inv.total) || 0),
            totalBalance: acc.totalBalance + (Number(inv.balance) || 0),
            totalPaid: acc.totalPaid + ((Number(inv.total) || 0) - (Number(inv.balance) || 0))
        }), { totalPledged: 0, totalPaid: 0, totalBalance: 0 });
    }, [invoices]);

    const handleInvoiceCreated = () => {
        refetch();
        setShowCreateModal(false);
    };

    const handlePaymentSuccess = () => {
        refetch();
        setPaymentInvoice(null);
    };

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        if (!searchQuery) return invoices;
        const query = searchQuery.toLowerCase();
        return invoices.filter(inv =>
            inv.invoice_number?.toLowerCase().includes(query) ||
            inv.customer_name?.toLowerCase().includes(query) ||
            inv.customer_email?.toLowerCase().includes(query)
        );
    }, [invoices, searchQuery]);

    const toggleColumn = (key: string) => {
        setColumns(columns.map(col =>
            col.key === key ? { ...col, enabled: !col.enabled } : col
        ));
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="w-3 h-3 text-stone-400" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 text-blue-600" />
            : <ArrowDown className="w-3 h-3 text-blue-600" />;
    };

    const visibleColumns = columns.filter(col => col.enabled);

    const getStatusStyles = (status: string | null) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'text-green-600';
            case 'sent':
            case 'partial':
                return 'text-amber-600';
            case 'overdue':
                return 'text-red-600';
            default:
                return 'text-stone-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-stone-900">Invoices & Donations</h1>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2.5 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm">
                        <FileText className="w-4 h-4" />
                        Enter Aliyahs
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2.5 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm">
                        <DollarSign className="w-4 h-4" />
                        Record Payment
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Invoice
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-stone-200">
                <div className="flex gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-1 text-sm font-semibold transition-colors relative ${activeTab === tab
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm"
                >
                    <p className="text-sm font-medium text-stone-600 mb-1">Total Pledged</p>
                    <h3 className="text-3xl font-bold text-stone-900">${stats.totalPledged.toFixed(2)}</h3>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm"
                >
                    <p className="text-sm font-medium text-stone-600 mb-1">Total Paid</p>
                    <h3 className="text-3xl font-bold text-stone-900">${stats.totalPaid.toFixed(2)}</h3>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm"
                >
                    <p className="text-sm font-medium text-stone-600 mb-1">Balance Due</p>
                    <h3 className="text-3xl font-bold text-stone-900">${stats.totalBalance.toFixed(2)}</h3>
                </motion.div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                />
            </div>

            {/* Table Controls */}
            <div className="flex justify-end gap-3">
                <div className="relative">
                    <button
                        onClick={() => setShowColumnPicker(!showColumnPicker)}
                        className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Columns3 className="w-4 h-4" />
                        COLUMNS
                    </button>

                    <AnimatePresence>
                        {showColumnPicker && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-stone-200 shadow-xl z-50"
                            >
                                <div className="p-3 border-b border-stone-100 flex items-center justify-between">
                                    <span className="font-semibold text-stone-900 text-sm">Customize Columns</span>
                                    <button
                                        onClick={() => setShowColumnPicker(false)}
                                        className="text-stone-400 hover:text-stone-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-2 max-h-80 overflow-y-auto">
                                    {columns.map((col) => (
                                        <label
                                            key={col.key}
                                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-stone-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={col.enabled}
                                                onChange={() => toggleColumn(col.key)}
                                                className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-stone-700">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm">
                    <Download className="w-4 h-4" />
                    EXPORT
                </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="px-4 py-3 w-12">
                                    <input type="checkbox" className="w-4 h-4 rounded border-stone-300" />
                                </th>
                                {visibleColumns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                                        className={`px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider ${col.key !== 'actions' ? 'cursor-pointer hover:bg-stone-100 transition-colors select-none' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.key !== 'actions' && getSortIcon(col.key)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="px-4 py-12 text-center text-stone-500">Loading invoices...</td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-stone-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-stone-900 mb-1">No invoices found</h3>
                                                <p className="text-sm text-stone-500">Try adjusting your search or create a new invoice</p>
                                            </div>
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-medium text-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create Invoice
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input type="checkbox" className="w-4 h-4 rounded border-stone-300" />
                                        </td>
                                        {visibleColumns.map((col) => (
                                            <td key={col.key} className="px-4 py-3 text-sm">
                                                {col.key === 'invoice_number' ? (
                                                    <span className="text-blue-600 font-medium">{invoice.invoice_number}</span>
                                                ) : col.key === 'balance' ? (
                                                    <span className={`font-semibold ${Number(invoice.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        ${Number(invoice.balance || 0).toFixed(2)}
                                                    </span>
                                                ) : col.key === 'total' ? (
                                                    <span className="text-stone-900">${Number(invoice.total || 0).toFixed(2)}</span>
                                                ) : col.key === 'status' ? (
                                                    <span className={`flex items-center gap-1 ${getStatusStyles(invoice.status)}`}>
                                                        {invoice.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                                                        {invoice.status || 'Draft'}
                                                    </span>
                                                ) : col.key === 'created_at' ? (
                                                    <span className="text-stone-600">
                                                        {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '-'}
                                                    </span>
                                                ) : col.key === 'actions' ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => setViewInvoice(invoice)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {Number(invoice.balance) > 0 && (
                                                            <button
                                                                onClick={() => setPaymentInvoice(invoice)}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                                                                title="Process Payment"
                                                            >
                                                                <DollarSign className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button className="text-stone-400 hover:text-stone-600 p-1.5 hover:bg-stone-50 rounded-lg">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-600">{(invoice as Record<string, unknown>)[col.key] as string || '-'}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateInvoiceDialog
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                shulId={DEFAULT_SHUL_ID}
                onInvoiceCreated={handleInvoiceCreated}
            />

            <ProcessPaymentDialog
                isOpen={!!paymentInvoice}
                onClose={() => setPaymentInvoice(null)}
                onSuccess={handlePaymentSuccess}
                invoice={paymentInvoice}
                shulId={DEFAULT_SHUL_ID}
            />

            <InvoiceDetailDialog
                isOpen={!!viewInvoice}
                onClose={() => setViewInvoice(null)}
                invoice={viewInvoice}
                shulId={DEFAULT_SHUL_ID}
                onUpdated={() => {
                    refetch();
                    setViewInvoice(null);
                }}
            />
        </div>
    );
}
