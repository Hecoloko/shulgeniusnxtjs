import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface AddSubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberId: string; // The person_id
    shulId: string;   // Passed as prop to avoid extra fetch
    onSubscriptionAdded: () => void;
}

const FREQUENCIES = [
    { value: "monthly", label: "Monthly" },
    { value: "weekly", label: "Weekly" },
    { value: "annually", label: "Annually" },
];

export function AddSubscriptionDialog({ open, onOpenChange, memberId, shulId, onSubscriptionAdded }: AddSubscriptionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Form State
    const [selectedCampaign, setSelectedCampaign] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("monthly");
    const [billingType, setBillingType] = useState<"manual" | "auto_cc">("auto_cc");
    const [selectedMethodId, setSelectedMethodId] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Derived State
    const [campaignProcessorId, setCampaignProcessorId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (open) {
            if (!shulId) return;
            fetchCampaigns();
            fetchPaymentMethods();
        }
    }, [open, shulId]);

    const fetchCampaigns = async () => {
        // 1. Fetch campaigns
        const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('shul_id', shulId)
            .eq('status', 'active');

        setCampaigns(campaignsData || []);
    };

    const fetchPaymentMethods = async () => {
        // 2. Fetch payment methods for this member
        // We fetch ALL methods first, then filter in memory based on selection
        const { data } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('person_id', memberId)
            .eq('is_active', true);

        setPaymentMethods(data || []);
    };

    // Logic: When Campaign changes, check if it has a forced processor
    useEffect(() => {
        if (selectedCampaign && campaigns.length > 0) {
            const campaign = campaigns.find(c => c.id === selectedCampaign);
            if (campaign && campaign.processors && campaign.processors.length > 0) {
                // It has assigned processors. We assume the first one is primary.
                setCampaignProcessorId(campaign.processors[0]);
                // If the currently selected card doesn't match this processor, clear it.
                // But we need to look up the card's processor_id.
                // This is handled in the render phase or by another effect.
                // Let's do it here:
                if (selectedMethodId) {
                    const method = paymentMethods.find(m => m.id === selectedMethodId);
                    if (method && method.processor_id !== campaign.processors[0]) {
                        setSelectedMethodId(""); // Invalidated
                        toast.warning("Payment method cleared: Campaign requires a different processor.");
                    }
                }
            } else {
                setCampaignProcessorId(null); // Use Any/Default
            }
        } else {
            setCampaignProcessorId(null);
        }
    }, [selectedCampaign, campaigns, paymentMethods]);

    // Filter valid payment methods based on Campaign Processor
    const validPaymentMethods = paymentMethods.filter(method => {
        if (!campaignProcessorId) return true; // If no specific processor, show all (or hopefully shul default matches)
        return method.processor_id === campaignProcessorId;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCampaign || !amount) {
            toast.error("Missing required fields");
            return;
        }

        if (billingType === 'auto_cc' && !selectedMethodId) {
            toast.error("Please select a payment method for Auto CC");
            return;
        }

        try {
            setLoading(true);

            const method = paymentMethods.find(m => m.id === selectedMethodId);

            const { error } = await supabase.from('payment_schedules').insert({
                shul_id: shulId,
                person_id: memberId,
                processor_id: method ? method.processor_id : (campaignProcessorId || (await getDefaultProcessorId())), // Fallback logic needed
                payment_method_id: selectedMethodId || null,
                campaign_id: selectedCampaign,
                amount: parseFloat(amount),
                frequency: frequency,
                start_date: startDate,
                next_run_date: startDate, // Due immediately
                status: 'active',
                external_schedule_id: `SCH_${Math.random().toString(36).substr(2, 9)}`, // Dummy for now if not syncing to Cardknox yet
                description: `Subscription for ${campaigns.find(c => c.id === selectedCampaign)?.name}`
            });

            if (error) throw error;

            toast.success("Subscription created!");
            onSubscriptionAdded();
            onOpenChange(false);

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getDefaultProcessorId = async () => {
        const { data } = await supabase
            .from('payment_processors')
            .select('id')
            .eq('shul_id', shulId)
            .eq('is_default', true)
            .single();
        return data?.id;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Subscription</DialogTitle>
                    <DialogDescription>Setup recurring payments.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Campaign</Label>
                        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Campaign" />
                            </SelectTrigger>
                            <SelectContent>
                                {campaigns.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            startAdornment="$"
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
                        <Label>Payment Method</Label>
                        <div className="bg-muted p-3 rounded-md">
                            {campaignProcessorId && (
                                <p className="text-xs text-amber-600 mb-2">
                                    🔒 Filtered to Processor-compatible cards
                                </p>
                            )}

                            {validPaymentMethods.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground p-2">
                                    No saved cards found. <br />
                                    <Button variant="link" className="h-auto p-0 text-primary">Add a card</Button> for this processor first.
                                </p>
                            ) : (
                                <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Card" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {validPaymentMethods.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" />
                                                    <span>{m.brand} •••• {m.last4}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="bg-gradient-primary text-white">
                            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            Create Subscription
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
