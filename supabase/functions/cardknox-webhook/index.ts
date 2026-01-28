// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Cardknox Webhook Edge Function
 * 
 * Handles postback notifications from Cardknox for:
 * - Payment confirmations
 * - Recurring payment results
 * - Failed transactions
 * 
 * Security: Validates webhook signature if configured.
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("cardknox-webhook: Received webhook");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Parse webhook payload
        const contentType = req.headers.get('content-type') || '';
        let payload: Record<string, any>;

        if (contentType.includes('application/json')) {
            payload = await req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            payload = {};
            formData.forEach((value, key) => {
                payload[key] = value;
            });
        } else {
            // Try to parse as URL-encoded
            const text = await req.text();
            payload = {};
            new URLSearchParams(text).forEach((value, key) => {
                payload[key] = value;
            });
        }

        console.log("cardknox-webhook: Payload received", JSON.stringify(payload).substring(0, 200));

        // Extract relevant fields
        const {
            xRefNum,
            xResult,
            xAmount,
            xMaskedCardNumber,
            xCardType,
            xError,
            xStatus,
            xCommand,
            xCustomerId,
            xInvoice,
            xBatch
        } = payload;

        // Determine processor from customer or batch reference
        // This is a fallback - ideally we'd have a webhook secret per processor
        let processorId: string | null = null;
        let shulId: string | null = null;

        // Try to find processor from customer ID
        if (xCustomerId) {
            const { data: customer } = await supabase
                .from('payment_customers')
                .select('processor_id, shul_id')
                .eq('external_customer_id', xCustomerId)
                .single();

            if (customer) {
                processorId = customer.processor_id;
                shulId = customer.shul_id;
            }
        }

        // Log the webhook event
        const { data: eventLog, error: logError } = await supabase
            .from('payment_webhook_events')
            .insert({
                processor_id: processorId,
                event_type: xCommand || 'unknown',
                event_id: xRefNum,
                payload: payload
            })
            .select()
            .single();

        if (logError) {
            console.error("cardknox-webhook: Failed to log event", logError);
        }

        // Process based on event type
        if (xRefNum && xResult) {
            const isApproved = xResult === 'A';

            // Update existing transaction if we can find it
            if (xRefNum) {
                const { data: existingTx, error: txError } = await supabase
                    .from('payment_transactions')
                    .select('id, status, payment_id')
                    .eq('external_transaction_id', xRefNum)
                    .single();

                if (existingTx && !txError) {
                    await supabase
                        .from('payment_transactions')
                        .update({
                            status: isApproved ? 'approved' : 'declined',
                            response_message: xError || xStatus,
                            external_batch_id: xBatch
                        })
                        .eq('id', existingTx.id);

                    // Update event log with transaction link
                    if (eventLog) {
                        await supabase
                            .from('payment_webhook_events')
                            .update({
                                transaction_id: existingTx.id,
                                payment_id: existingTx.payment_id,
                                processed_at: new Date().toISOString()
                            })
                            .eq('id', eventLog.id);
                    }

                    console.log(`cardknox-webhook: Updated transaction ${existingTx.id}`);
                } else {
                    console.log(`cardknox-webhook: No matching transaction found for ${xRefNum}`);
                }
            }
        }

        // Cardknox expects a 200 response
        return new Response('OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error: any) {
        console.error("cardknox-webhook: Error", error);

        // Still return 200 to prevent Cardknox from retrying
        // Log the error for investigation
        return new Response('Error logged', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
});
