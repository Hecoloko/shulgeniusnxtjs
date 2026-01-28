// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CARDKNOX_API_BASE = "https://x1.cardknox.com/gateway";

/**
 * Cardknox Charge Edge Function
 * 
 * Processes a payment using a saved payment method or new token.
 * 
 * Input: {
 *   processor_id: string,
 *   person_id?: string,
 *   method_id?: string,        // Use saved method
 *   token?: string,            // Or use new token
 *   amount: number,
 *   invoice_id?: string,
 *   campaign_id?: string,
 *   description?: string,
 *   idempotency_key?: string   // For duplicate prevention
 * }
 * 
 * Output: { 
 *   success: boolean,
 *   transaction_id: string,
 *   payment_id: string,
 *   status: string 
 * }
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("cardknox-charge: Request received");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const {
            processor_id,
            person_id,
            method_id,
            token,
            amount,
            invoice_id,
            campaign_id,
            description,
            idempotency_key
        } = body;

        // Validation
        if (!processor_id) throw new Error("Missing processor_id");
        if (!amount || amount <= 0) throw new Error("Invalid amount");
        if (!method_id && !token) throw new Error("Must provide method_id or token");

        // Check for duplicate transaction (idempotency)
        if (idempotency_key) {
            const { data: existing } = await supabase
                .from('payment_transactions')
                .select('id, status, external_transaction_id')
                .eq('shul_id', (await supabase.from('payment_processors').select('shul_id').eq('id', processor_id).single()).data?.shul_id)
                .eq('request_payload->>idempotency_key', idempotency_key)
                .single();

            if (existing && existing.status === 'approved') {
                console.log(`cardknox-charge: Duplicate transaction found ${existing.external_transaction_id}`);
                return new Response(JSON.stringify({
                    success: true,
                    transaction_id: existing.external_transaction_id,
                    payment_id: existing.id,
                    status: 'approved',
                    duplicate: true
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Get processor details
        const { data: processor, error: processorError } = await supabase
            .from('payment_processors')
            .select('id, shul_id, type')
            .eq('id', processor_id)
            .single();

        if (processorError || !processor) {
            throw new Error("Processor not found");
        }

        // Get credentials
        const { data: credentials, error: credError } = await supabase
            .from('payment_processor_credentials')
            .select('transaction_key, software_name, software_version')
            .eq('processor_id', processor_id)
            .single();

        if (credError || !credentials || !credentials.transaction_key) {
            throw new Error("Processor credentials not found");
        }

        // Get payment token
        let paymentToken: string;
        let paymentMethod: any = null;

        if (method_id) {
            // Use saved method
            const { data: method, error: methodError } = await supabase
                .from('payment_methods')
                .select('*, customer:payment_customers(*)')
                .eq('id', method_id)
                .eq('is_active', true)
                .single();

            if (methodError || !method) {
                throw new Error("Payment method not found or inactive");
            }

            paymentToken = method.external_token;
            paymentMethod = method;
        } else {
            // Use provided token
            paymentToken = token;
        }

        // Build Cardknox payment request
        const amountCents = Math.round(amount * 100);
        const paymentRequest: Record<string, any> = {
            xKey: credentials.transaction_key,
            xVersion: '5.0.0',
            xSoftwareName: credentials.software_name || 'ShulGenius',
            xSoftwareVersion: credentials.software_version || '2.0.0',
            xCommand: 'cc:Sale',
            xAmount: (amountCents / 100).toFixed(2),
            xToken: paymentToken,
        };

        // Add invoice reference if provided
        if (invoice_id) {
            paymentRequest.xInvoice = invoice_id.substring(0, 20);
        }
        if (description) {
            paymentRequest.xDescription = description.substring(0, 64);
        }

        console.log(`cardknox-charge: Processing $${paymentRequest.xAmount} charge...`);

        // Log transaction attempt
        const { data: transactionLog, error: logError } = await supabase
            .from('payment_transactions')
            .insert({
                shul_id: processor.shul_id,
                person_id: person_id,
                processor_id: processor_id,
                payment_method_id: method_id,
                invoice_id: invoice_id,
                amount: amount,
                status: 'processing',
                card_brand: paymentMethod?.brand,
                card_last4: paymentMethod?.last4,
                request_payload: { ...paymentRequest, xKey: '[REDACTED]', xToken: '[REDACTED]', idempotency_key }
            })
            .select()
            .single();

        if (logError) {
            console.error("cardknox-charge: Failed to log transaction", logError);
        }

        // Make payment request
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(paymentRequest)) {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        }

        const response = await fetch(CARDKNOX_API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
        });

        const responseText = await response.text();
        const result: Record<string, string> = {};
        new URLSearchParams(responseText).forEach((value, key) => {
            result[key] = value;
        });

        console.log(`cardknox-charge: Response - Result: ${result.xResult}, RefNum: ${result.xRefNum}`);

        // Determine success
        const isApproved = result.xResult === 'A';
        const status = isApproved ? 'approved' : (result.xResult === 'D' ? 'declined' : 'error');

        // Update transaction log
        if (transactionLog) {
            await supabase
                .from('payment_transactions')
                .update({
                    status: status,
                    external_transaction_id: result.xRefNum,
                    external_batch_id: result.xBatch,
                    response_code: result.xResultCode,
                    response_message: result.xError || result.xStatus,
                    avs_result: result.xAvsResultCode,
                    cvv_result: result.xCvvResultCode,
                    response_payload: result
                })
                .eq('id', transactionLog.id);
        }

        if (isApproved) {
            // Create payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    shul_id: processor.shul_id,
                    person_id: person_id,
                    amount: amount,
                    processor_fee: parseFloat(result.xFee || '0'),
                    payment_date: new Date().toISOString().split('T')[0],
                    method: paymentMethod?.type === 'ach' ? 'ach' : 'card',
                    processor_id: processor_id,
                    transaction_id: result.xRefNum,
                    idempotency_key: idempotency_key,
                    invoice_ids: invoice_id ? [invoice_id] : null,
                    status: 'completed',
                    notes: description
                })
                .select()
                .single();

            if (paymentError) {
                console.error("cardknox-charge: Failed to create payment record", paymentError);
            }

            // Update invoice balance if applicable
            if (invoice_id && payment) {
                const { data: invoice } = await supabase
                    .from('invoices')
                    .select('balance, total_amount')
                    .eq('id', invoice_id)
                    .single();

                if (invoice) {
                    const newBalance = Math.max(0, (invoice.balance || invoice.total_amount) - amount);
                    const newStatus = newBalance === 0 ? 'paid' : 'partial';

                    await supabase
                        .from('invoices')
                        .update({
                            balance: newBalance,
                            status: newStatus,
                            paid_at: newBalance === 0 ? new Date().toISOString() : null
                        })
                        .eq('id', invoice_id);
                }

                // Link payment to transaction
                if (payment && transactionLog) {
                    await supabase
                        .from('payment_transactions')
                        .update({ payment_id: payment.id })
                        .eq('id', transactionLog.id);
                }
            }

            return new Response(JSON.stringify({
                success: true,
                transaction_id: result.xRefNum,
                payment_id: payment?.id,
                status: 'approved',
                message: 'Payment processed successfully'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            // Payment failed
            return new Response(JSON.stringify({
                success: false,
                status: status,
                error: result.xError || result.xStatus || 'Payment declined',
                response_code: result.xResultCode
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error: any) {
        console.error("cardknox-charge: Error", error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || "Payment processing failed"
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
