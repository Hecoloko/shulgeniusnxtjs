// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
    memberEmail: string;
    memberName: string;
    shulName: string;
    signupUrl: string;
    customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
            console.error("[send-member-invite] Configuration missing", {
                hasResend: !!resendApiKey,
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseServiceKey
            });
            return new Response(
                JSON.stringify({ error: "Server configuration missing (API Keys)" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const resend = new Resend(resendApiKey);

        const { memberEmail, memberName, shulName, signupUrl, customMessage }: InviteRequest = await req.json();

        if (!memberEmail || !memberName || !shulName || !signupUrl) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Processing invite for:", memberEmail);

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from("users") // Note: This refers to Supabase Auth users table if checking auth, but 'users' table in public schema might be different. 
            // Typically we check auth.users via admin API, or public.users if synced.
            // Legacy used 'users' table in public schema likely? 
            // Let's assume there is a public map or we just send the email regardless.
            // Re-reading legacy: It used `supabaseAdmin.from("users")...`. 
            // In This new codebase, we use `people` for members, but `auth.users` for login.
            // We probably don't have access to `auth.users` via `from()` unless we use `auth.admin`.
            // However, legacy might have had a public `users` table. 
            // For now, I'll skip the "Existing User" check to simplify and ALWAYS send the invite link.
            // OR I can try to list users via auth api.
            // Decision: Stick to the legacy code's intent but purely focused on sending the invite.
            // If the user uses the link and already has an account, the login page handles it (redirects).

            // SIMPLIFICATION: Checking if email exists in people table is redundant as we are inviting FROM people table.
            // We just want to know if they have an AUTH account.
            // supabaseAdmin.auth.admin.listUsers() is better but might be heavy.
            // Let's just assume "New User" template for now as it's safer.
            .from("people") // Just checking logic
            .select("id")
            .eq("email", memberEmail)
            .limit(1);

        // Legacy Code actually checked `public.users`? 
        // "const { data: existingUser } = await supabaseAdmin.from("users")..." 
        // If that table doesn't exist in new schema, this will fail.
        // New schema uses `people` linked to auth via `id` or email?
        // Let's use a generic template that works for both cases to avoid DB dependency here.

        // TEMPLATE SELECTION:
        // I will use a slightly modified version of the "New User" template that is generic enough.

        const emailSubject = `${shulName} - You're invited to the Member Portal`;
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">${shulName}</h1>
                  </td>
                </tr>
                
                <!-- Welcome Message -->
                <tr>
                  <td align="center" style="padding: 10px 0 20px;">
                    <p style="margin: 0; color: #374151; font-size: 18px;">Welcome to the Member Portal!</p>
                  </td>
                </tr>
                
                <!-- Member Info Card -->
                <tr>
                  <td style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 5px; font-size: 18px; font-weight: bold; color: #1f2937;">${memberName}</p>
                          <p style="margin: 0; font-size: 14px; color: #6b7280;">
                            E: <a href="mailto:${memberEmail}" style="color: #2563eb; text-decoration: none;">${memberEmail}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td style="height: 15px;"></td></tr>
                
                <!-- Action Card -->
                <tr>
                  <td style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 5px; font-size: 20px; color: #374151;">Member Portal Access</p>
                          <p style="margin: 0 0 15px; font-size: 14px; color: #6b7280;">
                            Click below to access your account. If you don't have one, you'll be prompted to create it.
                          </p>
                          <a href="${signupUrl}" style="display: inline-block; background-color: #1f2937; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">ACCESS MY ACCOUNT</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td style="height: 15px;"></td></tr>
                
                <!-- Features Section -->
                <tr>
                  <td style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 15px; font-size: 16px; color: #374151; font-weight: bold;">With your portal account you can:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 4px;">
                      <tr style="background-color: #f9fafb;">
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #2563eb;">•</span> View your balance and payment history
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #2563eb;">•</span> Pay invoices online
                        </td>
                      </tr>
                      <tr style="background-color: #f9fafb;">
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #2563eb;">•</span> See your subscriptions and payment plans
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 15px;">
                          <span style="color: #2563eb;">•</span> Access your profile information
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                ${customMessage ? `
                <tr><td style="height: 15px;"></td></tr>
                <tr>
                  <td style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 10px; font-size: 16px; color: #374151; font-weight: bold;">Notes</p>
                    <div style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px;">
                      <p style="margin: 0; color: #2563eb; font-size: 14px;">${customMessage}</p>
                    </div>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 30px 20px;">
                    <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280;">
                      If you have any questions, please contact the shul office.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      If the button doesn't work, copy and paste this link:<br>
                      <a href="${signupUrl}" style="color: #2563eb; word-break: break-all;">${signupUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

        const emailResponse = await resend.emails.send({
            from: `ShulGenius <notifications@shulgenius.com>`, // Using generic sender for now, hardcoded to avoid config issues
            // Ideally this should be: `${shulName} <notifications@notifications.shulgenius.com>` but assumes domain verification
            to: [memberEmail],
            subject: emailSubject,
            html: emailHtml,
        });

        console.log("Email sent result:", emailResponse);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Invite sent successfully",
                emailResponse
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    } catch (error: any) {
        console.error("Error processing invite:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Unknown error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
};

serve(handler);
