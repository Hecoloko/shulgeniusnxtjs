"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, Search, Columns3, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { useState } from "react";
import { usePeople, Person } from "@/hooks";
import AddMemberModal from "./_components/AddMemberModal";
import { useRouter } from "next/navigation";

// Default shul ID - in production this would come from context/auth
const DEFAULT_SHUL_ID = "4248b82a-f29d-4ff2-9f8c-631cb37cd0d5";

const allColumns = [
    { key: "id", label: "ID", enabled: false },
    { key: "name", label: "Name", enabled: true },
    { key: "gender", label: "Gender", enabled: true },
    { key: "email", label: "Contact", enabled: true },
    { key: "location", label: "Location", enabled: true },
    { key: "date_of_birth", label: "Date of Birth", enabled: true },
    { key: "spouse", label: "Spouse", enabled: true },
    { key: "kohen_levi_yisroel", label: "Jewish Info", enabled: true },
    { key: "tags_raw", label: "Tags", enabled: false },
    { key: "status", label: "Status", enabled: true },
    { key: "balance", label: "Balance", enabled: true },
];

export default function MembersPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showColumnPicker, setShowColumnPicker] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [columns, setColumns] = useState(allColumns);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Use the new TanStack Query hook
    const { data: peopleData, isLoading, refetch } = usePeople(DEFAULT_SHUL_ID, {
        search: searchQuery || undefined,
        sortBy: sortConfig?.key || 'last_name',
        sortOrder: sortConfig?.direction || 'asc',
    });

    const people = peopleData?.data || [];

    // Refresh on modal close if needed (passed to modal)
    const handleMemberAdded = () => {
        refetch();
        setShowAddModal(false);
    };

    // Get display name from person
    const getDisplayName = (person: Person) => {
        return `${person.first_name} ${person.last_name}`.trim();
    };

    // Get spouse display
    const getSpouseDisplay = (person: Person) => {
        if (!person.spouse_first_name) return '-';
        return `${person.spouse_first_name} ${person.spouse_last_name || ''}`.trim();
    };

    // Get location display
    const getLocationDisplay = (person: Person) => {
        const parts = [person.city, person.state].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '-';
    };

    // Get cell value for display
    const getCellValue = (person: Person, columnKey: string): string | React.ReactNode => {
        switch (columnKey) {
            case 'name':
                return getDisplayName(person);
            case 'email':
                return person.email || person.phone || person.cell || '-';
            case 'location':
                return getLocationDisplay(person);
            case 'spouse':
                return getSpouseDisplay(person);
            case 'date_of_birth':
                return person.date_of_birth
                    ? new Date(person.date_of_birth).toLocaleDateString()
                    : '-';
            case 'balance':
                return null; // Special handling below
            case 'status':
                return null; // Special handling below
            default:
                return String((person as Record<string, unknown>)[columnKey] ?? '-');
        }
    };

    const toggleColumn = (key: string) => {
        setColumns(columns.map(col =>
            col.key === key ? { ...col, enabled: !col.enabled } : col
        ));
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="w-3 h-3 text-stone-400" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 text-amber-600" />
            : <ArrowDown className="w-3 h-3 text-amber-600" />;
    };

    const visibleColumns = columns.filter(col => col.enabled);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-stone-900 mb-1">Members</h1>
                    <p className="text-stone-600">Manage your congregation members and their information</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2.5 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm">
                        <Send className="w-4 h-4" />
                        Send Portal Invites
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-stone-900/20 transition-all font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Member
                    </button>
                </div>
            </div>

            {/* Total Members Stat */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm inline-block"
            >
                <p className="text-sm font-medium text-stone-600 mb-1">Total Members</p>
                <h3 className="text-3xl font-bold text-stone-900">{peopleData?.count || 0}</h3>
            </motion.div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search members by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                    />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowColumnPicker(!showColumnPicker)}
                        className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2.5 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Columns3 className="w-4 h-4" />
                        Columns
                    </button>

                    <AnimatePresence>
                        {showColumnPicker && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-stone-200 shadow-xl z-50"
                            >
                                <div className="p-3 border-b border-stone-100 flex items-center justify-between">
                                    <span className="font-semibold text-stone-900 text-sm">Customize Columns</span>
                                    <button
                                        onClick={() => setShowColumnPicker(false)}
                                        className="text-stone-400 hover:text-stone-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-2 max-h-80 overflow-y-auto">
                                    {columns.map((col) => (
                                        <label
                                            key={col.key}
                                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-stone-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={col.enabled}
                                                onChange={() => toggleColumn(col.key)}
                                                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="text-sm text-stone-700">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                {visibleColumns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {getSortIcon(col.key)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-stone-500">Loading members...</td>
                                </tr>
                            ) : people.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumns.length} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                                                <Plus className="w-8 h-8 text-stone-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-stone-900 mb-1">No members yet</h3>
                                                <p className="text-sm text-stone-500">Get started by adding your first member</p>
                                            </div>
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="mt-2 flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-medium text-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Member
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                people.map((person) => (
                                    <tr
                                        key={person.id}
                                        onClick={() => router.push(`/members/${person.id}`)}
                                        className="hover:bg-stone-50 transition-colors cursor-pointer"
                                    >
                                        {visibleColumns.map((col) => (
                                            <td key={col.key} className="px-4 py-3 text-sm">
                                                {col.key === 'name' ? (
                                                    <div>
                                                        <div className="font-medium text-stone-900">{getDisplayName(person)}</div>
                                                        {person.title && <div className="text-xs text-stone-500">{person.title}</div>}
                                                    </div>
                                                ) : col.key === 'balance' ? (
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${Number(person.balance || 0) > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        ${Number(person.balance || 0).toFixed(2)}
                                                    </span>
                                                ) : col.key === 'status' ? (
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${person.archived_at ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                                                        {person.archived_at ? 'Archived' : 'Active'}
                                                    </span>
                                                ) : (
                                                    <span className="text-stone-600">{getCellValue(person, col.key)}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Member Modal */}
            <AddMemberModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdded={handleMemberAdded}
                shulId={DEFAULT_SHUL_ID}
            />
        </div>
    );
}
