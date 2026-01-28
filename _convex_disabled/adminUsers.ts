import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all admin users
export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("adminUsers").collect();
    },
});

// Create/Invite a new admin
export const invite = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if email already exists
        const existing = await ctx.db
            .query("adminUsers")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existing) throw new Error("User with this email already exists");

        // In a real app, this would trigger an invitation email
        // For now, we just create the record pending auth linkage
        return await ctx.db.insert("adminUsers", {
            email: args.email,
            name: args.name,
            role: args.role,
            status: "Active", // Auto-activate for now
            supabaseUserId: "pending_" + Date.now(), // Placeholder until they log in
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Delete an admin
export const remove = mutation({
    args: { id: v.id("adminUsers") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Update admin role
export const updateRole = mutation({
    args: {
        id: v.id("adminUsers"),
        role: v.string()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            role: args.role,
            updatedAt: Date.now(),
        });
    },
});
