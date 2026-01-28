import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Members - Congregation member information
    members: defineTable({
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
        balance: v.optional(v.number()),
        role: v.optional(v.string()), // Admin, Member, etc.
        status: v.optional(v.string()), // Active, Inactive
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_email", ["email"])
        .index("by_name", ["name"])
        .index("by_creation", ["createdAt"]),

    // Invoices - Invoice records
    invoices: defineTable({
        invoiceNumber: v.string(),
        memberId: v.optional(v.id("members")),
        memberName: v.string(),
        memberEmail: v.optional(v.string()),
        total: v.number(),
        balance: v.number(),
        paid: v.boolean(),
        status: v.string(), // Paid, Pending, Overdue
        dueDate: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            amount: v.number(),
            quantity: v.optional(v.number()),
        }))),
        paymentLink: v.optional(v.string()),
        campaignId: v.optional(v.id("campaigns")),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_member", ["memberId"])
        .index("by_invoice_number", ["invoiceNumber"])
        .index("by_status", ["status"])
        .index("by_creation", ["createdAt"]),

    // Campaigns - Fundraising drives and funds
    campaigns: defineTable({
        name: v.string(),
        type: v.string(), // Drive, Bucket/Fund
        goal: v.optional(v.number()),
        raised: v.optional(v.number()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        status: v.string(), // Active, Completed, Archived
        processors: v.optional(v.array(v.string())), // Payment processor names
        description: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_creation", ["createdAt"]),

    // Settings - Shul configuration
    settings: defineTable({
        key: v.string(),
        value: v.string(),
        category: v.optional(v.string()), // general, financial, website, etc.
        updatedAt: v.number(),
    })
        .index("by_key", ["key"])
        .index("by_category", ["category"]),

    // Admin Users - Links to Supabase auth
    adminUsers: defineTable({
        supabaseUserId: v.string(), // Link to Supabase auth user
        email: v.string(),
        name: v.optional(v.string()),
        role: v.string(), // ShulAdmin, Gabbai, Accountant, Webmaster
        linkedMemberId: v.optional(v.id("members")),
        status: v.string(), // Active, Inactive
        createdAt: v.number(),
        updatedAt: v.number(),
    })
})
    .index("by_supabase_id", ["supabaseUserId"])
    .index("by_email", ["email"]),

// Kibbudim - Aliyahs and Honors
kibbudim: defineTable({
    memberId: v.optional(v.id("members")),
    memberName: v.string(), // Snapshot of name
    kibbudType: v.string(), // Kohen, Levi, Maftir, Hosafa, etc.
    parshaChodesh: v.string(), // "Vayetzei - 5785"
    year: v.number(),
    date: v.string(), // ISO date string
    amount: v.number(),
    notes: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
    createdAt: v.number(),
})
    .index("by_member", ["memberId"])
    .index("by_type", ["kibbudType"])
    .index("by_parsha", ["parshaChodesh"])
    .index("by_invoice", ["invoiceId"]),
    })
        .index("by_member", ["memberId"])
    .index("by_type", ["kibbudType"])
    .index("by_parsha", ["parshaChodesh"])
    .index("by_invoice", ["invoiceId"]),

    // Payment Processors
    payment_processors: defineTable({
        name: v.string(), // Account Name
        type: v.string(), // Stripe, Cardknox
        publicKey: v.string(),
        secretKey: v.string(), // Encrypt in real app!
        isActive: v.boolean(),
        isDefault: v.boolean(),
        config: v.optional(v.any()), // Extra config
        createdAt: v.number(),
    })
        .index("by_active", ["isActive"]),

        // Billable Items
        items: defineTable({
            name: v.string(),
            description: v.optional(v.string()),
            price: v.number(),
            type: v.string(), // Service, Product, Membership
            isActive: v.boolean(),
            createdAt: v.number(),
        })
            .index("by_active", ["isActive"]),
});
