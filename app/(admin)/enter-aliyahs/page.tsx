"use client";

import { motion } from "framer-motion";
import { Check, User, Calendar, Plus, X, Search, HelpCircle, Trash2, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const STANDARD_ALIYOT = [
    { type: "Cohen", amount: 18 },
    { type: "Levi", amount: 18 },
    { type: "Shlishi", amount: 18 },
    { type: "Revii", amount: 18 },
    { type: "Chamishi", amount: 18 },
    { type: "Shishi", amount: 18 },
    { type: "Shevii", amount: 18 },
    { type: "Maftir", amount: 18 },
    { type: "Hagbah", amount: 18 },
    { type: "Gelilah", amount: 18 },
];

const PARSHAS = [
    "Bereshit", "Noach", "Lech-Lecha", "Vayera", "Chayei Sarah", "Toldot", "Vayetzei",
    "Vayishlach", "Vayeshev", "Miketz", "Vayigash", "Vayechi", "Shemot", "Vaera",
    "Bo", "Beshalach", "Yitro", "Mishpatim", "Terumah", "Tetzaveh", "Ki Tisa",
    "Vayakhel", "Pekudei", "Vayikra", "Tzav", "Shemini", "Tazria", "Metzora",
    "Acharei Mot", "Kedoshim", "Emor", "Behar", "Bechukotai", "Bamidbar", "Naso",
    "Behaalotecha", "Shelach", "Korach", "Chukat", "Balak", "Pinchas", "Matot",
    "Masei", "Devarim", "Vaetchanan", "Eikev", "Re'eh", "Shoftim", "Ki Teitzei",
    "Ki Tavo", "Nitzavim", "Vayelech", "Haazinu", "Vezot Haberakhah"
];

interface AliyahRowData {
    id: string; // unique ID for React keys
    type: string;
    memberId?: string;
    memberName?: string;
    amount: number;
    notes: string;
}

export default function GabbaiModePage() {
    const supabase = createClient();
    const [selectedParsha, setSelectedParsha] = useState("Beshalach");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // Dynamic Rows State
    const [rows, setRows] = useState<AliyahRowData[]>([]);

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [notifySMS, setNotifySMS] = useState(true);

    const [members, setMembers] = useState<{ id: string; name: string; email: string | null }[]>([]);

    // Initial fetch of people for search
    useEffect(() => {
        const fetchPeople = async () => {
            const { data } = await supabase.from('people').select('id, first_name, last_name, email');
            if (data) {
                // Transform people data to have a name field for display
                const transformed = data.map(p => ({
                    id: p.id,
                    name: `${p.first_name} ${p.last_name}`.trim(),
                    email: p.email
                }));
                setMembers(transformed);
            }
        };
        fetchPeople();

        // Initialize Standard Rows
        const initialRows = STANDARD_ALIYOT.map((a, idx) => ({
            id: `std-${idx}`,
            type: a.type,
            amount: a.amount,
            notes: ""
        }));
        setRows(initialRows);
    }, []);

    const addHosafa = () => {
        const hosafaCount = rows.filter(r => r.type.startsWith("Hosafa")).length;
        const newRow: AliyahRowData = {
            id: `hosafa-${Date.now()}`,
            type: `Hosafa ${hosafaCount + 1}`,
            amount: 18,
            notes: ""
        };

        const maftirIdx = rows.findIndex(r => r.type === "Maftir");
        if (maftirIdx !== -1) {
            const newRows = [...rows];
            newRows.splice(maftirIdx, 0, newRow);
            setRows(newRows);
        } else {
            setRows([...rows, newRow]);
        }
    };

    const addLineItem = () => {
        const newRow: AliyahRowData = {
            id: `line-${Date.now()}`,
            type: "Line Item",
            amount: 0,
            notes: ""
        };
        setRows([...rows, newRow]);
    };

    const updateRow = (id: string, field: keyof AliyahRowData, value: any) => {
        setRows(prev => prev.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const removeRow = (id: string) => {
        setRows(prev => prev.filter(row => row.id !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const activeRows = rows.filter(r => r.memberId);

        if (activeRows.length === 0) {
            alert("Please select at least one member to record.");
            setIsSaving(false);
            return;
        }

        try {
            // Group by member to create invoices
            const byMember = activeRows.reduce((acc, row) => {
                if (!row.memberId) return acc;
                if (!acc[row.memberId]) acc[row.memberId] = [];
                acc[row.memberId].push(row);
                return acc;
            }, {} as Record<string, AliyahRowData[]>);

            const timestamp = new Date().toISOString();

            // Process each member
            for (const [memberId, memberRows] of Object.entries(byMember)) {
                const total = memberRows.reduce((sum, r) => sum + Number(r.amount), 0);
                const memberName = memberRows[0].memberName || "Unknown";

                // 1. Create Invoice
                const { data: invoice, error: invError } = await supabase
                    .from('invoices')
                    .insert({
                        customer_id: memberId,
                        customer_name: memberName,
                        total: total,
                        balance: total,
                        status: 'sent',
                        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
                    })
                    .select()
                    .single();

                if (invError) throw invError;
                if (!invoice) throw new Error("Failed to create invoice");

                // 2. Create Kibbudim entries
                const kibbudimEntries = memberRows.map(r => ({
                    person_id: memberId,
                    person_name: memberName,
                    kibbud_type: r.type,
                    parsha_chodesh: selectedParsha,
                    year: parseInt(selectedYear),
                    date: timestamp,
                    amount: r.amount,
                    notes: r.notes,
                    invoice_id: invoice.id
                }));

                const { error: kibbudError } = await supabase
                    .from('kibbudim')
                    .insert(kibbudimEntries);

                if (kibbudError) throw kibbudError;

                // 3. Update Member Balance (Client-side optimistic or RPC in future)
                // For now, let's just assume the invoice adds to balance if we were maintaining it strictly.
                // But `members.balance` is often a computed field or trigger.
            }

            alert("Aliyahs saved successfully!");

            // Cleanup
            setRows(prev => prev.map(r => ({
                ...r,
                memberId: undefined,
                memberName: undefined,
                notes: ""
            })));

        } catch (err: any) {
            console.error(err);
            alert("Error saving aliyahs: " + (err.message || err));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-stone-900">Gabbai Mode</h1>
                    <p className="text-stone-600">Enter Aliyahs for {selectedParsha}</p>
                </div>

                <div className="flex gap-4">
                    <select
                        value={selectedParsha}
                        onChange={(e) => setSelectedParsha(e.target.value)}
                        className="px-4 py-2 border border-stone-200 rounded-lg bg-white font-medium"
                    >
                        {PARSHAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-4 py-2 border border-stone-200 rounded-lg bg-white font-medium"
                    >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            {/* Main Entry Matrix */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-stone-700 uppercase w-48">Aliyah</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-stone-700 uppercase min-w-[300px]">Member</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-stone-700 uppercase w-32">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-stone-700 uppercase">Notes</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {rows.map((row, idx) => (
                                <AliyahRow
                                    key={row.id}
                                    row={row}
                                    members={members}
                                    onUpdate={updateRow}
                                    onRemove={removeRow}
                                    idx={idx}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3">
                    <button
                        onClick={addHosafa}
                        className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors font-medium text-sm shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Hosafa
                    </button>
                    <button
                        onClick={addLineItem}
                        className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors font-medium text-sm shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Line Item
                    </button>
                </div>
            </div>

            {/* Notifications & Save */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notifyEmail}
                            onChange={e => setNotifyEmail(e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-stone-700">Email Invoices</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notifySMS}
                            onChange={e => setNotifySMS(e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-stone-700">SMS Notifications</span>
                    </label>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            if (confirm("Clear all entries?")) {
                                setRows(prev => prev.map(r => ({ ...r, memberId: undefined, memberName: undefined, amount: 18, notes: "" })));
                            }
                        }}
                        className="px-6 py-3 text-stone-500 hover:text-stone-700 font-medium"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-8 py-3 rounded-xl shadow-lg shadow-stone-900/10 transition-all font-bold text-lg disabled:opacity-70"
                    >
                        {isSaving ? (
                            "Processing..."
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Save & Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AliyahRow({
    row,
    members,
    onUpdate,
    onRemove,
    idx
}: {
    row: AliyahRowData,
    members: any[],
    onUpdate: (id: string, field: keyof AliyahRowData, val: any) => void,
    onRemove: (id: string) => void,
    idx: number
}) {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter members
    const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const isRemovable = row.type.includes("Hosafa") || row.type === "Line Item";

    return (
        <tr className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'}`}>
            <td className="px-6 py-4">
                {row.type === "Line Item" ? (
                    <input
                        type="text"
                        value={row.type}
                        onChange={(e) => onUpdate(row.id, 'type', e.target.value)}
                        className="font-bold text-stone-800 bg-transparent border-b border-dashed border-stone-300 focus:border-stone-500 outline-none w-full"
                    />
                ) : (
                    <span className="font-bold text-stone-800">{row.type}</span>
                )}
            </td>
            <td className="px-6 py-4">
                <div className="relative" ref={wrapperRef}>
                    {row.memberName ? (
                        <div className="flex items-center justify-between p-2 border border-blue-200 bg-blue-50 rounded-lg">
                            <span className="font-medium text-blue-900">{row.memberName}</span>
                            <button
                                onClick={() => {
                                    onUpdate(row.id, 'memberId', undefined);
                                    onUpdate(row.id, 'memberName', undefined);
                                }}
                                className="text-blue-400 hover:text-blue-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Select member..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
                                    onFocus={() => setIsOpen(true)}
                                />
                            </div>
                            {isOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                                    {filtered.map(m => (
                                        <div
                                            key={m.id}
                                            className="p-2 hover:bg-stone-50 cursor-pointer text-sm"
                                            onClick={() => {
                                                onUpdate(row.id, 'memberId', m.id);
                                                onUpdate(row.id, 'memberName', m.name);
                                                setIsOpen(false);
                                                setSearch("");
                                            }}
                                        >
                                            <div className="font-medium text-stone-900">{m.name}</div>
                                            <div className="text-xs text-stone-500">{m.email}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">$</span>
                    <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => onUpdate(row.id, 'amount', e.target.value)}
                        className="w-24 pl-6 pr-2 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-stone-900"
                    />
                </div>
            </td>
            <td className="px-6 py-4">
                <input
                    type="text"
                    placeholder="Optional notes..."
                    value={row.notes}
                    onChange={(e) => onUpdate(row.id, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                />
            </td>
            <td>
                {isRemovable && (
                    <button onClick={() => onRemove(row.id)} className="text-stone-400 hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </td>
        </tr>
    )
}
