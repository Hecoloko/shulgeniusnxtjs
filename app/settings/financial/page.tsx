'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // Ensuring consistent import
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@/components/ui";
import { Plus, Settings2, CreditCard, Trash2, Edit } from "lucide-react";
import { AddProcessorDialog } from "@/components/finance/AddProcessorDialog";
import { toast } from "sonner";

export default function FinancialSettingsPage() {
    const [processors, setProcessors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingProcessor, setEditingProcessor] = useState<any>(null);

    const supabase = createClient();

    const fetchProcessors = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user's shul
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('shul_id')
                .eq('user_id', user.id)
                .limit(1)
                .single();

            if (!roleData?.shul_id) return;

            const { data, error } = await supabase
                .from('payment_processors')
                .select('*')
                .eq('shul_id', roleData.shul_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProcessors(data || []);
        } catch (error) {
            console.error('Error fetching processors:', error);
            toast.error("Failed to load processors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcessors();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this processor? This may break existing subscriptions.")) return;

        const { error } = await supabase.from('payment_processors').delete().eq('id', id);
        if (error) {
            toast.error("Failed to delete: " + error.message);
        } else {
            toast.success("Processor deleted");
            fetchProcessors();
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Settings</h1>
                    <p className="text-muted-foreground">Manage payment gateways and accounting preferences.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Payment Processors</CardTitle>
                            <CardDescription>Configure Cardknox, Stripe, or other gateways.</CardDescription>
                        </div>
                        <Button onClick={() => { setEditingProcessor(null); setShowAddDialog(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Add Processor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading...</div>
                    ) : processors.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <h3 className="font-semibold text-lg">No Processors Configured</h3>
                            <p className="text-muted-foreground mb-4">You cannot process payments until you add a gateway.</p>
                            <Button variant="outline" onClick={() => setShowAddDialog(true)}>Setup Cardknox</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {processors.map(proc => (
                                <div key={proc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Settings2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{proc.name}</h4>
                                                {proc.is_default && <Badge variant="secondary">Default</Badge>}
                                                {!proc.is_active && <Badge variant="destructive">Inactive</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground capitalize">{proc.type} • {proc.environment || 'Production'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingProcessor(proc); setShowAddDialog(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(proc.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddProcessorDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onProcessorSaved={fetchProcessors}
                editingProcessor={editingProcessor}
            />
        </div>
    );
}
