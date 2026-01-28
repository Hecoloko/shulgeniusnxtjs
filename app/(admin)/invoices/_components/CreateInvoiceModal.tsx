"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Plus, Trash2, Search, User } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePeople, useCreateInvoice, Person } from "@/hooks";

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: () => void;
    shulId: string;
}

interface LineItem {
    id: string;
    description: string;
    amount: number;
    quantity: number;
}

export default function CreateInvoiceModal({ isOpen, onClose, onCreated, shulId }: CreateInvoiceModalProps) {
    const createInvoice = useCreateInvoice();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search State
    const [memberSearch, setMemberSearch] = useState("");
    const [selectedPerson, setSelectedPerson] = useState<{ id: string, name: string, email?: string | null } | null>(null);
    const [showMemberResults, setShowMemberResults] = useState(false);

    // Fetch people from the shul
    const { data: peopleData } = usePeople(shulId, { search: memberSearch || undefined });
    const people = peopleData?.data || [];

    // Invoice Form
    const [items, setItems] = useState<LineItem[]>([
        { id: '1', description: 'Membership Dues', amount: 0, quantity: 1 }
    ]);
    const [dueDate, setDueDate] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");

    // Generate invoice number when modal opens
    useEffect(() => {
        if (isOpen) {
            setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`);
        }
    }, [isOpen]);

    // Filter people for display
    const filteredPeople = useMemo(() => {
        if (!memberSearch) return people.slice(0, 10);
        return people;
    }, [people, memberSearch]);

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

    const handleAddItem = () => {
        setItems([...items, { id: Math.random().toString(), description: '', amount: 0, quantity: 1 }]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const getPersonName = (person: Person) => {
        return `${person.first_name} ${person.last_name}`.trim();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPerson) return;

        setIsSubmitting(true);

        try {
            await createInvoice.mutateAsync({
                shulId: shulId,
                customerId: selectedPerson.id,
                customerName: selectedPerson.name,
                customerEmail: selectedPerson.email || undefined,
                dueDate: dueDate || undefined,
                notes: undefined,
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.amount,
                })),
            });

            if (onCreated) onCreated();
            onClose();

            // Reset form
            setItems([{ id: '1', description: 'Membership Dues', amount: 0, quantity: 1 }]);
            setSelectedPerson(null);
            setMemberSearch("");
        } catch (error: unknown) {
            console.error("Failed to create invoice:", error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert("Failed to create invoice: " + message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowMemberResults(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
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
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                            <div className="p-6 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h2 className="text-2xl font-bold font-serif text-stone-900">Create New Invoice</h2>
                                <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                                {/* Top Section: Member & Invoice Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Member Selection */}
                                    <div className="relative z-20">
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Bill To</label>
                                        {selectedPerson ? (
                                            <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg bg-stone-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-stone-900">{selectedPerson.name}</div>
                                                        <div className="text-sm text-stone-500">{selectedPerson.email || 'No email'}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedPerson(null)}
                                                    className="text-stone-400 hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                                <input
                                                    type="text"
                                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                    placeholder="Search member name..."
                                                    value={memberSearch}
                                                    onChange={(e) => {
                                                        setMemberSearch(e.target.value);
                                                        setShowMemberResults(true);
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowMemberResults(true);
                                                    }}
                                                />

                                                {showMemberResults && (memberSearch || filteredPeople.length > 0) && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30">
                                                        {filteredPeople.length > 0 ? (
                                                            filteredPeople.map(person => (
                                                                <div
                                                                    key={person.id}
                                                                    className="p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0"
                                                                    onClick={() => {
                                                                        setSelectedPerson({
                                                                            id: person.id,
                                                                            name: getPersonName(person),
                                                                            email: person.email
                                                                        });
                                                                        setMemberSearch("");
                                                                        setShowMemberResults(false);
                                                                    }}
                                                                >
                                                                    <div className="font-medium text-stone-900">{getPersonName(person)}</div>
                                                                    <div className="text-xs text-stone-500">{person.email || 'No email'}</div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-stone-500 text-sm text-center">No members found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Invoice Meta */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-2">Invoice #</label>
                                            <input
                                                type="text"
                                                value={invoiceNumber}
                                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-2">Due Date</label>
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-stone-700">Line Items</label>
                                        <button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Add Item
                                        </button>
                                    </div>

                                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-stone-50 border-b border-stone-200">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-stone-600 uppercase w-1/2">Description</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-stone-600 uppercase w-20">Qty</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-stone-600 uppercase w-32">Price</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-stone-600 uppercase w-32">Total</th>
                                                    <th className="px-4 py-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {items.map((item) => (
                                                    <tr key={item.id} className="group">
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                className="w-full px-3 py-2 border border-transparent hover:border-stone-200 focus:border-blue-500 rounded bg-transparent focus:bg-white outline-none transition-all"
                                                                placeholder="Item description"
                                                                value={item.description}
                                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-full px-3 py-2 border border-transparent hover:border-stone-200 focus:border-blue-500 rounded bg-transparent focus:bg-white outline-none transition-all"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="w-full pl-6 pr-3 py-2 border border-transparent hover:border-stone-200 focus:border-blue-500 rounded bg-transparent focus:bg-white outline-none transition-all"
                                                                    value={item.amount}
                                                                    onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="p-2 text-right pr-4 font-medium text-stone-900">
                                                            ${(item.amount * item.quantity).toFixed(2)}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                                disabled={items.length === 1}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-stone-50 border-t border-stone-200">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-stone-700">Total Amount</td>
                                                    <td className="px-4 py-3 text-right text-lg font-bold text-stone-900 pr-14">
                                                        ${totalAmount.toFixed(2)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-stone-200 flex justify-between items-center bg-stone-50 rounded-b-2xl">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="sendEmail" defaultChecked className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500" />
                                    <label htmlFor="sendEmail" className="text-sm text-stone-600 cursor-pointer">Email invoice to member</label>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!selectedPerson || totalAmount === 0 || isSubmitting}
                                        className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-lg shadow-stone-900/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Creating...' : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Create Invoice
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
