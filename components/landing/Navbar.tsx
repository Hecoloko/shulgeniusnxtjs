"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                        ? "bg-stone-50/90 backdrop-blur-md shadow-sm py-4"
                        : "bg-transparent py-6"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white font-bold font-serif text-lg">
                            S
                        </div>
                        <span className={`text-xl font-bold font-serif tracking-tight transition-colors ${scrolled ? "text-stone-900" : "text-stone-900"
                            }`}>
                            Shul<span className="text-amber-600">Genius</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <NavLink href="#features" scrolled={scrolled}>Features</NavLink>
                        <NavLink href="#how-it-works" scrolled={scrolled}>How it Works</NavLink>
                        <NavLink href="#testimonials" scrolled={scrolled}>Testimonials</NavLink>
                        <Link
                            href="/login"
                            className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-2.5 rounded-full font-medium transition-all hover:scale-105 shadow-lg shadow-stone-900/20"
                        >
                            Sign In
                        </Link>
                    </nav>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden text-stone-900"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        className="fixed inset-0 z-[60] bg-stone-50 flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-xl font-bold font-serif">Menu</span>
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-6 text-xl font-serif">
                            <Link href="#features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
                            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</Link>
                            <Link href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</Link>
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-amber-600 font-semibold">Sign In</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function NavLink({ href, children, scrolled }: { href: string; children: React.ReactNode; scrolled: boolean }) {
    return (
        <Link
            href={href}
            className={`text-sm font-medium transition-colors hover:text-amber-600 ${scrolled ? "text-stone-600" : "text-stone-700"
                }`}
        >
            {children}
        </Link>
    );
}
