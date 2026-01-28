import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all campaigns
export const getCampaigns = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("campaigns")
            .order("desc")
            .collect();
    },
});

// Get active campaigns
export const getActiveCampaigns = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("campaigns")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();
    },
});

// Get single campaign
export const getCampaign = query({
    args: { id: v.id("campaigns") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Create campaign
export const createCampaign = mutation({
    args: {
        name: v.string(),
        type: v.string(),
        goal: v.optional(v.number()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        processors: v.optional(v.array(v.string())),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const campaignId = await ctx.db.insert("campaigns", {
            ...args,
            raised: 0,
            status: "Active",
            createdAt: now,
            updatedAt: now,
        });
        return campaignId;
    },
});

// Update campaign
export const updateCampaign = mutation({
    args: {
        id: v.id("campaigns"),
        name: v.optional(v.string()),
        type: v.optional(v.string()),
        goal: v.optional(v.number()),
        raised: v.optional(v.number()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        status: v.optional(v.string()),
        processors: v.optional(v.array(v.string())),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Delete campaign
export const deleteCampaign = mutation({
    args: { id: v.id("campaigns") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Get campaign stats
export const getCampaignStats = query({
    handler: async (ctx) => {
        const campaigns = await ctx.db
            .query("campaigns")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        const totalGoal = campaigns.reduce((sum, camp) => sum + (camp.goal || 0), 0);
        const totalRaised = campaigns.reduce((sum, camp) => sum + (camp.raised || 0), 0);

        // Count drives vs buckets
        const drives = campaigns.filter(c => c.type === "Drive").length;
        const buckets = campaigns.filter(c => c.type === "Bucket" || c.type === "Fund").length;

        return {
            activeCount: campaigns.length,
            totalGoal,
            totalRaised,
            drives,
            buckets,
        };
    },
});
