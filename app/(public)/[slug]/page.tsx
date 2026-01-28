"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Calendar, Users, ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ScheduleSection from "./_components/ScheduleSection";

interface ShulData {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    email: string | null;
    settings: any;
}

export default function ShulPublicHome() {
    const params = useParams();
    const slug = params.slug as string;
    const [shul, setShul] = useState<ShulData | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        const fetchShul = async () => {
            if (!slug) return;

            const { data } = await supabase
                .from("shuls")
                .select("*")
                .eq("slug", slug.toLowerCase())
                .single();

            if (data) setShul(data);
            setLoading(false);
        };

        fetchShul();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!shul) return null;

    const settings = shul.settings || {};
    const tagline = settings.tagline || "A Place of Prayer & Community";
    const donationsEnabled = settings.publicPages?.enableDonations !== false;

    const features = [
        {
            icon: Calendar,
            title: "Schedule",
            description: "View our daily prayer times and upcoming events",
            href: `#schedule`,
            color: "bg-blue-100 text-blue-600",
        },
        donationsEnabled && {
            icon: Heart,
            title: "Donate",
            description: "Support our mission with a tax-deductible contribution",
            href: `/s/${slug}/donate`,
            color: "bg-amber-100 text-amber-600",
        },
        {
            icon: Users,
            title: "Community",
            description: "Join our vibrant and welcoming community",
            href: `/s/${slug}/portal`,
            color: "bg-green-100 text-green-600",
        },
    ].filter(Boolean);

    return (
        <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
                <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        {shul.logo_url && (
                            <motion.img
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                src={shul.logo_url}
                                alt={shul.name}
                                className="h-24 w-24 rounded-full object-cover mx-auto mb-6 ring-4 ring-white/20"
                            />
                        )}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
                        >
                            Welcome to{" "}
                            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                                {shul.name}
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl md:text-2xl text-stone-300 mb-8"
                        >
                            {tagline}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap justify-center gap-4"
                        >
                            {donationsEnabled && (
                                <Link
                                    href={`/s/${slug}/donate`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-full transition-all hover:scale-105"
                                >
                                    <Heart className="w-5 h-5" />
                                    Make a Donation
                                </Link>
                            )}
                            <a
                                href="#schedule"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-all border border-white/20"
                            >
                                <Calendar className="w-5 h-5" />
                                View Schedule
                            </a>
                        </motion.div>
                    </motion.div>
                </div>
                {/* Wave decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 text-stone-50">
                        <path d="M0,120 C300,60 900,100 1200,80 L1200,120 L0,120 Z" fill="currentColor" />
                    </svg>
                </div>
            </section>

            {/* Feature Cards */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {features.map((feature: any, idx) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                            >
                                <Link
                                    href={feature.href}
                                    className="block p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl border border-stone-100 transition-all group"
                                >
                                    <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-stone-900 mb-2">{feature.title}</h3>
                                    <p className="text-stone-600 mb-4 text-sm">{feature.description}</p>
                                    <span className="text-amber-600 font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Learn more <ArrowRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Schedule Section */}
            <section id="schedule" className="py-16 bg-stone-100">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold text-stone-900 mb-2">Schedule</h2>
                        <p className="text-stone-600">Daily prayers and upcoming events</p>
                    </motion.div>

                    <ScheduleSection shulId={shul.id} />
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-stone-900 mb-6 text-center">Contact Us</h2>
                        <div className="space-y-4">
                            {shul.address && (
                                <div className="flex items-center gap-4 text-stone-600">
                                    <MapPin className="w-5 h-5 text-stone-400 flex-shrink-0" />
                                    <span>{shul.address}, {shul.city}, {shul.state} {shul.zip}</span>
                                </div>
                            )}
                            {shul.phone && (
                                <div className="flex items-center gap-4 text-stone-600">
                                    <Phone className="w-5 h-5 text-stone-400 flex-shrink-0" />
                                    <a href={`tel:${shul.phone}`} className="hover:text-amber-600 transition-colors">
                                        {shul.phone}
                                    </a>
                                </div>
                            )}
                            {shul.email && (
                                <div className="flex items-center gap-4 text-stone-600">
                                    <Mail className="w-5 h-5 text-stone-400 flex-shrink-0" />
                                    <a href={`mailto:${shul.email}`} className="hover:text-amber-600 transition-colors">
                                        {shul.email}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
