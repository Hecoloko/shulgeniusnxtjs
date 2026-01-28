'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase Admin Client (for RPC calls requiring permission)
// Note: In Server Actions, we should verify specific user permissions via auth.getUser().
// But strictly speaking, the RPC itself checks permissions (SECURITY DEFINER).
// So we can use a client that passes the user's auth token, OR simple admin client if logic mimics it.
// Best practice: Use `createServerClient` from `@supabase/ssr` to pass cookies. 
// However, since we don't have `@supabase/ssr` fully configured with cookie handling boilerplate here yet,
// we will stick to the pattern of standard Supabase client with Service Role if necessary, 
// OR better, create a client that inherits the user's session if possible.
// Given the constraints and setup, I'll use the environment variables to creating a standard client
// but typically you want 'cookies' to be passed.
// I'll assume for now we can just use the Service Key for the ACTION, but the RPC does the check using `auth.uid()`.
// This is a conflict: Service Role bypasses RLS/Auth checks usually or masquerades.
// The PROPER way in Next.js 14+ is using `createClient` from user cookies.
// Since I cannot easy verify the `utils/supabase/server.ts` existence, I will use a direct fetch or generic logic.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // We need this for admin actions if we don't have cookie auth setup

// Schema
const LineItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    item_id: z.string().optional(), // If selecting from preset items
    campaign_id: z.string().optional(),
});

const CreateInvoiceSchema = z.object({
    shul_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    due_date: z.string().optional(), // ISO Date string
    notes: z.string().optional(),
    send_email: z.boolean().default(false),
    line_items: z.array(LineItemSchema).min(1, 'At least one line item is required'),
});

export async function createInvoiceAction(prevState: any, formData: FormData) {
    try {
        // Extract and Validate Data
        // Start by constructing the object from formData
        // (Handling dynamic line items from FormData is tricky, usually better to bind args or pass JSON)
        // For this Action, I will assume it receives the raw object if called from client via `bind` or similar library,
        // or we parse complex formData. 
        // SIMPLIFICATION: This function will accept the exact object, 
        // and the client component `useFormState` might need adaptation. 
        // I'll define it to take the raw JS object for easier consumption from Client Component.
        throw new Error("Use createInvoiceJsonAction for JSON payload");
    } catch (e) {
        return { error: 'Invalid calling convention' };
    }
}

// Server Action accepting JSON (easier for dynamic arrays than FormData)
export async function createInvoiceJsonAction(data: z.infer<typeof CreateInvoiceSchema>) {
    // 1. Validate Input
    const result = CreateInvoiceSchema.safeParse(data);
    if (!result.success) {
        return { error: 'Validation failed', details: result.error.flatten() };
    }

    // 2. Perform DB Call
    // We cannot easily use `auth.uid()` unless we pass the user token or use cookie client.
    // I made the RPC require `user_roles` check on `auth.uid()`.
    // IF I use Service Key, `auth.uid()` is null or admin.
    // Workaround for prototype: Pass `user_id` explicitly? No, unsafe.
    // Solution: If using Service Key, I must manually check logic or implement `supabase/ssr`.
    // Let's assume for this MVP we use Service Key and rely on the Server Action to be secure 
    // (Next.js Server Actions are POST endpoints).

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // We need to spoof the user for RLS? Or just trust the action?
    // The RPC `generate_invoice` calls `auth.uid()`.
    // If I call it with Service Role, RLS is bypassed, but `v_user_id := auth.uid()` will be NULL.
    // And the permission check `WHERE user_id = auth.uid()` will FAIL.
    // FIX: I should have written the RPC to allow a param or handle service role.
    // OR: I use `supabase.auth.admin.getUserById` concept? No.

    // BEST FIX FOR NOW: Modify the RPC call to mock the user? 
    // Or use the `global` headers to pass the user JWT if available on client and passed to server?
    // Let's use the standard `createClient` with the anon key and global authorization header if we can get it,
    // but in Server Action getting the header is hard without cookies.

    // ALTERNATIVE: Rewrite this action to use a DIRECT DB INSERT for now?
    // No, I want to use the RPC.

    // Hack for MVP Local Preview:
    // I will use `supabase.rpc()` with the Service Role, 
    // BUT I will temporarily bypass the RPC permission check logic or assuming the RPC works if called by superuser.
    // The RPC has: `IF NOT EXISTS (...) RAISE EXCEPTION`.
    // If I run as Service Role (superuser), it might bypass RLS but the explicit `IF` block inside PLPGSQL 
    // checks `auth.uid()`. It will fail.

    // Changing strategy: I will modify the RPC call to `rpc('generate_invoice', { ... })`
    // using a client that has the valid user session.
    // Since I don't have the cookies setup convenient here, 
    // I'll make the dialog call Supabase DIRECTLY from the Client (using the library).
    // This is valid pattern too, especially since I enabled RLS and RPC security.
    // Server Actions are great, but setting up the auth context without the full scaffolding is risky.
    // I will implement `CreateInvoiceDialog` to call `supabase.rpc()` directly.
    // This is consistent with how `CardknoxPaymentForm` calls the edge function.

    return { error: "Please use client-side RPC call for this MVP setup" };
}
