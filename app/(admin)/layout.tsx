"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Home, Settings, Users, CreditCard, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Members", href: "/members" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  { icon: FileText, label: "Enter Aliyahs", href: "/enter-aliyahs" },
  { icon: CreditCard, label: "Campaigns", href: "/campaigns" },
  { icon: Mail, label: "Email Settings", href: "/settings/email" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);

      if (!session) {
        router.push("/login");
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-amber-600 font-serif font-bold text-xl">Loading ShulGenius...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 border-r border-stone-200 bg-white flex flex-col shadow-sm z-20"
      >
        <div className="p-6 border-b border-stone-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-lg flex items-center justify-center text-white font-bold font-serif">
            S
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900 tracking-tight">
            ShulGenius
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive
                    ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-100/50"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-amber-600" : "text-stone-400")} />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-stone-50/50">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-stone-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">
            {pathname.split('/')[1] || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium text-stone-900">Gabai Admin</div>
              <div className="text-xs text-stone-500">Kehillas Heichal</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-stone-200 border-2 border-white shadow-sm flex items-center justify-center text-stone-500 font-serif font-bold">
              GA
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
