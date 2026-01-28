import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Simple direct account creation bypassing the provider mess
export const createBasicAccount = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        // Hash password using Convex's built-in Password provider utility
        const hashedPassword = await Password.hashPassword(args.password);

        // Check if user already exists
        const existing = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();

        if (existing) {
            throw new Error("Account already exists");
        }

        // Create user directly
        const userId = await ctx.db.insert("users", {
            email: args.email,
            emailVerified: false,
        });

        // Create auth account
        await ctx.db.insert("authAccounts", {
            userId,
            provider: "password",
            providerAccountId: args.email,
            secret: hashedPassword,
        });

        return { success: true, userId };
    },
});
