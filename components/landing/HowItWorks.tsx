"use client";

import { motion } from "framer-motion";
import { Upload, Users, BarChart3, ArrowRight } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/utils/animations";

const steps = [
    {
        icon: Upload,
        title: "1. Import Data",
        desc: "Upload your existing spreadsheets or connect your legacy database. Our team helps you migrate in minutes, not days."
    },
    {
        icon: Users,
        title: "2. Invite Members",
        desc: "Send personalized invites via email or SMS. Members get their own portal to update info, book seats, and pay dues."
    },
    {
        icon: BarChart3,
        title: "3. Manage with Ease",
        desc: "Watch as payments, reservations, and updates flow in automatically. Spend less time on admin and more on the Kehilla."
    }
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-transparent border-t border-stone-100/50 relative z-10">
            <div className="max-w-7xl mx-auto px-6">

                <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="space-y-16"
                >
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                            Simple Setup
                        </div>
                        <h2 className="text-4xl font-bold font-serif text-stone-900">
                            From Spreadsheet to <span className="text-amber-600">System</span>
                        </h2>
                        <p className="text-xl text-stone-600">
                            Getting started with ShulGenius is easier than you think.
                        </p>
                    </div>

                    <div className="relative grid md:grid-cols-3 gap-12">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-stone-100 -z-10"></div>

                        {steps.map((step, i) => (
                            <StepCard key={i} {...step} index={i} />
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}

function StepCard({ icon: Icon, title, desc, index }: any) {
    return (
        <motion.div
            variants={fadeInUp}
            className="relative bg-white/60 backdrop-blur-md p-6 rounded-2xl text-center group border border-stone-100/50"
        >
            <div className="w-24 h-24 mx-auto bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-sm">
                <Icon className="w-10 h-10 text-amber-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-white font-serif font-bold">
                    {index + 1}
                </div>
            </div>

            <h3 className="text-2xl font-bold font-serif mb-3 text-stone-900">
                {title}
            </h3>
            <p className="text-stone-600 leading-relaxed">
                {desc}
            </p>
        </motion.div>
    );
}
