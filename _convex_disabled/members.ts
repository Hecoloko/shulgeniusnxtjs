import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all members
export const getMembers = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("members")
            .order("desc")
            .collect();
    },
});

// Get single member by ID
export const getMember = query({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Search members
export const searchMembers = query({
    args: { searchQuery: v.string() },
    handler: async (ctx, args) => {
        const allMembers = await ctx.db
            .query("members")
            .collect();

        if (!args.searchQuery) return allMembers;

        const query = args.searchQuery.toLowerCase();
        return allMembers.filter(member =>
            member.name.toLowerCase().includes(query) ||
            member.email?.toLowerCase().includes(query) ||
            member.phone?.includes(query)
        );
    },
});

// Create new member
export const createMember = mutation({
    args: {
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        gender: v.optional(v.string()),
        location: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        zip: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
        spouse: v.optional(v.string()),
        jewishInfo: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        role: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const memberId = await ctx.db.insert("members", {
            ...args,
            balance: 0,
            status: args.status || "Active",
            createdAt: now,
            updatedAt: now,
        });
        return memberId;
    },
});

// Update member
export const updateMember = mutation({
    args: {
        id: v.id("members"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        gender: v.optional(v.string()),
        location: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        zip: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
        spouse: v.optional(v.string()),
        jewishInfo: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        role: v.optional(v.string()),
        status: v.optional(v.string()),
        balance: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
        return id;
    },
});

// Delete member
export const deleteMember = mutation({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Get member count
export const getMemberCount = query({
    handler: async (ctx) => {
        const members = await ctx.db.query("members").collect();
        return members.length;
    },
});
