"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Download,
    Printer,
    Mail,
    DollarSign,
    Ban,
    FileText,
    Calendar,
    User,
    Hash,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { downloadInvoicePDF, printInvoicePDF, InvoiceForPDF, InvoiceLineItem, ShulBranding } from "@/components/invoices/InvoicePDF";

interface InvoiceDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
    shulId: string;
    onUpdated?: () => void;
}

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number | null;
    unit_price: number;
    amount: number;
}

export default function InvoiceDetailDialog({
    isOpen,
    onClose,
    invoice,
    shulId,
    onUpdated,
}: InvoiceDetailDialogProps) {
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [voidLoading, setVoidLoading] = useState(false);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [shul, setShul] = useState<ShulBranding | null>(null);
    const [activeTab, setActiveTab] = useState<"details" | "items" | "payments">("details");
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (isOpen && invoice) {
            fetchDetails();
        }
    }, [isOpen, invoice]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch line items, payments, and shul details in parallel
            const [itemsRes, paymentsRes, shulRes] = await Promise.all([
                supabase
                    .from("invoice_items")
                    .select("*")
                    .eq("invoice_id", invoice.id)
                    .order("created_at", { ascending: true }),
                supabase
                    .from("payments")
                    .select("*")
                    .eq("invoice_id", invoice.id)
                    .order("payment_date", { ascending: false }),
                supabase
                    .from("shuls")
                    .select("name, address, city, state, zip, phone, email, ein_tax_id")
                    .eq("id", shulId)
                    .single(),
            ]);

            if (itemsRes.error) console.warn("Items fetch error:", itemsRes.error);
            if (paymentsRes.error) console.warn("Payments fetch error:", paymentsRes.error);
            if (shulRes.error) console.warn("Shul fetch error:", shulRes.error);

            setItems(itemsRes.data || []);
            setPayments(paymentsRes.data || []);

            if (shulRes.data) {
                const s = shulRes.data;
                setShul({
                    name: s.name,
                    address: [s.address, s.city, s.state, s.zip].filter(Boolean).join(", "),
                    phone: s.phone || undefined,
                    taxId: s.ein_tax_id || undefined,
                });
            }
        } catch (err: any) {
            console.error("Error fetching invoice details:", err);
            setError("Failed to load invoice details");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;
        setPdfLoading(true);
        try {
            const pdfInvoice: InvoiceForPDF = {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                created_at: invoice.created_at,
                due_date: invoice.due_date,
                total: Number(invoice.total) || 0,
                balance: Number(invoice.balance) || 0,
                status: invoice.status,
                notes: invoice.notes,
                customer_name: invoice.customer_name,
                customer_email: invoice.customer_email,
                person: invoice.people || null,
            };

            const pdfItems: InvoiceLineItem[] = items.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity || 1,
                unit_price: Number(item.unit_price) || 0,
                amount: Number(item.amount) || 0,
            }));

            await downloadInvoicePDF({
                invoice: pdfInvoice,
                items: pdfItems,
                shul: shul || { name: "Organization" },
            });
        } catch (err) {
            console.error("PDF download error:", err);
            setError("Failed to generate PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    const handlePrintPDF = async () => {
        if (!invoice) return;
        setPdfLoading(true);
        try {
            const pdfInvoice: InvoiceForPDF = {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                created_at: invoice.created_at,
                due_date: invoice.due_date,
                total: Number(invoice.total) || 0,
                balance: Number(invoice.balance) || 0,
                status: invoice.status,
                notes: invoice.notes,
                customer_name: invoice.customer_name,
                customer_email: invoice.customer_email,
                person: invoice.people || null,
            };

            const pdfItems: InvoiceLineItem[] = items.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity || 1,
                unit_price: Number(item.unit_price) || 0,
                amount: Number(item.amount) || 0,
            }));

            await printInvoicePDF({
                invoice: pdfInvoice,
                items: pdfItems,
                shul: shul || { name: "Organization" },
            });
        } catch (err) {
            console.error("PDF print error:", err);
            setError("Failed to generate PDF");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleEmailInvoice = async () => {
        // TODO: Implement email sending via Edge Function
        setEmailLoading(true);
        try {
            // Placeholder - would call Edge Function here
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("Email functionality coming soon!");
        } finally {
            setEmailLoading(false);
        }
    };

    const handleVoidInvoice = async () => {
        if (!confirm("Are you sure you want to void this invoice? This action cannot be undone.")) {
            return;
        }

        setVoidLoading(true);
        try {
            const { error } = await supabase
                .from("invoices")
                .update({
                    status: "void",
                    voided_at: new Date().toISOString(),
                })
                .eq("id", invoice.id);

            if (error) throw error;

            onUpdated?.();
            onClose();
        } catch (err) {
            console.error("Void invoice error:", err);
            setError("Failed to void invoice");
        } finally {
            setVoidLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusConfig = (status: string | null) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return { color: "text-green-600 bg-green-50", icon: CheckCircle, label: "Paid" };
            case "sent":
                return { color: "text-blue-600 bg-blue-50", icon: Mail, label: "Sent" };
            case "partial":
                return { color: "text-amber-600 bg-amber-50", icon: Clock, label: "Partial" };
            case "overdue":
                return { color: "text-red-600 bg-red-50", icon: AlertCircle, label: "Overdue" };
            case "void":
                return { color: "text-stone-600 bg-stone-100", icon: Ban, label: "Void" };
            default:
                return { color: "text-stone-600 bg-stone-100", icon: FileText, label: "Draft" };
        }
    };

    if (!isOpen) return null;

    const statusConfig = getStatusConfig(invoice?.status);
    const StatusIcon = statusConfig.icon;
    const amountPaid = (Number(invoice?.total) || 0) - (Number(invoice?.balance) || 0);
    const isVoided = invoice?.status === "void";

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-stone-900">
                                        Invoice #{invoice?.invoice_number}
                                    </h2>
                                    <p className="text-sm text-stone-500">
                                        {invoice?.customer_name || "Unknown Customer"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {statusConfig.label}
                                </span>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-stone-500" />
                                </button>
                            </div>
                        </div>

                        {/* Action Bar */}
                        {!isVoided && (
                            <div className="flex items-center gap-2 px-6 py-3 border-b border-stone-100 bg-white">
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={pdfLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 text-sm font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    {pdfLoading ? "Generating..." : "Download PDF"}
                                </button>
                                <button
                                    onClick={handlePrintPDF}
                                    disabled={pdfLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 text-sm font-medium"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                                <button
                                    onClick={handleEmailInvoice}
                                    disabled={emailLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                                >
                                    <Mail className="w-4 h-4" />
                                    {emailLoading ? "Sending..." : "Email"}
                                </button>
                                <div className="flex-1" />
                                {invoice?.status !== "paid" && (
                                    <button
                                        onClick={handleVoidInvoice}
                                        disabled={voidLoading}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                                    >
                                        <Ban className="w-4 h-4" />
                                        {voidLoading ? "Voiding..." : "Void Invoice"}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-6 px-6 border-b border-stone-200">
                            {["details", "items", "payments"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                        ? "border-amber-600 text-amber-600"
                                        : "border-transparent text-stone-500 hover:text-stone-700"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                    <p className="text-red-600">{error}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Details Tab */}
                                    {activeTab === "details" && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Customer Info */}
                                                <div className="bg-stone-50 rounded-xl p-5">
                                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        Customer
                                                    </h3>
                                                    <p className="font-semibold text-stone-900 text-lg">{invoice?.customer_name || "-"}</p>
                                                    {invoice?.customer_email && (
                                                        <p className="text-stone-600 mt-1">{invoice.customer_email}</p>
                                                    )}
                                                </div>

                                                {/* Invoice Dates */}
                                                <div className="bg-stone-50 rounded-xl p-5">
                                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        Dates
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-stone-500">Created</span>
                                                            <span className="font-medium text-stone-900">
                                                                {invoice?.created_at ? formatDate(invoice.created_at) : "-"}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-stone-500">Due Date</span>
                                                            <span className="font-medium text-stone-900">
                                                                {invoice?.due_date ? formatDate(invoice.due_date) : "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial Summary */}
                                            <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-6 text-white">
                                                <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" />
                                                    Financial Summary
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-stone-300">Total Amount</span>
                                                        <span className="text-2xl font-bold">{formatCurrency(Number(invoice?.total) || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-stone-300">Amount Paid</span>
                                                        <span className="text-green-400 font-semibold">-{formatCurrency(amountPaid)}</span>
                                                    </div>
                                                    <div className="border-t border-stone-700 pt-3 flex justify-between items-center">
                                                        <span className="text-stone-300 font-medium">Balance Due</span>
                                                        <span className={`text-2xl font-bold ${Number(invoice?.balance) > 0 ? "text-amber-400" : "text-green-400"}`}>
                                                            {formatCurrency(Number(invoice?.balance) || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {invoice?.notes && (
                                                <div className="bg-stone-50 rounded-xl p-5">
                                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Notes</h3>
                                                    <p className="text-stone-700">{invoice.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Items Tab */}
                                    {activeTab === "items" && (
                                        <div>
                                            {items.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                    <p className="text-stone-500">No line items</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-hidden rounded-xl border border-stone-200">
                                                    <table className="w-full">
                                                        <thead className="bg-stone-50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Description</th>
                                                                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 uppercase tracking-wider">Qty</th>
                                                                <th className="px-4 py-3 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">Unit Price</th>
                                                                <th className="px-4 py-3 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-stone-100">
                                                            {items.map((item, idx) => (
                                                                <tr key={item.id} className={idx % 2 === 1 ? "bg-stone-50" : ""}>
                                                                    <td className="px-4 py-3 text-sm font-medium text-stone-900">{item.description}</td>
                                                                    <td className="px-4 py-3 text-sm text-center text-stone-600">{item.quantity || 1}</td>
                                                                    <td className="px-4 py-3 text-sm text-right text-stone-600">{formatCurrency(Number(item.unit_price) || 0)}</td>
                                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-stone-900">{formatCurrency(Number(item.amount) || 0)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-stone-100">
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-stone-700 text-right">Total</td>
                                                                <td className="px-4 py-3 text-sm text-right font-bold text-stone-900">{formatCurrency(Number(invoice?.total) || 0)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Payments Tab */}
                                    {activeTab === "payments" && (
                                        <div>
                                            {payments.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <DollarSign className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                    <p className="text-stone-500">No payments recorded</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {payments.map((payment) => (
                                                        <div key={payment.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                                                            <div>
                                                                <p className="font-medium text-stone-900">
                                                                    {payment.payment_date ? formatDate(payment.payment_date) : "Unknown date"}
                                                                </p>
                                                                <p className="text-sm text-stone-500 capitalize">{payment.method || "Card"}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-green-600">
                                                                    +{formatCurrency(Number(payment.amount) || 0)}
                                                                </p>
                                                                {payment.transaction_id && (
                                                                    <p className="text-xs text-stone-400">Ref: {payment.transaction_id}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
