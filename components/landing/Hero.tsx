"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle, Search, Bell, Menu, Users, CreditCard, Calendar } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
            {/* Grid moved to global BackgroundGrid component */}
            <div className="container relative z-20 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-amber-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        The Operating System for Modern Shuls
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold font-serif leading-[1.1] text-stone-900">
                        Modern Tools for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500">
                            Timeless Communities
                        </span>
                    </h1>

                    <p className="text-xl text-stone-600 leading-relaxed max-w-lg">
                        The complete platform for member management, billing, and community engagement.
                        Built for Gabbais who value time and tradition.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Link
                            href="/login"
                            className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20 hover:shadow-stone-900/30 transition-all hover:-translate-y-1"
                        >
                            Get Started <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button className="bg-white border border-stone-200 text-stone-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-stone-50 transition-all flex items-center justify-center gap-2">
                            View Interactive Demo
                        </button>
                    </div>

                    <div className="pt-6 flex items-center gap-6 text-sm text-stone-500 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-amber-500" />
                            <span>Free Setup</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-amber-500" />
                            <span>Cancel Anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-amber-500" />
                            <span>24/6 Support</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Graphic (Mockup) */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2 transform rotate-y-12 rotate-z-2 hover:rotate-0 transition-transform duration-700">
                        {/* Dashboard UI Simulation */}
                        <div className="rounded-xl overflow-hidden aspect-[4/3] bg-stone-50 relative flex flex-col">

                            {/* Header */}
                            <div className="h-12 border-b border-stone-200 bg-white flex items-center px-4 justify-between">
                                <div className="flex items-center gap-2 text-stone-400">
                                    <Menu className="w-4 h-4" />
                                    <div className="h-4 w-24 bg-stone-100 rounded-md"></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Search className="w-4 h-4 text-stone-400" />
                                    <Bell className="w-4 h-4 text-stone-400" />
                                    <div className="w-6 h-6 rounded-full bg-amber-100"></div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 p-4 grid grid-cols-12 gap-4">
                                {/* Sidebar */}
                                <div className="col-span-2 hidden sm:flex flex-col gap-2">
                                    <div className="h-8 w-full bg-stone-200/50 rounded-md"></div>
                                    <div className="h-8 w-full bg-white border border-stone-100 rounded-md"></div>
                                    <div className="h-8 w-full bg-white border border-stone-100 rounded-md"></div>
                                </div>

                                {/* Main Content */}
                                <div className="col-span-12 sm:col-span-10 flex flex-col gap-4">
                                    {/* Row 1: Stats */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center text-blue-500"><Users className="w-3 h-3" /></div>
                                                <div className="h-2 w-10 bg-stone-100 rounded"></div>
                                            </div>
                                            <div className="h-4 w-12 bg-stone-200 rounded"></div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-green-50 rounded-md flex items-center justify-center text-green-500"><CreditCard className="w-3 h-3" /></div>
                                                <div className="h-2 w-10 bg-stone-100 rounded"></div>
                                            </div>
                                            <div className="h-4 w-16 bg-stone-200 rounded"></div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-purple-50 rounded-md flex items-center justify-center text-purple-500"><Calendar className="w-3 h-3" /></div>
                                                <div className="h-2 w-10 bg-stone-100 rounded"></div>
                                            </div>
                                            <div className="h-4 w-8 bg-stone-200 rounded"></div>
                                        </div>
                                    </div>

                                    {/* Row 2: Chart/Table */}
                                    <div className="flex-1 bg-white rounded-xl border border-stone-100 shadow-sm p-4">
                                        <div className="flex justify-between mb-4">
                                            <div className="h-3 w-20 bg-stone-100 rounded"></div>
                                            <div className="h-3 w-8 bg-stone-50 rounded"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-full bg-stone-50 rounded"></div>
                                            <div className="h-2 w-[90%] bg-stone-50 rounded"></div>
                                            <div className="h-2 w-[95%] bg-stone-50 rounded"></div>
                                            <div className="h-2 w-[85%] bg-stone-50 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute -inset-10 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur-3xl rounded-full z-0"></div>
                </motion.div>

            </div>
        </section>
    );
}
