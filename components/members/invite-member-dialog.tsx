"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mail, Link, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Person } from "@/hooks";
import { toast } from "sonner";

interface InviteMemberDialogProps {
    isOpen: boolean;
    onClose: () => void;
    member: Person;
    shulSlug: string;
    shulName: string;
}

export default function InviteMemberDialog({
    isOpen,
    onClose,
    member,
    shulSlug,
    shulName
}: InviteMemberDialogProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [customMessage, setCustomMessage] = useState("");
    const [copied, setCopied] = useState(false);

    // Ensure we have a valid slug, fallback to 'demo' if needed for dev
    const cleanSlug = shulSlug || "demo";
    const baseSignupUrl = typeof window !== "undefined"
        ? `${window.location.origin}/s/${cleanSlug}/login?signup=true`
        : "";

    const signupUrl = baseSignupUrl;

    const handleSendInvite = async () => {
        if (!member.email) {
            toast.error("Member does not have an email address");
            return;
        }

        setLoading(true);

        try {
            const memberSignupUrl = `${baseSignupUrl}&email=${encodeURIComponent(member.email)}`;

            console.log("Sending invite to:", member.email);

            // Call edge function to send invite email
            const { data, error } = await supabase.functions.invoke('send-member-invite', {
                body: {
                    memberEmail: member.email,
                    memberName: `${member.first_name} ${member.last_name}`,
                    shulName: shulName,
                    signupUrl: memberSignupUrl,
                    customMessage: customMessage || undefined,
                }
            });

            if (error) {
                console.error('Invite error:', error);
                throw error;
            }

            console.log("Invite sent success:", data);
            toast.success(`Invitation sent to ${member.email}`);

            onClose();
            setCustomMessage("");
        } catch (error: any) {
            console.error('Error sending invite:', error);
            const msg = error.message || "Failed to send invitation. Please check the logs.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(signupUrl);
            setCopied(true);
            toast.success("Invite link copied!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const hasEmail = Boolean(member.email);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                            <div className="bg-white border-b border-stone-200 p-6 flex items-center justify-between">
                                <h2 className="text-xl font-bold font-serif text-stone-900">Invite Member</h2>
                                <button
                                    onClick={onClose}
                                    className="text-stone-400 hover:text-stone-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {!hasEmail ? (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        <p className="text-sm">
                                            This member does not have an email address. Please add an email to their profile first.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-900">
                                                            {member.first_name} {member.last_name}
                                                        </p>
                                                        <p className="text-xs text-stone-500">{member.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Copy Link */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                                                    <Link className="h-3 w-3" />
                                                    General Signup Link
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-600 overflow-hidden text-ellipsis whitespace-nowrap">
                                                        {signupUrl}
                                                    </div>
                                                    <button
                                                        onClick={copyInviteLink}
                                                        className={`shrink-0 p-2 rounded-lg border transition-all ${copied
                                                                ? "bg-green-50 border-green-200 text-green-600"
                                                                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                                                            }`}
                                                    >
                                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-stone-400">
                                                    Share this link manually via WhatsApp or SMS.
                                                </p>
                                            </div>

                                            <div className="relative py-2">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-stone-100" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-white px-2 text-stone-400">or send via email</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="customMessage" className="text-sm font-semibold text-stone-700">Custom Message (Optional)</label>
                                                <textarea
                                                    id="customMessage"
                                                    placeholder="Add a personal note..."
                                                    value={customMessage}
                                                    onChange={(e) => setCustomMessage(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm resize-none"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 justify-end pt-2">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    {hasEmail && (
                                        <button
                                            onClick={handleSendInvite}
                                            disabled={loading}
                                            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-sm transition-all font-medium text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                            Send Email Invite
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
