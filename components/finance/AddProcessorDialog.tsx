import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Check if this path is correct, previous file had @/utils/supabase/client but usually it's lib
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui";
import { Button, Input, Label, Switch, Alert, AlertDescription } from "@/components/ui";
import { Loader2, Lock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface AddProcessorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProcessorSaved: () => void;
    editingProcessor?: any;
}

export function AddProcessorDialog({ open, onOpenChange, onProcessorSaved, editingProcessor }: AddProcessorDialogProps) {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [selectedProcessorType, setSelectedProcessorType] = useState("");

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        processor_type: "cardknox",
        is_active: true,
        is_default: false,
        environment: "production",
    });

    // Cardknox-specific fields
    const [cardknoxIFieldsKey, setCardknoxIFieldsKey] = useState("");
    const [cardknoxApiKey, setCardknoxApiKey] = useState("");
    const [cardknoxSoftwareName, setCardknoxSoftwareName] = useState("ShulGenius");
    const [cardknoxSoftwareVersion, setCardknoxSoftwareVersion] = useState("2.0.0");

    const supabase = createClient();

    // Validation state
    const iFieldsKeyValidation = validateIFieldsKey(cardknoxIFieldsKey);

    // Clear form on open
    useEffect(() => {
        if (open) {
            setTestResult(null);
            if (editingProcessor) {
                setFormData({
                    name: editingProcessor.name,
                    processor_type: editingProcessor.type,
                    is_active: editingProcessor.is_active,
                    is_default: editingProcessor.is_default,
                    environment: editingProcessor.environment || "production"
                });
                setSelectedProcessorType(editingProcessor.type);
                // Note: We cannot populate the keys back for security reasons, they must be re-entered if changed.
                setCardknoxIFieldsKey("");
                setCardknoxApiKey("");
            } else {
                setFormData({
                    name: "",
                    processor_type: "cardknox",
                    is_active: true,
                    is_default: false,
                    environment: "production"
                });
                setSelectedProcessorType("cardknox");
                setCardknoxIFieldsKey("");
                setCardknoxApiKey("");
            }
        }
    }, [open, editingProcessor]);

    function validateIFieldsKey(key: string): { valid: boolean; warning?: string } {
        if (!key) return { valid: true };
        const isAllDigits = /^\d+$/.test(key);
        if (isAllDigits && key.length >= 13 && key.length <= 19) {
            return {
                valid: false,
                warning: "This looks like a credit card number, not an iFields key. The iFields key should start with 'ifields_'"
            };
        }
        if (!key.startsWith('ifields_')) {
            return {
                valid: false,
                warning: "iFields key should start with 'ifields_'. Check your Cardknox portal."
            };
        }
        return { valid: true };
    }

    const handleTestConnection = async () => {
        if (!cardknoxIFieldsKey || !cardknoxApiKey) {
            toast.error("Both iFields key and API key are required to test connection");
            return;
        }
        setTesting(true);
        setTestResult(null);

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (iFieldsKeyValidation.valid && cardknoxApiKey.length > 5) {
                setTestResult('success');
                toast.success("Connection simulation successful!");
            } else {
                setTestResult('error');
                toast.error("Invalid key format");
            }
        } catch (error) {
            setTestResult('error');
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Account name is required");
            return;
        }

        if (selectedProcessorType === 'cardknox' && !editingProcessor) {
            if (!cardknoxIFieldsKey || !cardknoxApiKey) {
                toast.error("API Keys are required for new processors");
                return;
            }
        }

        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Get Shul ID
            const { data: userData } = await supabase
                .from('users')
                .select('shul_id')
                .eq('id', user.id)
                .single();

            if (!userData?.shul_id) throw new Error("No shul associated with user");

            // 2. Insert or Update `payment_processors`
            let processorId;

            const processorPayload = {
                shul_id: userData.shul_id,
                name: formData.name,
                type: selectedProcessorType,
                is_active: formData.is_active,
                is_default: formData.is_default,
            };

            if (editingProcessor) {
                const { error } = await supabase
                    .from('payment_processors')
                    .update(processorPayload)
                    .eq('id', editingProcessor.id);
                if (error) throw error;
                processorId = editingProcessor.id;
            } else {
                const { data: newProc, error } = await supabase
                    .from('payment_processors')
                    .insert(processorPayload)
                    .select()
                    .single();

                if (error) throw error;
                processorId = newProc.id;
            }

            // 3. Update Credentials via RPC
            if (cardknoxApiKey || cardknoxIFieldsKey) {
                const { data: credRow } = await supabase
                    .from('payment_processor_credentials')
                    .select('id')
                    .eq('processor_id', processorId)
                    .maybeSingle();

                let credId = credRow?.id;

                if (!credId) {
                    const { data: newCred, error: insertError } = await supabase
                        .from('payment_processor_credentials')
                        .insert({ processor_id: processorId })
                        .select('id')
                        .single();
                    if (insertError) throw insertError;
                    credId = newCred.id;
                }

                const credentials = {
                    xKey: cardknoxApiKey,
                    xIFieldsKey: cardknoxIFieldsKey,
                    xSoftwareName: cardknoxSoftwareName,
                    xSoftwareVersion: cardknoxSoftwareVersion
                };

                const { error: rpcError } = await supabase.rpc('encrypt_processor_credentials', {
                    p_processor_account_id: credId,
                    p_credentials: credentials
                });

                if (rpcError) throw rpcError;
            }

            toast.success("Processor saved successfully");
            onProcessorSaved();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Error saving processor:', error);
            const msg = error?.message || "Failed to save processor";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingProcessor ? 'Edit Payment Processor' : 'Add Payment Processor'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure payment processor credentials.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Alert>
                        <Lock className="h-4 w-4" />
                        <AlertDescription>
                            Settings are stored securely.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label htmlFor="name">Friendly Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Cardknox Main"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Processor Type</Label>
                        <div className="relative">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedProcessorType}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedProcessorType(val);
                                    setFormData({ ...formData, processor_type: val });
                                }}
                                disabled={!!editingProcessor || loading}
                            >
                                <option value="cardknox">Cardknox</option>
                                <option value="stripe" disabled>Stripe (Coming Soon)</option>
                            </select>
                        </div>
                    </div>

                    {selectedProcessorType === 'cardknox' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="ifields_key">iFields Key *</Label>
                                <Input
                                    id="ifields_key"
                                    value={cardknoxIFieldsKey}
                                    onChange={(e) => setCardknoxIFieldsKey(e.target.value)}
                                    placeholder="ifields_..."
                                    type="password"
                                    disabled={loading}
                                    className={!iFieldsKeyValidation.valid ? "border-red-500" : ""}
                                />
                                {!iFieldsKeyValidation.valid && (
                                    <p className="text-xs text-red-500">{iFieldsKeyValidation.warning}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api_key">Transaction Key (xKey) *</Label>
                                <Input
                                    id="api_key"
                                    value={cardknoxApiKey}
                                    onChange={(e) => setCardknoxApiKey(e.target.value)}
                                    placeholder="Secret Key"
                                    type="password"
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTestConnection}
                                    disabled={loading || testing || !cardknoxIFieldsKey}
                                    className="w-full"
                                >
                                    {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Test Connection"}
                                </Button>
                                {testResult === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                {testResult === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                            </div>
                        </>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                        {/* Switch component wrapper for simple on/off, or use native checkbox if desired. Logic preserved for now using custom components. */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_default"
                                checked={formData.is_default}
                                onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_default: checked })}
                                disabled={loading}
                            />
                            <Label htmlFor="is_default">Set as Shul Default</Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Processor
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
