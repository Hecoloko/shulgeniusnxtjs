import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@/types/supabase";

interface CreateCampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCampaignSaved: () => void;
    editingCampaign?: Campaign | null;
}

export function CreateCampaignDialog({ open, onOpenChange, onCampaignSaved, editingCampaign }: CreateCampaignDialogProps) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        goal: "",
        type: "general",
        status: "active",
        start_date: "",
        end_date: "",
    });

    useEffect(() => {
        if (open) {
            if (editingCampaign) {
                setFormData({
                    name: editingCampaign.name,
                    description: editingCampaign.description || "",
                    goal: editingCampaign.goal?.toString() || "",
                    // @ts-ignore
                    type: editingCampaign.metadata?.type || editingCampaign.type || "general",
                    status: editingCampaign.status || "active",
                    start_date: editingCampaign.start_date ? new Date(editingCampaign.start_date).toISOString().split('T')[0] : "",
                    end_date: editingCampaign.end_date ? new Date(editingCampaign.end_date).toISOString().split('T')[0] : "",
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    goal: "",
                    type: "general",
                    status: "active",
                    start_date: "",
                    end_date: "",
                });
            }
        }
    }, [open, editingCampaign]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Name is required");
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Get Shul ID
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('shul_id')
                .eq('user_id', user.id)
                .limit(1)
                .single();

            if (!roleData?.shul_id) throw new Error("Acccount not associated with a shul");

            const payload = {
                shul_id: roleData.shul_id,
                name: formData.name,
                description: formData.description || null,
                goal: formData.goal ? parseFloat(formData.goal) : null,
                status: formData.status,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                type: formData.type
            };

            let error;
            if (editingCampaign) {
                const { error: updateError } = await supabase
                    .from('campaigns')
                    .update(payload)
                    .eq('id', editingCampaign.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('campaigns')
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingCampaign ? "Drive updated successfully" : "Drive created successfully");
            onCampaignSaved();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Error saving campaign:', error);
            toast.error(error.message || "Failed to save campaign");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingCampaign ? "Edit Drive / Fund" : "Create New Drive / Fund"}</DialogTitle>
                    <DialogDescription>
                        Set up a fundraising bucket or campaign to track donations.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Building Fund 2024"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Short description..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="general">General Fund</option>
                                    <option value="building_fund">Building Fund</option>
                                    <option value="charity">Charity / Tzedakah</option>
                                    <option value="event">Event</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="completed">Completed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="goal">Goal Amount ($)</Label>
                        <Input
                            id="goal"
                            type="number"
                            placeholder="Optional"
                            value={formData.goal}
                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCampaign ? "Save Changes" : "Create Drive"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
