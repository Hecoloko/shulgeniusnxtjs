"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearAuthPage() {
    const router = useRouter();
    const [cleared, setCleared] = useState(false);

    const clearAuth = () => {
        // Clear localStorage
        localStorage.clear();

        // Clear sessionStorage
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(";").forEach(c => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Clear IndexedDB (where Convex stores tokens)
        if (window.indexedDB) {
            indexedDB.databases().then(dbs => {
                dbs.forEach(db => {
                    if (db.name) indexedDB.deleteDatabase(db.name);
                });
            });
        }

        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }

        // Unregister service workers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(reg => reg.unregister());
            });
        }

        setCleared(true);
        setTimeout(() => {
            // Hard reload to clear everything
            window.location.href = '/login';
            window.location.reload();
        }, 1000);
    };

    return (
        <div style={{
            fontFamily: 'system-ui',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            margin: 0,
            background: '#f5f5f5'
        }}>
            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <h1>🔓 Clear Auth Tokens</h1>
                <p>Click below to clear all stored authentication data.</p>
                <button
                    onClick={clearAuth}
                    style={{
                        background: '#d97706',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        marginTop: '1rem'
                    }}
                >
                    Clear Everything & Reload
                </button>
                {cleared && (
                    <div style={{ color: '#16a34a', fontWeight: 'bold', marginTop: '1rem' }}>
                        ✓ Cleared! Redirecting...
                    </div>
                )}
            </div>
        </div>
    );
}
