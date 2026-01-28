// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
    invoiceId: string;
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Authenticate User
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        const { invoiceId }: EmailRequest = await req.json();
        if (!invoiceId) {
            return new Response(
                JSON.stringify({ error: 'Missing invoiceId' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Fetch Invoice Details
        const { data: invoice, error: invoiceError } = await supabaseClient
            .from('invoices')
            .select(`
                *,
                shuls (name, email_footer, logo_url),
                people (first_name, last_name, email),
                invoice_items (*)
            `)
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoice) {
            return new Response(
                JSON.stringify({ error: 'Invoice not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            );
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
            console.error('RESEND_API_KEY not set');
            return new Response(
                JSON.stringify({ error: 'Email service not configured' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        // Validate Permissions (Ensure user belongs to the shul of the invoice)
        // Note: RLS usually handles this filter, but explicit check is safer for RPC-like actions
        const { data: userRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('shul_id', invoice.shul_id)
            .single();

        if (!userRole) {
            return new Response(
                JSON.stringify({ error: 'Permission denied' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            );
        }

        // Construct Email Content (HTML)
        // Simple HTML template
        const shulName = invoice.shuls.name;
        const total = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total_amount);
        const recipientName = `${invoice.people.first_name} ${invoice.people.last_name}`;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Invoice from ${shulName}</h1>
                <p>Hello ${recipientName},</p>
                <p>A new invoice has been generated for you.</p>
                
                <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Invoice #${invoice.invoice_number}</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #0f172a;">${total}</p>
                    <p>Due Date: ${invoice.due_date || 'Due on Receipt'}</p>
                </div>

                <h3>Line Items:</h3>
                <ul style="list-style: none; padding: 0;">
                    ${invoice.invoice_items.map((item: any) => `
                        <li style="border-bottom: 1px solid #e2e8f0; padding: 10px 0; display: flex; justify-content: space-between;">
                            <span>${item.description} (x${item.quantity})</span>
                            <span>$${item.amount.toFixed(2)}</span>
                        </li>
                    `).join('')}
                </ul>
                
                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                
                <p style="color: #64748b; font-size: 14px;">
                    ${invoice.shuls.email_footer || 'Thank you for your support.'}
                </p>
            </div>
        `;

        // Send Email via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${shulName.replace(/[^a-zA-Z0-9 ]/g, '')} <billing@shulgenius.com>`, // Placeholder sender
                to: [invoice.people.email], // In dev verify this is safe!
                subject: `Invoice #${invoice.invoice_number} from ${shulName}`,
                html: html,
            }),
        });

        const resData = await res.json();

        if (!res.ok) {
            console.error('Resend API Error:', resData);
            return new Response(
                JSON.stringify({ error: 'Failed to send email', details: resData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        // Update Invoice Status
        await supabaseClient
            .from('invoices')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString()
            })
            .eq('id', invoiceId);

        return new Response(
            JSON.stringify({ success: true, id: resData.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: any) {
        console.error('Error in send-invoice-email:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
