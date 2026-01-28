"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { User, Save, Plus, Edit, Trash2, Link as LinkIcon, Info, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProcessorsList from "./_components/processors-list";

const tabs = ["General", "Users & Admins", "Website", "Financial", "Communications", "QuickBooks", "Import"];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("General");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-stone-900 mb-1">Settings & Configuration</h1>
                    <p className="text-stone-600">Manage your shul's settings, payment processors, website, and integrations</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all font-medium text-sm">
                    <User className="w-4 h-4" />
                    My Account
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-stone-200">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab
                                ? 'bg-stone-100 text-stone-900 border-b-2 border-blue-600'
                                : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === "General" && <GeneralTab />}
                {activeTab === "Users & Admins" && <UsersTab />}
                {activeTab === "Website" && <WebsiteTab />}
                {activeTab === "Financial" && <FinancialTab />}
                {activeTab === "Communications" && <CommunicationsTab />}
                {activeTab === "QuickBooks" && <QuickBooksTab />}
                {activeTab === "Import" && <ImportTab />}
            </motion.div>
        </div>
    );
}

// General Tab
function GeneralTab() {
    const supabase = createClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        website: "",
    });

    // Populate data when loaded
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('settings').select('value').eq('key', 'shul_info').single();
            if (data?.value) {
                try {
                    setFormData(JSON.parse(data.value));
                } catch (e) {
                    console.error("Error parsing settings json", e);
                }
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.from('settings').upsert({
                key: 'shul_info',
                value: JSON.stringify(formData),
                category: 'general'
            }, { onConflict: 'key' }); // Ensure unique constraint on key handles upsert

            if (error) throw error;
            alert("Settings saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) return <div className="p-8 text-center text-stone-500">Loading settings...</div>;

    return (
        <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-stone-900 mb-1">Shul Information</h2>
                <p className="text-sm text-stone-500">Update your shul's contact information and details</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                        Shul Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Heco Synagogue"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Address</label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">City</label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">State</label>
                        <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => handleChange("state", e.target.value)}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">ZIP</label>
                        <input
                            type="text"
                            value={formData.zip}
                            onChange={(e) => handleChange("zip", e.target.value)}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Website</label>
                    <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange("website", e.target.value)}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all font-medium disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}

// Users & Admins Tab
function UsersTab() {
    const supabase = createClient();
    const [users, setUsers] = useState<any[]>([]);
    const [isInviting, setIsInviting] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", role: "Gabbai" });
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
        if (error) console.error(error);
        else setUsers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            // In a real app, this would trigger an Edge Function to send an invite email via Supabase Auth Admin API
            // For now, we'll just add them to the admin_users table so they are authorized when they sign up/login.
            const { error } = await supabase.from('admin_users').insert({
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: 'pending' // pending until they sign up
            });

            if (error) throw error;

            alert("User added to allowlist. Ask them to sign up with this email.");
            setShowInviteForm(false);
            setNewUser({ name: "", email: "", role: "Gabbai" });
            fetchUsers();
        } catch (err: any) {
            alert("Error adding user: " + err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleDelete = async (id: any) => {
        if (confirm("Are you sure you want to remove this admin?")) {
            await supabase.from('admin_users').delete().eq('id', id);
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 mb-1 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            User & Admin Management
                        </h2>
                        <p className="text-sm text-stone-500">Manage who can access your shul's admin portal and their permissions</p>
                    </div>
                    {!showInviteForm && (
                        <button
                            onClick={() => setShowInviteForm(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Admin/Role
                        </button>
                    )}
                </div>

                {showInviteForm && (
                    <form onSubmit={handleInvite} className="mb-8 p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <h4 className="font-bold text-stone-900 mb-3">Add New Admin</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <input
                                required
                                placeholder="Name"
                                value={newUser.name}
                                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                className="px-3 py-2 border rounded"
                            />
                            <input
                                required
                                type="email"
                                placeholder="Email"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                className="px-3 py-2 border rounded"
                            />
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                className="px-3 py-2 border rounded"
                            >
                                <option value="Shul Admin">Shul Admin</option>
                                <option value="Gabbai">Gabbai</option>
                                <option value="Accountant">Accountant</option>
                                <option value="Webmaster">Webmaster</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowInviteForm(false)}
                                className="text-sm text-stone-500 hover:text-stone-700 font-medium px-4 py-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isInviting}
                                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isInviting ? "Adding..." : "Add User"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-stone-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                                        No admin users yet. Add your first admin to get started.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user: any, i: number) => (
                                    <tr key={user.id || i} className="border-b border-stone-100">
                                        <td className="px-4 py-3 font-medium text-stone-900">{user.name}</td>
                                        <td className="px-4 py-3 text-sm text-stone-600">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'Shul Admin' ? 'bg-blue-900 text-white' : 'bg-stone-500 text-white'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                {user.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Permissions */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-4">Role Permissions</h3>
                <div className="space-y-3 text-sm">
                    <div>
                        <span className="font-semibold text-blue-900">Shul Admin:</span>
                        <span className="text-stone-600 ml-2">Full access to all features including settings, billing, and user management</span>
                    </div>
                    <div>
                        <span className="font-semibold text-stone-700">Gabbai:</span>
                        <span className="text-stone-600 ml-2">Manage members, kibbudim, aliyahs, and seating charts</span>
                    </div>
                    <div>
                        <span className="font-semibold text-stone-700">Accountant:</span>
                        <span className="text-stone-600 ml-2">Manage invoices, payments, reports, and financial settings</span>
                    </div>
                    <div>
                        <span className="font-semibold text-stone-700">Webmaster:</span>
                        <span className="text-stone-600 ml-2">Manage website, forms, and communications</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Website Tab
function WebsiteTab() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border-l-4 border-amber-500 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-stone-900 mb-1">🌐 Your Public Website</h2>
                <p className="text-sm text-stone-500 mb-4">Share this link with your community to access your shul's public page</p>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value="https://shulgenius.com/s/heco-synagouge-1"
                        readOnly
                        className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-600"
                    />
                    <button className="px-4 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 font-medium">
                        Copy
                    </button>
                    <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Preview
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
                    🌐 Custom Domain
                </h2>
                <p className="text-sm text-stone-500 mb-4">Connect your own domain to your shul's website</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        Custom domains require DNS configuration. <a href="#" className="underline font-medium">View setup guide</a>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Domain Name</label>
                    <input
                        type="text"
                        placeholder="www.yourshul.com"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <p className="text-xs text-stone-500 mt-2">Enter your custom domain (e.g., www.yourshul.com)</p>
                </div>

                <button className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all font-medium">
                    <Save className="w-4 h-4" />
                    Save Domain
                </button>
            </div>
        </div>
    );
}

// Financial Tab
function FinancialTab() {
    const supabase = createClient();


    const handleAddItem = async () => {
        const name = prompt("Item Name:");
        if (!name) return;
        const price = prompt("Price:", "0");
        const type = prompt("Type (Service, Product, Membership):", "Service");

        try {
            const { error } = await supabase.from('items').insert({
                name,
                price: Number(price),
                type: type || "Service",
            });
            if (error) throw error;
            fetchData();
        } catch (err: any) {
            alert("Error adding item: " + err.message);
        }
    };

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const { data } = await supabase.from('items').select('*');
        if (data) setItems(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const removeItem = async (id: string) => {
        if (confirm("Remove this item?")) {
            await supabase.from('items').delete().eq('id', id);
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            {/* Recurring Billing - Placeholder for now */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-stone-900 mb-1">Recurring Billing Management</h2>
                        <p className="text-sm text-stone-500">Manually trigger billing or view automated billing history</p>
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                        <strong>Automated Schedule:</strong> Recurring billing runs automatically every day at 2:00 AM UTC.
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                    <strong>Automated Schedule:</strong> Recurring billing runs automatically every day at 2:00 AM UTC.
                </div>
            </div>
            {/* Payment Processors */}
            <ProcessorsList />



            {/* Items & Products */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-stone-900 mb-1">Items & Products</h2>
                        <p className="text-sm text-stone-500">Manage billable items for invoices</p>
                    </div>
                    <button
                        onClick={handleAddItem}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                </div>

                <table className="w-full">
                    <thead className="border-b border-stone-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">No items configured.</td>
                            </tr>
                        ) : (
                            items.map((item: any) => (
                                <tr key={item.id} className="border-b border-stone-100">
                                    <td className="px-4 py-3 font-medium text-stone-900">{item.name}</td>
                                    <td className="px-4 py-3 font-medium">${item.price}</td>
                                    <td className="px-4 py-3 text-sm text-stone-600">{item.type}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => removeItem(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}

// Communications Tab
function CommunicationsTab() {
    return (
        <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-stone-900 mb-2">Communications Settings</h2>
            <p className="text-stone-500">Configure email settings and templates (Coming soon)</p>
        </div>
    );
}

// QuickBooks Tab
function QuickBooksTab() {
    return (
        <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-stone-900 mb-2">QuickBooks Integration</h2>
            <p className="text-stone-500">Connect your QuickBooks account (Coming soon)</p>
        </div>
    );
}

// Import Tab
function ImportTab() {
    return (
        <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-stone-900 mb-2">Import Data</h2>
            <p className="text-stone-500">Import members and financial data from CSV or other systems (Coming soon)</p>
        </div>
    );
}
