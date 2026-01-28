// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CARDKNOX_API_BASE = "https://api.cardknox.com/v2";

/**
 * Cardknox Method Edge Function
 * 
 * Saves a payment method (card/ACH) to Cardknox and the database.
 * Auto-creates customer if it doesn't exist.
 * 
 * Input: {
 *   processor_id: string,
 *   person_id: string,
 *   token: string,           // From iFields tokenization
 *   token_type: 'cc' | 'ach',
 *   exp: string,             // MMYY format
 *   last4: string,
 *   brand?: string,
 *   label?: string,
 *   cardholder_name?: string,
 *   is_default?: boolean
 * }
 * 
 * Output: { method_id: string, external_token: string }
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("cardknox-method: Request received");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const {
            processor_id,
            person_id,
            token,
            token_type = 'cc',
            exp,
            last4,
            brand,
            label,
            cardholder_name,
            is_default = false
        } = body;

        // Validation
        if (!processor_id || !person_id || !token) {
            throw new Error("Missing required fields: processor_id, person_id, token");
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
            .select('recurring_key, transaction_key, software_name, software_version')
            .eq('processor_id', processor_id)
            .single();

        if (credError || !credentials) {
            throw new Error("Processor credentials not found");
        }

        const apiKey = credentials.recurring_key || credentials.transaction_key;
        if (!apiKey) {
            throw new Error("No API key configured");
        }

        // Ensure customer exists (auto-create if not)
        let customer: any;
        const { data: existingCustomer } = await supabase
            .from('payment_customers')
            .select('id, external_customer_id')
            .eq('processor_id', processor_id)
            .eq('person_id', person_id)
            .single();

        if (existingCustomer) {
            customer = existingCustomer;
            console.log(`cardknox-method: Using existing customer ${customer.external_customer_id}`);
        } else {
            // Get person details
            const { data: person } = await supabase
                .from('people')
                .select('*')
                .eq('id', person_id)
                .single();

            if (!person) throw new Error("Person not found");

            // Create customer in Cardknox
            const customerNumber = `${processor.shul_id.substring(0, 8)}-${person_id.substring(0, 8)}`;
            const custResponse = await fetch(`${CARDKNOX_API_BASE}/CreateCustomer`, {
                method: "POST",
                headers: {
                    "Authorization": apiKey,
                    "X-Recurring-Api-Version": "2.1",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    SoftwareName: credentials.software_name || 'ShulGenius',
                    SoftwareVersion: credentials.software_version || '2.0.0',
                    CustomerNumber: customerNumber,
                    Email: person.email || '',
                    BillFirstName: person.first_name,
                    BillLastName: person.last_name
                })
            });
            const custResult = await custResponse.json();

            if (custResult.Result === 'Error' && !custResult.ErrorMessage?.includes('already')) {
                throw new Error(`Customer creation failed: ${custResult.ErrorMessage}`);
            }

            // Save customer to DB
            const { data: newCustomer, error: custInsertError } = await supabase
                .from('payment_customers')
                .insert({
                    shul_id: processor.shul_id,
                    person_id: person_id,
                    processor_id: processor_id,
                    external_customer_id: custResult.CustomerId || customerNumber,
                    external_customer_number: customerNumber,
                    email: person.email,
                    name: `${person.first_name} ${person.last_name}`.trim()
                })
                .select()
                .single();

            if (custInsertError) throw custInsertError;
            customer = newCustomer;
            console.log(`cardknox-method: Created new customer ${customer.external_customer_id}`);
        }

        // Create Payment Method in Cardknox
        const methodPayload = {
            SoftwareName: credentials.software_name || 'ShulGenius',
            SoftwareVersion: credentials.software_version || '2.0.0',
            CustomerId: customer.external_customer_id,
            Token: token,
            TokenType: token_type,
            TokenAlias: label || `${brand || 'Card'} *${last4}`,
            Exp: exp?.replace(/\D/g, ''), // Remove formatting
            SetAsDefault: is_default
        };

        console.log(`cardknox-method: Creating payment method in Cardknox...`);

        const methodResponse = await fetch(`${CARDKNOX_API_BASE}/CreatePaymentMethod`, {
            method: "POST",
            headers: {
                "Authorization": apiKey,
                "X-Recurring-Api-Version": "2.1",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(methodPayload)
        });

        const methodResult = await methodResponse.json();

        if (methodResult.Result !== 'S' && methodResult.Result !== 'Success') {
            console.error("cardknox-method: Cardknox API Error", methodResult);
            throw new Error(`Payment method creation failed: ${methodResult.ErrorMessage || methodResult.Error}`);
        }

        // Get the persistent token
        const externalToken = methodResult.Token || methodResult.xToken || methodResult.PaymentMethodId;
        if (!externalToken) {
            throw new Error("No token returned from payment method creation");
        }

        // Map token type to DB enum
        const dbType = token_type === 'cc' ? 'card' : (token_type === 'ach' ? 'ach' : 'card');

        // Parse expiration
        let expMonth: number | null = null;
        let expYear: number | null = null;
        if (exp) {
            const cleanExp = exp.replace(/\D/g, '');
            if (cleanExp.length >= 4) {
                expMonth = parseInt(cleanExp.substring(0, 2));
                expYear = parseInt('20' + cleanExp.substring(2, 4));
            }
        }

        // If setting as default, clear other defaults for this person
        if (is_default) {
            await supabase
                .from('payment_methods')
                .update({ is_default: false })
                .eq('person_id', person_id)
                .eq('processor_id', processor_id);
        }

        // Save to DB
        const { data: newMethod, error: insertError } = await supabase
            .from('payment_methods')
            .insert({
                shul_id: processor.shul_id,
                person_id: person_id,
                processor_id: processor_id,
                customer_id: customer.id,
                external_token: externalToken,
                external_method_id: methodResult.PaymentMethodId,
                type: dbType,
                brand: brand,
                last4: last4,
                exp_month: expMonth,
                exp_year: expYear,
                label: label || `${brand || 'Card'} *${last4}`,
                cardholder_name: cardholder_name,
                is_default: is_default,
                is_active: true
            })
            .select()
            .single();

        if (insertError) {
            console.error("cardknox-method: DB Insert Error", insertError);
            throw new Error("Failed to save payment method");
        }

        console.log(`cardknox-method: Payment method saved successfully`);

        return new Response(JSON.stringify({
            success: true,
            method_id: newMethod!.id,
            external_token: externalToken,
            customer_id: customer.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("cardknox-method: Error", error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || "Unknown error"
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
