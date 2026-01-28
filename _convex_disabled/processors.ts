
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("payment_processors").collect();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        type: v.string(),
        publicKey: v.string(),
        secretKey: v.string(),
        isDefault: v.boolean(),
    },
    handler: async (ctx, args) => {
        // If setting as default, unset others (simplified logic)
        if (args.isDefault) {
            const all = await ctx.db.query("payment_processors").collect();
            for (const p of all) {
                if (p.isDefault) {
                    await ctx.db.patch(p._id, { isDefault: false });
                }
            }
        }

        return await ctx.db.insert("payment_processors", {
            ...args,
            isActive: true,
            createdAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("payment_processors") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("payment_processors"),
        isDefault: v.optional(v.boolean()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;

        if (updates.isDefault) {
            const all = await ctx.db.query("payment_processors").collect();
            for (const p of all) {
                if (p.isDefault && p._id !== id) {
                    await ctx.db.patch(p._id, { isDefault: false });
                }
            }
        }

        await ctx.db.patch(id, updates);
    },
});
