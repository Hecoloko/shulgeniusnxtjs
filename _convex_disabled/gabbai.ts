
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const saveAliyahs = mutation({
    args: {
        parsha: v.string(),
        year: v.string(),
        date: v.string(),
        entries: v.array(v.object({
            type: v.string(), // Aliyah name or "Line Item"
            memberId: v.optional(v.id("members")),
            memberName: v.optional(v.string()),
            amount: v.number(),
            notes: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const { parsha, year, date, entries } = args;

        // 1. Group by member to create single invoice per member
        const groupedByMember = new Map<string, typeof entries>();
        const anonymousEntries: typeof entries = [];

        for (const entry of entries) {
            if (entry.memberId) {
                const existing = groupedByMember.get(entry.memberId) || [];
                existing.push(entry);
                groupedByMember.set(entry.memberId, existing);
            } else {
                anonymousEntries.push(entry);
            }
        }

        const results = [];

        // 2. Process Member Invoices & Kibbudim
        for (const [memberId, memberEntries] of groupedByMember.entries()) {
            const memberName = memberEntries[0].memberName || "Unknown Member";
            const totalAmount = memberEntries.reduce((sum, e) => sum + e.amount, 0);

            // Create Invoice
            // Note: We use a random invoice number generator for now as in the original code
            const invoiceNumber = `ALY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

            const invoiceId = await ctx.db.insert("invoices", {
                invoiceNumber,
                memberId: memberId as any, // Cast because we know it's an ID
                memberName: memberName,
                total: totalAmount,
                balance: totalAmount,
                paid: false,
                status: "Pending",
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                items: memberEntries.map(e => ({
                    name: `${e.type} - ${parsha} ${year}`,
                    amount: e.amount,
                    quantity: 1,
                }))
            });

            // Create Kibbudim Records
            for (const entry of memberEntries) {
                await ctx.db.insert("kibbudim", {
                    memberId: memberId as any,
                    memberName: entry.memberName || memberName,
                    kibbudType: entry.type,
                    parshaChodesh: `${parsha} - ${year}`,
                    year: parseInt(year),
                    date: date,
                    amount: entry.amount,
                    notes: entry.notes,
                    invoiceId: invoiceId,
                    createdAt: Date.now(),
                });
            }

            results.push({ memberId, invoiceId, count: memberEntries.length });
        }

        // 3. Process Anonymous Entries (just Kibbudim, no invoice for now? Or generic invoice?)
        // Legacy behavior often created invoices even without person_id if allowed, or skipped.
        // For now, we'll store them as kibbudim without invoiceId if needed, or skip.
        // Based on logic "rowsWithPerson" in legacy, it skipped anonymous. 
        // We will do the same: skip anonymous for invoice creation but maybe log them?
        // Let's create Kibbudim records for them at least so the Gabbai sees the history?
        // Actually, without a member, it's hard to track. We will skip for now to match legacy behavior which required a selected person.

        return { success: true, processed: results.length };
    },
});
