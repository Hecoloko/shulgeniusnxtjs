"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    Calendar,
    Home,
    Heart,
    LogIn,
    LogOut,
    User,
    LayoutDashboard,
    Building2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const slug = params.slug as string;

    const [shul, setShul] = useState<ShulData | null>(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [scrolled, setScrolled] = useState(false);

    const supabase = createClient();

    // Track scroll for header styling
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch shul data
    useEffect(() => {
        const fetchShul = async () => {
            if (!slug) return;

            const { data, error } = await supabase
                .from("shuls")
                .select("*")
                .eq("slug", slug.toLowerCase())
                .single();

            if (!error && data) {
                setShul(data);
            }
            setLoading(false);
        };

        fetchShul();
    }, [slug]);

    // Check auth state  
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const isActive = (path: string) => pathname === path;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!shul) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="text-center px-6">
                    <Building2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-stone-900 mb-2">Organization Not Found</h1>
                    <p className="text-stone-600 mb-6">The organization you're looking for doesn't exist.</p>
                    <Link
                        href="/"
                        className="text-amber-600 hover:text-amber-700 font-medium hover:underline"
                    >
                        ← Back to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    const publicPages = shul.settings?.publicPages || {};
    const donationsEnabled = publicPages.enableDonations !== false;

    const navItems = [
        { href: `/s/${slug}`, label: "Home", icon: Home, show: true },
        { href: `/s/${slug}#schedule`, label: "Schedule", icon: Calendar, show: true },
        { href: `/s/${slug}/donate`, label: "Donate", icon: Heart, show: donationsEnabled },
    ].filter(item => item.show);

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                        ? "bg-white/90 backdrop-blur-lg border-b border-stone-200 shadow-sm"
                        : "bg-transparent"
                    }`}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href={`/s/${slug}`} className="flex items-center gap-3 group">
                            {shul.logo_url ? (
                                <img
                                    src={shul.logo_url}
                                    alt={shul.name}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-stone-200 group-hover:ring-amber-400 transition-all"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center ring-2 ring-stone-200 group-hover:ring-amber-400 transition-all">
                                    <span className="text-lg font-bold text-amber-700">{shul.name.charAt(0)}</span>
                                </div>
                            )}
                            <span className="font-semibold text-lg text-stone-900 hidden sm:block">
                                {shul.name}
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive(item.href)
                                            ? "bg-amber-100 text-amber-700"
                                            : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ))}

                            {/* Auth */}
                            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-stone-200">
                                {user ? (
                                    <>
                                        <Link
                                            href={`/s/${slug}/portal`}
                                            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            Portal
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                                            title="Sign Out"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href={`/s/${slug}/login`}
                                        className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors flex items-center gap-2"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </nav>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-stone-200 overflow-hidden"
                        >
                            <nav className="container mx-auto px-4 py-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                                    >
                                        <item.icon className="h-5 w-5 text-stone-500" />
                                        {item.label}
                                    </Link>
                                ))}
                                <div className="border-t border-stone-100 mt-2 pt-2">
                                    {user ? (
                                        <>
                                            <Link
                                                href={`/s/${slug}/portal`}
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                                            >
                                                <LayoutDashboard className="h-5 w-5 text-stone-500" />
                                                Member Portal
                                            </Link>
                                            <button
                                                onClick={() => { handleLogout(); setMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                                            >
                                                <LogOut className="h-5 w-5 text-stone-500" />
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            href={`/s/${slug}/login`}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                                        >
                                            <LogIn className="h-5 w-5 text-stone-500" />
                                            Sign In
                                        </Link>
                                    )}
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-16">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-stone-200 bg-white mt-auto">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        {shul.address && (
                            <p className="text-sm text-stone-500 flex items-center gap-2">
                                📍 {shul.address}, {shul.city}, {shul.state} {shul.zip}
                            </p>
                        )}
                        <div className="w-full max-w-xs h-px bg-stone-200 my-2" />
                        <div className="flex flex-col gap-1 text-xs text-stone-400">
                            <p>© {new Date().getFullYear()} {shul.name}. All rights reserved.</p>
                            <p className="font-medium">Powered by ShulGenius</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
