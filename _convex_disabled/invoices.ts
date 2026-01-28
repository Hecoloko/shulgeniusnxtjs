import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all invoices
export const getInvoices = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("invoices")
            .order("desc")
            .collect();
    },
});

// Get single invoice
export const getInvoice = query({
    args: { id: v.id("invoices") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Get invoices by member
export const getInvoicesByMember = query({
    args: { memberId: v.id("members") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("invoices")
            .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
            .collect();
    },
});

// Create invoice
export const createInvoice = mutation({
    args: {
        invoiceNumber: v.string(),
        memberId: v.optional(v.id("members")),
        memberName: v.string(),
        memberEmail: v.optional(v.string()),
        total: v.number(),
        balance: v.number(),
        dueDate: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            amount: v.number(),
            quantity: v.optional(v.number()),
        }))),
        campaignId: v.optional(v.id("campaigns")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const invoiceId = await ctx.db.insert("invoices", {
            ...args,
            paid: args.balance === 0,
            status: args.balance === 0 ? "Paid" : "Pending",
            createdAt: now,
            updatedAt: now,
        });
        return invoiceId;
    },
});

// Update invoice
export const updateInvoice = mutation({
    args: {
        id: v.id("invoices"),
        balance: v.optional(v.number()),
        paid: v.optional(v.boolean()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Get invoice stats
export const getInvoiceStats = query({
    handler: async (ctx) => {
        const invoices = await ctx.db.query("invoices").collect();

        const totalPledged = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + (inv.total - inv.balance), 0);
        const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0);

        return {
            totalPledged,
            totalPaid,
            totalBalance,
            invoiceCount: invoices.length,
        };
    },
});
