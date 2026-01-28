"use client";

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
    Font
} from "@react-pdf/renderer";
import { ReactElement } from "react";

// Register fonts for better typography (optional - uses built-in Helvetica as fallback)
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2' });

const STONE_50 = "#FAFAF9";
const STONE_100 = "#F5F5F4";
const STONE_600 = "#57534E";
const STONE_700 = "#44403C";
const STONE_900 = "#1C1917";
const AMBER_600 = "#D97706";
const GREEN_600 = "#16A34A";
const RED_600 = "#DC2626";
const BLUE_600 = "#2563EB";

const styles = StyleSheet.create({
    page: {
        padding: 48,
        fontSize: 10,
        fontFamily: "Helvetica",
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 32,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: STONE_100,
    },
    logo: {
        fontSize: 24,
        fontWeight: "bold",
        color: STONE_900,
        fontFamily: "Helvetica-Bold",
    },
    orgSubtitle: {
        fontSize: 10,
        color: STONE_600,
        marginTop: 2,
    },
    invoiceHeader: {
        alignItems: "flex-end",
    },
    invoiceTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: AMBER_600,
        fontFamily: "Helvetica-Bold",
        letterSpacing: 2,
    },
    invoiceNumber: {
        fontSize: 11,
        color: STONE_700,
        marginTop: 4,
        fontFamily: "Helvetica-Bold",
    },
    invoiceDate: {
        fontSize: 10,
        color: STONE_600,
        marginTop: 2,
    },
    twoColumn: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    column: {
        width: "48%",
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: "bold",
        color: STONE_600,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
        fontFamily: "Helvetica-Bold",
    },
    billToBox: {
        backgroundColor: STONE_50,
        padding: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: STONE_100,
    },
    billToName: {
        fontSize: 13,
        fontWeight: "bold",
        color: STONE_900,
        marginBottom: 4,
        fontFamily: "Helvetica-Bold",
    },
    billToText: {
        fontSize: 10,
        color: STONE_600,
        marginBottom: 2,
    },
    invoiceDetailsBox: {
        backgroundColor: STONE_50,
        padding: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: STONE_100,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 10,
        color: STONE_600,
    },
    detailValue: {
        fontSize: 10,
        color: STONE_900,
        fontFamily: "Helvetica-Bold",
    },
    // Table styles
    table: {
        marginTop: 8,
        marginBottom: 24,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: STONE_900,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    tableHeaderText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontFamily: "Helvetica-Bold",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: STONE_100,
    },
    tableRowAlt: {
        backgroundColor: STONE_50,
    },
    colDescription: { width: "50%" },
    colQty: { width: "12%", textAlign: "center" },
    colPrice: { width: "19%", textAlign: "right" },
    colTotal: { width: "19%", textAlign: "right" },
    tableCell: {
        fontSize: 10,
        color: STONE_700,
    },
    tableCellBold: {
        fontSize: 10,
        color: STONE_900,
        fontFamily: "Helvetica-Bold",
    },
    // Totals section
    totalsContainer: {
        alignItems: "flex-end",
        marginTop: 8,
    },
    totalsBox: {
        width: 220,
        backgroundColor: STONE_50,
        padding: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: STONE_100,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    totalLabel: {
        fontSize: 10,
        color: STONE_600,
    },
    totalValue: {
        fontSize: 10,
        color: STONE_900,
        fontFamily: "Helvetica-Bold",
    },
    balanceDueRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: AMBER_600,
    },
    balanceDueLabel: {
        fontSize: 12,
        color: STONE_900,
        fontFamily: "Helvetica-Bold",
    },
    balanceDueValue: {
        fontSize: 14,
        color: AMBER_600,
        fontFamily: "Helvetica-Bold",
    },
    paidValue: {
        fontSize: 14,
        color: GREEN_600,
        fontFamily: "Helvetica-Bold",
    },
    // Payment link section
    paymentLinkBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: "#EFF6FF", // blue-50
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#BFDBFE", // blue-200
        alignItems: "center",
    },
    paymentLinkTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: STONE_900,
        marginBottom: 6,
        fontFamily: "Helvetica-Bold",
    },
    paymentLinkUrl: {
        fontSize: 9,
        color: BLUE_600,
    },
    // Notes section
    notesSection: {
        marginTop: 24,
        padding: 14,
        backgroundColor: STONE_50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: STONE_100,
    },
    notesTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: STONE_700,
        marginBottom: 6,
        fontFamily: "Helvetica-Bold",
    },
    notesText: {
        fontSize: 10,
        color: STONE_600,
        lineHeight: 1.5,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 32,
        left: 48,
        right: 48,
        textAlign: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: STONE_100,
    },
    footerText: {
        fontSize: 8,
        color: STONE_600,
    },
    footerBrand: {
        fontSize: 8,
        color: AMBER_600,
        marginTop: 2,
        fontFamily: "Helvetica-Bold",
    },
});

// Types
export interface InvoiceLineItem {
    id?: string;
    description: string;
    quantity?: number;
    unit_price: number;
    amount: number;
}

export interface InvoiceForPDF {
    id: string;
    invoice_number: string;
    created_at: string;
    due_date?: string | null;
    total: number;
    balance: number;
    status?: string | null;
    notes?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    // Joined person data
    person?: {
        first_name: string;
        last_name: string;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        zip?: string | null;
    } | null;
}

export interface ShulBranding {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    taxId?: string;
}

export interface InvoicePDFProps {
    invoice: InvoiceForPDF;
    items: InvoiceLineItem[];
    shul: ShulBranding;
    paymentUrl?: string;
}

// Format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// Format date
const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Build address lines
const formatAddress = (person: InvoiceForPDF['person']): string[] => {
    if (!person) return [];
    const lines: string[] = [];
    if (person.address) lines.push(person.address);
    const cityStateZip = [person.city, person.state, person.zip].filter(Boolean).join(', ');
    if (cityStateZip) lines.push(cityStateZip);
    return lines;
};

// PDF Document Component
export function InvoicePDFDocument({
    invoice,
    items,
    shul,
    paymentUrl,
}: InvoicePDFProps): ReactElement {
    const customerName = invoice.person
        ? `${invoice.person.first_name} ${invoice.person.last_name}`
        : invoice.customer_name || 'Customer';

    const customerEmail = invoice.person?.email || invoice.customer_email;
    const customerPhone = invoice.person?.phone;
    const addressLines = formatAddress(invoice.person);

    const amountPaid = invoice.total - invoice.balance;
    const isPaid = invoice.balance <= 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.logo}>{shul.name}</Text>
                        {shul.address && <Text style={styles.orgSubtitle}>{shul.address}</Text>}
                        {shul.phone && <Text style={styles.orgSubtitle}>{shul.phone}</Text>}
                        {shul.taxId && <Text style={styles.orgSubtitle}>Tax ID: {shul.taxId}</Text>}
                    </View>
                    <View style={styles.invoiceHeader}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                        <Text style={styles.invoiceDate}>{formatDate(invoice.created_at)}</Text>
                    </View>
                </View>

                {/* Two Column: Bill To & Invoice Details */}
                <View style={styles.twoColumn}>
                    {/* Bill To */}
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>Bill To</Text>
                        <View style={styles.billToBox}>
                            <Text style={styles.billToName}>{customerName}</Text>
                            {customerEmail && <Text style={styles.billToText}>{customerEmail}</Text>}
                            {customerPhone && <Text style={styles.billToText}>{customerPhone}</Text>}
                            {addressLines.map((line, i) => (
                                <Text key={i} style={styles.billToText}>{line}</Text>
                            ))}
                        </View>
                    </View>

                    {/* Invoice Details */}
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>Invoice Details</Text>
                        <View style={styles.invoiceDetailsBox}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Invoice Number</Text>
                                <Text style={styles.detailValue}>#{invoice.invoice_number}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Invoice Date</Text>
                                <Text style={styles.detailValue}>{formatDate(invoice.created_at)}</Text>
                            </View>
                            {invoice.due_date && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Due Date</Text>
                                    <Text style={styles.detailValue}>{formatDate(invoice.due_date)}</Text>
                                </View>
                            )}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={[styles.detailValue, { color: isPaid ? GREEN_600 : AMBER_600 }]}>
                                    {isPaid ? 'PAID' : (invoice.status?.toUpperCase() || 'PENDING')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Line Items Table */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
                        <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
                        <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
                        <Text style={[styles.tableHeaderText, styles.colTotal]}>Amount</Text>
                    </View>

                    {/* Table Rows */}
                    {items.map((item, index) => (
                        <View
                            key={item.id || index}
                            style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                        >
                            <Text style={[styles.tableCellBold, styles.colDescription]}>{item.description}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity || 1}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
                            <Text style={[styles.tableCellBold, styles.colTotal]}>{formatCurrency(item.amount)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsContainer}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
                        </View>
                        {amountPaid > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Amount Paid</Text>
                                <Text style={[styles.totalValue, { color: GREEN_600 }]}>
                                    -{formatCurrency(amountPaid)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.balanceDueRow}>
                            <Text style={styles.balanceDueLabel}>Balance Due</Text>
                            <Text style={isPaid ? styles.paidValue : styles.balanceDueValue}>
                                {formatCurrency(invoice.balance)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Payment Link */}
                {paymentUrl && !isPaid && (
                    <View style={styles.paymentLinkBox}>
                        <Text style={styles.paymentLinkTitle}>Pay Online</Text>
                        <Text style={styles.paymentLinkUrl}>{paymentUrl}</Text>
                    </View>
                )}

                {/* Notes */}
                {invoice.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesTitle}>Notes</Text>
                        <Text style={styles.notesText}>{invoice.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Thank you for your support!</Text>
                    <Text style={styles.footerBrand}>{shul.name}</Text>
                </View>
            </Page>
        </Document>
    );
}

// Generate PDF Blob
export async function generateInvoicePDF(props: InvoicePDFProps): Promise<Blob> {
    const doc = <InvoicePDFDocument {...props} />;
    return await pdf(doc).toBlob();
}

// Download PDF
export async function downloadInvoicePDF(
    props: InvoicePDFProps,
    filename?: string
): Promise<void> {
    const blob = await generateInvoicePDF(props);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `invoice-${props.invoice.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Open PDF in new tab for printing
export async function printInvoicePDF(props: InvoicePDFProps): Promise<void> {
    const blob = await generateInvoicePDF(props);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
