"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { useState } from "react";
import { useCreatePerson } from "@/hooks";

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdded?: () => void;
    shulId: string;
}

export default function AddMemberModal({ isOpen, onClose, onAdded, shulId }: AddMemberModalProps) {
    const createPerson = useCreatePerson();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        try {
            await createPerson.mutateAsync({
                shul_id: shulId,
                first_name: formData.get("firstName") as string,
                last_name: formData.get("lastName") as string,
                title: formData.get("title") as string || null,
                email: formData.get("email") as string || null,
                phone: formData.get("phone") as string || null,
                cell: formData.get("cell") as string || null,
                gender: formData.get("gender") as string || null,
                date_of_birth: formData.get("dateOfBirth") as string || null,
                address: formData.get("address") as string || null,
                city: formData.get("city") as string || null,
                state: formData.get("state") as string || null,
                zip: formData.get("zip") as string || null,
                spouse_first_name: formData.get("spouseFirstName") as string || null,
                spouse_last_name: formData.get("spouseLastName") as string || null,
                kohen_levi_yisroel: formData.get("jewishStatus") as string || null,
                hebrew_name: formData.get("hebrewName") as string || null,
            });

            onClose();
            (e.target as HTMLFormElement).reset();
            if (onAdded) onAdded();
        } catch (error) {
            console.error("Failed to create member:", error);
            alert("Failed to create member. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold font-serif text-stone-900">Add New Member</h2>
                                <button
                                    onClick={onClose}
                                    className="text-stone-400 hover:text-stone-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Name - Required */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Title</label>
                                        <select
                                            name="title"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Mr.">Mr.</option>
                                            <option value="Mrs.">Mrs.</option>
                                            <option value="Ms.">Ms.</option>
                                            <option value="Dr.">Dr.</option>
                                            <option value="Rabbi">Rabbi</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">Cell/Mobile</label>
                                    <input
                                        type="tel"
                                        name="cell"
                                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        placeholder="(555) 987-6543"
                                    />
                                </div>

                                {/* Personal Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Gender</label>
                                        <select
                                            name="gender"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        placeholder="123 Main St"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">ZIP</label>
                                        <input
                                            type="text"
                                            name="zip"
                                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Spouse Information */}
                                <div className="border-t border-stone-200 pt-6">
                                    <h3 className="text-sm font-semibold text-stone-700 mb-4">Spouse Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-2">Spouse First Name</label>
                                            <input
                                                type="text"
                                                name="spouseFirstName"
                                                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-2">Spouse Last Name</label>
                                            <input
                                                type="text"
                                                name="spouseLastName"
                                                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Jewish Information */}
                                <div className="border-t border-stone-200 pt-6">
                                    <h3 className="text-sm font-semibold text-stone-700 mb-4">Jewish Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-2">Status</label>
                                            <select
                                                name="jewishStatus"
                                                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            >
                                                <option value="">Select...</option>
                                                <option value="Kohen">Kohen</option>
                                                <option value="Levi">Levi</option>
                                                <option value="Yisroel">Yisroel</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-stone-700 mb-2">Hebrew Name</label>
                                            <input
                                                type="text"
                                                name="hebrewName"
                                                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                placeholder="Yochanan"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>Saving...</>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Add Member
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
