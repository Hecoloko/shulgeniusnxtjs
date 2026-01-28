"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/utils/animations";

const testimonials = [
    {
        quote: "Honestly, I used to dread the first of the month. Billing took me three days. Now? It takes 15 minutes. ShulGenius is a lifesaver.",
        author: "Rabbi Y. Goldstein",
        role: "Gabbai, Kehillas Heichal HaTorah",
        location: "Lakewood, NJ"
    },
    {
        quote: "The seating module alone is worth the price. We managed our entire Yamim Noraim seating chart without a single argument or double booking.",
        author: "David Cohen",
        role: "President, Young Israel of West Side",
        location: "New York, NY"
    },
    {
        quote: "Our members love the portal. They can pay aliyos immediately and update their own info. It makes us look professional and organized.",
        author: "Moshe Levi",
        role: "Administrator, Sephardic Center",
        location: "Miami, FL"
    }
];

export default function Testimonials() {
    return (
        <section id="testimonials" className="py-24 bg-transparent relative overflow-hidden z-10">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-stone-300/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="space-y-16"
                >
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-4xl font-bold font-serif text-stone-900">
                            Trusted by <span className="text-amber-600">Gabbais</span> Everywhere
                        </h2>
                        <p className="text-xl text-stone-600">
                            Don't just take our word for it. Hear from the communities we serve.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <TestimonialCard key={i} {...t} />
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}

function TestimonialCard({ quote, author, role, location }: any) {
    return (
        <motion.div
            variants={fadeInUp}
            className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-stone-100/50 relative"
        >
            <Quote className="absolute top-8 left-8 w-12 h-12 text-amber-100 -z-0" />

            <div className="relative z-10 space-y-6">
                <p className="text-stone-700 italic text-lg leading-relaxed">
                    "{quote}"
                </p>

                <div className="border-t border-stone-100 pt-6">
                    <div className="font-bold font-serif text-stone-900">{author}</div>
                    <div className="text-sm text-amber-600 font-medium">{role}</div>
                    <div className="text-xs text-stone-400 mt-1">{location}</div>
                </div>
            </div>
        </motion.div>
    );
}
