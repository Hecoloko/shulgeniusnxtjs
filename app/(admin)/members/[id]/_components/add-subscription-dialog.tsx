"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Use consistent path
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui";
import { Button, Input, Label } from "@/components/ui";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface AddSubscriptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    personId: string;
    shulId: string;
}

const FREQUENCIES = [
    { value: "monthly", label: "Monthly" },
    { value: "weekly", label: "Weekly" },
    { value: "annually", label: "Annually" },
];

export default function AddSubscriptionDialog({ isOpen, onClose, onCreated, personId, shulId }: AddSubscriptionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Form State
    const [selectedCampaign, setSelectedCampaign] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("monthly");
    const [selectedMethodId, setSelectedMethodId] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Derived State
    const [campaignProcessorId, setCampaignProcessorId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            if (!shulId) return;
            fetchCampaigns();
            fetchPaymentMethods();
        }
    }, [isOpen, shulId]);

    const fetchCampaigns = async () => {
        try {
            const { data: campaignsData } = await supabase
                .from('campaigns')
                .select('*')
                .eq('shul_id', shulId)
            //.eq('status', 'active'); // Assuming status column exists and we want active ones

            setCampaigns(campaignsData || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const { data } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('person_id', personId)
                .eq('is_active', true);

            setPaymentMethods(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    // Logic: When Campaign changes, check if it has a forced processor
    useEffect(() => {
        if (selectedCampaign && campaigns.length > 0) {
            const campaign = campaigns.find(c => c.id === selectedCampaign);
            // Assuming campaign.processors structure or similar if it exists
            // For now, ignoring strict processor logic to ensure basic functionality
            setCampaignProcessorId(null);
        } else {
            setCampaignProcessorId(null);
        }
    }, [selectedCampaign, campaigns]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCampaign || !amount) {
            toast.error("Missing required fields");
            return;
        }

        if (!selectedMethodId) {
            toast.error("Please select a payment method for recurring billing");
            return;
        }

        try {
            setLoading(true);

            const method = paymentMethods.find(m => m.id === selectedMethodId);

            // Determine processor ID - preferably from the method, or shul default
            let processorId = method?.processor_id;
            if (!processorId) {
                const { data: defaultProc } = await supabase.from('payment_processors').select('id').eq('shul_id', shulId).eq('is_default', true).single();
                processorId = defaultProc?.id;
            }

            if (!processorId) {
                toast.error("No payment processor found");
                return;
            }

            // external_schedule_id is required
            const externalScheduleId = `SCH_${Math.random().toString(36).substr(2, 9)}`;

            const { error } = await supabase.from('payment_schedules').insert({
                shul_id: shulId,
                person_id: personId,
                processor_id: processorId,
                payment_method_id: selectedMethodId,
                campaign_id: selectedCampaign,
                amount: parseFloat(amount),
                frequency: frequency,
                start_date: startDate,
                next_run_date: startDate, // Due immediately
                status: 'active',
                external_schedule_id: externalScheduleId,
                description: `Subscription for ${campaigns.find(c => c.id === selectedCampaign)?.name || 'Campaign'}`
            });

            if (error) throw error;

            toast.success("Subscription created!");
            onCreated();
            onClose();

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to create subscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Subscription</DialogTitle>
                    <DialogDescription>Setup recurring payments.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign">Campaign</Label>
                        <div className="relative">
                            <select
                                id="campaign"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedCampaign}
                                onChange={(e) => setSelectedCampaign(e.target.value)}
                            >
                                <option value="" disabled>Select Campaign</option>
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <div className="flex gap-2">
                            {FREQUENCIES.map(f => (
                                <Button
                                    key={f.value}
                                    type="button"
                                    variant={frequency === f.value ? "default" : "outline"}
                                    onClick={() => setFrequency(f.value)}
                                    className="flex-1"
                                >
                                    {f.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="method">Payment Method</Label>
                        <div className="bg-muted p-3 rounded-md">
                            {paymentMethods.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground p-2">
                                    No saved cards found.
                                </p>
                            ) : (
                                <div className="relative">
                                    <select
                                        id="method"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedMethodId}
                                        onChange={(e) => setSelectedMethodId(e.target.value)}
                                    >
                                        <option value="" disabled>Select Card</option>
                                        {paymentMethods.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.brand ? m.brand.toUpperCase() : 'CARD'} •••• {m.last4}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary text-white">
                            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            Create Subscription
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
