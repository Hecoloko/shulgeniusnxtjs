// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// Rate limiting (per IP)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    record.count++;
    return true;
}

/**
 * Cardknox Config Edge Function
 * 
 * Returns the iFields key for frontend card tokenization.
 * NEVER returns the transaction key (xKey).
 * 
 * Input: { processor_id: string }
 * Output: { ifieldsKey: string, softwareName: string, softwareVersion: string }
 */
serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Rate limiting
        const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('cf-connecting-ip') || 'unknown';

        if (!checkRateLimit(clientIP)) {
            return new Response(
                JSON.stringify({ error: 'Too many requests' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { processor_id } = await req.json();

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!processor_id || !uuidRegex.test(processor_id)) {
            return new Response(
                JSON.stringify({ error: 'Invalid processor_id' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Verify processor exists and is active
        const { data: processor, error: processorError } = await supabase
            .from('payment_processors')
            .select('id, is_active, shul_id, type')
            .eq('id', processor_id)
            .single();

        if (processorError || !processor) {
            return new Response(
                JSON.stringify({ error: 'Processor not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            );
        }

        if (!processor.is_active) {
            return new Response(
                JSON.stringify({ error: 'Processor not active' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Get credentials
        const { data: credentials, error: credError } = await supabase
            .from('payment_processor_credentials')
            .select('ifields_key, software_name, software_version')
            .eq('processor_id', processor_id)
            .single();

        if (credError || !credentials) {
            console.error('Credentials not found:', credError);
            return new Response(
                JSON.stringify({ error: 'Processor not configured' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        if (!credentials.ifields_key) {
            return new Response(
                JSON.stringify({ error: 'iFields key not configured' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Return ONLY safe config (never transaction_key!)
        return new Response(
            JSON.stringify({
                ifieldsKey: credentials.ifields_key,
                softwareName: credentials.software_name || 'ShulGenius',
                softwareVersion: credentials.software_version || '2.0.0',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: any) {
        console.error('Error in cardknox-config:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Configuration failed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
