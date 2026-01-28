"use client";

import { motion } from "framer-motion";

const stats = [
    { label: "Shuls Managed", value: "100+" },
    { label: "Donations Processed", value: "$15M+" },
    { label: "Active Members", value: "25k" },
    { label: "Uptime", value: "99.9%" },
];

export default function StatsStrip() {
    return (
        <section className="py-10 bg-stone-900/95 backdrop-blur-md text-white border-y border-stone-800 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="text-3xl md:text-4xl font-bold font-serif bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm md:text-base text-stone-400 font-medium uppercase tracking-wide">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
