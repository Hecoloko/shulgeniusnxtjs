"use client";

import { motion } from "framer-motion";
import { Users, CreditCard, Mail, Shield, Zap, Calendar } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/utils/animations";

const features = [
    {
        icon: Users,
        title: "Member Directory",
        desc: "Centralize your community. Track manufacturing families, Yahrzeits, Aliyos history, and seating assignments in one place."
    },
    {
        icon: CreditCard,
        title: "Smart Billing",
        desc: "Automate membership dues, pledge tracking, and building funds. Send professional PDF receipts instantly."
    },
    {
        icon: Calendar,
        title: "Zmanim & Events",
        desc: "Display correct Zmanim for your location. Manage event registrations and ticket sales seamlessly."
    },
    {
        icon: Mail,
        title: "Visual Communications",
        desc: "Send beautiful, branded newsletters and announcements. Stop using generic mass email tools."
    },
    {
        icon: Shield,
        title: "Secure & Private",
        desc: "Enterprise-grade security for your community's sensitive data. Role-based access for Gabbais and Admins."
    },
    {
        icon: Zap,
        title: "Aliyos Tracking",
        desc: "Never forget an Aliyah. Track who got what, when, and ensure equitable distribution of honors."
    }
];

export default function FeatureGrid() {
    return (
        <section id="features" className="py-24 bg-transparent transition-colors relative z-10">
            <div className="max-w-7xl mx-auto px-6">

                <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="space-y-16"
                >
                    <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto space-y-4">
                        <h2 className="text-4xl font-bold font-serif text-stone-900">
                            Powerful Features for <br />
                            <span className="text-amber-600">Growing Kehillos</span>
                        </h2>
                        <p className="text-xl text-stone-600">
                            Everything you need to run your Shul efficiently, from the Cloud.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <FeatureCard key={i} {...feature} />
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
    return (
        <motion.div
            variants={fadeInUp}
            className="group bg-white/60 backdrop-blur-md border border-stone-200/50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-default"
        >
            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors text-amber-600">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-serif mb-3 text-stone-900 group-hover:text-amber-700 transition-colors">
                {title}
            </h3>
            <p className="text-stone-600 leading-relaxed">
                {desc}
            </p>
        </motion.div>
    );
}
