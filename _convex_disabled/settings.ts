import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get a setting by key
export const get = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        const setting = await ctx.db
            .query("settings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
        return setting ? JSON.parse(setting.value) : null;
    },
});

// Update or create a setting
export const update = mutation({
    args: {
        key: v.string(),
        value: v.any(), // We'll accept any JSON-serializable object
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("settings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();

        const valueStr = JSON.stringify(args.value);

        if (existing) {
            await ctx.db.patch(existing._id, {
                value: valueStr,
                category: args.category,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("settings", {
                key: args.key,
                value: valueStr,
                category: args.category,
                updatedAt: Date.now(),
            });
        }
    },
});

// Get all settings in a category
export const getByCategory = query({
    args: { category: v.string() },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("settings")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .collect();

        // Return as key-value map
        const result: Record<string, any> = {};
        settings.forEach(s => {
            try {
                result[s.key] = JSON.parse(s.value);
            } catch (e) {
                result[s.key] = s.value;
            }
        });
        return result;
    },
});
