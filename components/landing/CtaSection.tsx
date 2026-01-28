"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
    return (
        <section className="py-24 bg-transparent border-t border-stone-100/50 relative z-10">
            <div className="max-w-5xl mx-auto px-6">
                <div className="bg-gradient-to-br from-amber-900 to-stone-900 rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
                            Ready to modernize your Shul?
                        </h2>
                        <p className="text-amber-100 text-xl max-w-2xl mx-auto">
                            Join over 100 communities switching to ShulGenius for better management, happier members, and less stress.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link
                                href="/login"
                                className="bg-white text-stone-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-50 transition-colors shadow-lg flex items-center gap-2"
                            >
                                Start Free Trial <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
                                Schedule Demo
                            </button>
                        </div>
                        <p className="text-sm text-amber-200/60 pt-4">
                            No credit card required for 14-day trial.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
