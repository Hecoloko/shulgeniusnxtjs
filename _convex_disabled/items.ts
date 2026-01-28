
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("items").collect();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        price: v.number(),
        type: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("items", {
            ...args,
            isActive: true,
            createdAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("items") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("items"),
        updates: v.object({
            name: v.optional(v.string()),
            price: v.optional(v.number()),
            isActive: v.optional(v.boolean()),
        })
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.updates);
    },
});
