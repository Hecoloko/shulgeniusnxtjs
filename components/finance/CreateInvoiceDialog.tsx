'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LineItem {
    description: string;
    quantity: number;
    unit_price: number;
}

export function CreateInvoiceDialog({ shulId, customerId, onInvoiceCreated, open: controlledOpen, onOpenChange: controlledOnOpenChange }: {
    shulId: string;
    customerId?: string;
    onInvoiceCreated?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }]);
    const [notes, setNotes] = useState('');
    const [sendEmail, setSendEmail] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');

    useEffect(() => {
        if (open && shulId) {
            fetchCampaigns();
        }
    }, [open, shulId]);



    const fetchCampaigns = async () => {
        const { data } = await supabase.from('campaigns').select('id, name').eq('shul_id', shulId);
        if (data) {
            setCampaigns(data);
            if (data.length > 0) setSelectedCampaign(data[0].id);
        }
    };

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    };

    // Member Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string, name: string } | null>(null);
    const [showResults, setShowResults] = useState(false);

    // Initial load if customerId provided (optional, fetch name?)
    // For now we assume if customerId is passed, we don't need to search.

    useEffect(() => {
        if (!customerId && searchTerm.length > 2) {
            const delayDebounce = setTimeout(async () => {
                const { data } = await supabase
                    .from('people')
                    .select('id, first_name, last_name, email')
                    .eq('shul_id', shulId)
                    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                    .limit(5);
                setSearchResults(data || []);
                setShowResults(true);
            }, 300);
            return () => clearTimeout(delayDebounce);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [searchTerm, customerId, shulId]);

    const handleSelectCustomer = (customer: any) => {
        setSelectedCustomer({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`
        });
        setSearchTerm(`${customer.first_name} ${customer.last_name}`);
        setShowResults(false);
    };

    const effectiveCustomerId = customerId || selectedCustomer?.id;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!effectiveCustomerId) throw new Error("Please select a member");
            if (!selectedCampaign) throw new Error("Please select a campaign");

            const { data, error } = await supabase.rpc('generate_invoice', {
                p_shul_id: shulId,
                p_customer_id: effectiveCustomerId,
                p_line_items: items,
                p_campaign_id: selectedCampaign,
                p_notes: notes,
                p_send_email: sendEmail
            });

            if (error) throw error;

            if (sendEmail && data?.invoice_id) {
                await supabase.functions.invoke('send-invoice-email', {
                    body: { invoiceId: data.invoice_id }
                });
            }

            setOpen(false);
            if (onInvoiceCreated) onInvoiceCreated();
            setItems([{ description: '', quantity: 1, unit_price: 0 }]);
            setNotes('');
            setSelectedCustomer(null);
            setSearchTerm('');
        } catch (err: any) {
            alert('Error creating invoice: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">

                    {/* Member Search (Only if no customerId) */}
                    {!customerId && (
                        <div className="space-y-2 relative">
                            <Label>Bill To</Label>
                            <Input
                                placeholder="Search member by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete="off"
                            />
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                    {searchResults.map(p => (
                                        <div
                                            key={p.id}
                                            className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
                                            onClick={() => handleSelectCustomer(p)}
                                        >
                                            <div className="font-semibold">{p.first_name} {p.last_name}</div>
                                            <div className="text-xs text-muted-foreground">{p.email}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Campaign</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={selectedCampaign}
                            onChange={(e) => setSelectedCampaign(e.target.value)}
                        >
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Line Items</Label>
                            <Button variant="outline" size="sm" onClick={handleAddItem} type="button">
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </div>
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-end border p-2 rounded">
                                <div className="flex-1 space-y-1">
                                    <Input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="w-20 space-y-1">
                                    <Input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="w-24 space-y-1">
                                    <Input
                                        type="number"
                                        placeholder="Price"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end font-bold text-lg">
                        Total: ${calculateTotal().toFixed(2)}
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="sendEmail"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="sendEmail">Send Email Notification</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
