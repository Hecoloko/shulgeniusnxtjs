"use client";

import { motion } from "framer-motion";

const brands = [
    { name: "Cardknox", color: "bg-blue-500" },
    { name: "QuickBooks", color: "bg-green-500" },
    { name: "Stripe", color: "bg-indigo-500" },
    { name: "Plaid", color: "bg-red-500" },
    { name: "Twilio", color: "bg-red-400" },
    { name: "Google", color: "bg-blue-400" }
];

export default function TrustedBy() {
    return (
        <section className="py-12 bg-transparent border-y border-stone-200/50 relative z-10">
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">

                <div className="text-stone-400 font-medium text-sm uppercase tracking-widest leading-none">
                    Trusted Integration Partners
                </div>

                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 grayscale hover:grayscale-0 transition-all duration-500">
                    {brands.map((brand, i) => (
                        <div key={i} className="flex items-center gap-2 group cursor-default">
                            {/* Fake Logo Icon */}
                            <div className={`w-6 h-6 rounded-md ${brand.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold`}>
                                {brand.name[0]}
                            </div>
                            <span className="text-xl font-bold text-stone-300 group-hover:text-stone-600 transition-colors">
                                {brand.name}
                            </span>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
