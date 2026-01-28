"use client";

import { useState, useEffect } from "react";
import { Loader2, Clock, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface ScheduleSectionProps {
    shulId: string;
}

interface MinyanSchedule {
    id: string;
    day_type: string;
    service_type: string;
    time: string;
    is_zman: boolean | null;
    notes: string | null;
}

const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'shabbos'];
const SPECIAL_DAY_ORDER = ['rosh_chodesh', 'fast_day', 'legal_holiday', 'selichos', 'chol_hamoed', 'yom_tov'];

const DAY_LABELS: Record<string, string> = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    shabbos: 'Shabbos',
    yom_tov: 'Yom Tov',
    rosh_chodesh: 'Rosh Chodesh',
    fast_day: 'Fast Day',
    legal_holiday: 'Legal Holiday',
    selichos: 'Selichos',
    chol_hamoed: 'Chol Hamoed',
};

const SERVICE_LABELS: Record<string, string> = {
    shacharis: 'Shacharis',
    mincha: 'Mincha',
    maariv: "Maariv",
    shiur: 'Shiur',
};

type TabType = 'regular' | 'special' | 'shiurim';

export default function ScheduleSection({ shulId }: ScheduleSectionProps) {
    const supabase = createClient();
    const [schedules, setSchedules] = useState<MinyanSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('regular');

    useEffect(() => {
        fetchSchedules();
    }, [shulId]);

    const fetchSchedules = async () => {
        // Note: We use 'any' for data here because the type definition might not fully propagate to the query builder locally yet
        // without a full restart, but we defined minyan_schedules in types/supabase.ts so it should be fine.
        const { data, error } = await supabase
            .from('minyan_schedules')
            .select('*')
            .eq('shul_id', shulId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }); // Assuming sort_order exists, falling back to created_at if undefined in some rows? sort_order has default 0.

        if (error) {
            console.error('Error fetching schedules:', error);
        } else {
            setSchedules(data || []);
        }
        setLoading(false);
    };

    const getTimesForDayService = (day: string, service: string) => {
        return schedules
            .filter(s => s.day_type === day && s.service_type === service)
            .map(s => ({ time: s.time, is_zman: s.is_zman, notes: s.notes }));
    };

    const hasSpecialSchedules = schedules.some(s => SPECIAL_DAY_ORDER.includes(s.day_type));
    const hasShiurim = schedules.some(s => s.service_type === 'shiur');

    const renderTimes = (times: { time: string; is_zman: boolean | null; notes: string | null }[]) => {
        if (times.length === 0) return <span className="text-stone-400 font-light">-</span>;

        return (
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                {times.map((t, idx) => (
                    <span key={idx} className="inline-flex items-center">
                        <span className={`${t.is_zman ? "text-amber-600 font-bold" : "text-stone-700 font-medium"}`}>
                            {t.time}
                        </span>
                        {t.notes && (
                            <span className="ml-1 text-xs text-stone-400">({t.notes})</span>
                        )}
                        {idx < times.length - 1 && <span className="text-stone-300 ml-1">,</span>}
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-100">

            {/* Header / Tabs */}
            <div className="bg-stone-50 border-b border-stone-200 p-2 md:p-4 flex flex-wrap gap-2 justify-center">
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'regular'
                            ? 'bg-white text-amber-600 shadow-sm ring-1 ring-stone-200'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                        }`}
                >
                    Regular Minyanim
                </button>
                {hasSpecialSchedules && (
                    <button
                        onClick={() => setActiveTab('special')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'special'
                                ? 'bg-white text-amber-600 shadow-sm ring-1 ring-stone-200'
                                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                            }`}
                    >
                        Special Days
                    </button>
                )}
                {hasShiurim && (
                    <button
                        onClick={() => setActiveTab('shiurim')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'shiurim'
                                ? 'bg-white text-amber-600 shadow-sm ring-1 ring-stone-200'
                                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                            }`}
                    >
                        Shiurim & Events
                    </button>
                )}
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50/50 p-3 text-center border-b border-blue-100 hidden md:block">
                <p className="text-xs text-blue-700 flex items-center justify-center gap-2">
                    <Info className="w-3.5 h-3.5" />
                    <span>Times in <span className="text-amber-600 font-bold">orange</span> are based on zmanim (halachic times).</span>
                </p>
            </div>


            <div className="p-0 md:p-0">
                <AnimatePresence mode="wait">
                    {activeTab === 'regular' && (
                        <motion.div
                            key="regular"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {schedules.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Clock className="h-12 w-12 mx-auto mb-4 text-stone-200" />
                                    <h3 className="text-lg font-medium text-stone-900 mb-2">No Schedule Available</h3>
                                    <p className="text-stone-500">Schedule information will be posted soon.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-serif-heading">
                                        <thead>
                                            <tr className="bg-stone-100 text-stone-600 border-b border-stone-200">
                                                <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-xs w-1/4">Day</th>
                                                <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs w-1/4">Shacharis</th>
                                                <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs w-1/4">Mincha</th>
                                                <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs w-1/4">Maariv</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {DAY_ORDER.map((day, index) => {
                                                const shacharis = getTimesForDayService(day, 'shacharis');
                                                const mincha = getTimesForDayService(day, 'mincha');
                                                const maariv = getTimesForDayService(day, 'maariv');

                                                return (
                                                    <tr key={day} className={`group hover:bg-stone-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'}`}>
                                                        <td className="py-4 px-6 font-bold text-stone-800">{DAY_LABELS[day]}</td>
                                                        <td className="py-4 px-4 text-center">{renderTimes(shacharis)}</td>
                                                        <td className="py-4 px-4 text-center">{renderTimes(mincha)}</td>
                                                        <td className="py-4 px-4 text-center">{renderTimes(maariv)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'special' && (
                        <motion.div
                            key="special"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-x-auto"
                        >
                            <table className="w-full text-sm font-serif-heading">
                                <thead>
                                    <tr className="bg-stone-100 text-stone-600 border-b border-stone-200">
                                        <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-xs w-1/4">Day</th>
                                        <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs w-1/4">Shacharis</th>
                                        <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs w-1/4">Mincha</th>
                                        <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs w-1/4">Maariv</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {SPECIAL_DAY_ORDER.map((day, index) => {
                                        const shacharis = getTimesForDayService(day, 'shacharis');
                                        const mincha = getTimesForDayService(day, 'mincha');
                                        const maariv = getTimesForDayService(day, 'maariv');

                                        if (shacharis.length === 0 && mincha.length === 0 && maariv.length === 0) return null;

                                        return (
                                            <tr key={day} className={`group hover:bg-stone-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'}`}>
                                                <td className="py-4 px-6 font-medium text-stone-800">{DAY_LABELS[day]}</td>
                                                <td className="py-4 px-4 text-center">{renderTimes(shacharis)}</td>
                                                <td className="py-4 px-4 text-center">{renderTimes(mincha)}</td>
                                                <td className="py-4 px-4 text-center">{renderTimes(maariv)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </motion.div>
                    )}

                    {activeTab === 'shiurim' && (
                        <motion.div
                            key="shiurim"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-x-auto"
                        >
                            <table className="w-full text-sm font-serif-heading">
                                <thead>
                                    <tr className="bg-stone-100 text-stone-600 border-b border-stone-200">
                                        <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-xs">Day</th>
                                        <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs">Event</th>
                                        <th className="text-center py-4 px-4 font-bold uppercase tracking-wider text-xs">Time</th>
                                        <th className="text-left py-4 px-4 font-bold uppercase tracking-wider text-xs">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {schedules
                                        .filter(s => s.service_type === 'shiur')
                                        .map((schedule, index) => (
                                            <tr key={schedule.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="py-4 px-6 font-medium text-stone-800">
                                                    {DAY_LABELS[schedule.day_type] || schedule.day_type}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                                        Shiur
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`${schedule.is_zman ? "text-amber-600 font-bold" : "text-stone-700 font-medium"}`}>
                                                        {schedule.time}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-stone-500 italic">{schedule.notes || '-'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
