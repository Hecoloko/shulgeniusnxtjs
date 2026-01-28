// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CARDKNOX_API_BASE = "https://api.cardknox.com/v2";

/**
 * Cardknox Customer Edge Function
 * 
 * Creates or retrieves a customer in Cardknox for the specified person.
 * Each person has ONE customer per processor (isolated merchant accounts).
 * 
 * Input: { processor_id: string, person_id: string }
 * Output: { customer_id: string, external_customer_id: string, created: boolean }
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("cardknox-customer: Request received");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const { processor_id, person_id, force_create = false } = body;

        if (!processor_id || !person_id) {
            throw new Error("Missing required fields: processor_id, person_id");
        }

        // Check for existing customer (unless force_create)
        if (!force_create) {
            const { data: existingCustomer } = await supabase
                .from('payment_customers')
                .select('id, external_customer_id')
                .eq('processor_id', processor_id)
                .eq('person_id', person_id)
                .single();

            if (existingCustomer) {
                console.log(`cardknox-customer: Found existing customer ${existingCustomer.external_customer_id}`);
                return new Response(JSON.stringify({
                    customer_id: existingCustomer.id,
                    external_customer_id: existingCustomer.external_customer_id,
                    created: false
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Get processor and credentials
        const { data: processor, error: processorError } = await supabase
            .from('payment_processors')
            .select('id, shul_id, type')
            .eq('id', processor_id)
            .single();

        if (processorError || !processor) {
            throw new Error("Processor not found");
        }

        const { data: credentials, error: credError } = await supabase
            .from('payment_processor_credentials')
            .select('recurring_key, transaction_key, software_name, software_version')
            .eq('processor_id', processor_id)
            .single();

        if (credError || !credentials) {
            throw new Error("Processor credentials not found");
        }

        // Use recurring key if available, fall back to transaction key
        const apiKey = credentials.recurring_key || credentials.transaction_key;
        if (!apiKey) {
            throw new Error("No API key configured for processor");
        }

        // Get person details
        const { data: person, error: personError } = await supabase
            .from('people')
            .select('id, first_name, last_name, email, phone, address, city, state, zip')
            .eq('id', person_id)
            .single();

        if (personError || !person) {
            throw new Error("Person not found");
        }

        // Create customer in Cardknox
        const customerNumber = `${processor.shul_id.substring(0, 8)}-${person_id.substring(0, 8)}`;
        const customerPayload = {
            SoftwareName: credentials.software_name || 'ShulGenius',
            SoftwareVersion: credentials.software_version || '2.0.0',
            CustomerNumber: customerNumber,
            Email: person.email || '',
            BillFirstName: person.first_name,
            BillLastName: person.last_name,
            BillStreet: person.address || '',
            BillCity: person.city || '',
            BillState: person.state || '',
            BillZip: person.zip || '',
            BillPhone: person.phone || ''
        };

        console.log(`cardknox-customer: Creating customer in Cardknox...`);

        const response = await fetch(`${CARDKNOX_API_BASE}/CreateCustomer`, {
            method: "POST",
            headers: {
                "Authorization": apiKey,
                "X-Recurring-Api-Version": "2.1",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(customerPayload)
        });

        const result = await response.json();

        // Handle "already exists" gracefully
        if (result.Result === 'Error' && !result.ErrorMessage?.includes('already')) {
            console.error("cardknox-customer: Cardknox API Error", result);
            throw new Error(`Cardknox Error: ${result.ErrorMessage || result.Error || 'Unknown error'}`);
        }

        const externalCustomerId = result.CustomerId;

        if (!externalCustomerId) {
            // Customer might already exist, try to find it
            console.warn("cardknox-customer: No CustomerId returned, customer may already exist");
        }

        // Save to database
        const { data: newCustomer, error: insertError } = await supabase
            .from('payment_customers')
            .upsert({
                shul_id: processor.shul_id,
                person_id: person_id,
                processor_id: processor_id,
                external_customer_id: externalCustomerId || customerNumber,
                external_customer_number: customerNumber,
                email: person.email,
                name: `${person.first_name} ${person.last_name}`.trim(),
                synced_at: new Date().toISOString()
            }, {
                onConflict: 'person_id,processor_id'
            })
            .select('id, external_customer_id')
            .single();

        if (insertError) {
            console.error("cardknox-customer: DB Insert Error", insertError);
            throw new Error("Failed to save customer");
        }

        console.log(`cardknox-customer: Customer created/updated successfully`);

        return new Response(JSON.stringify({
            customer_id: newCustomer!.id,
            external_customer_id: newCustomer!.external_customer_id,
            created: true
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("cardknox-customer: Error", error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || "Unknown error"
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
