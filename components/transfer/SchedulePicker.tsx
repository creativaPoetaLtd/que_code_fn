"use client";

import { Calendar, Clock, Repeat, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecurrenceState {
    frequency: "none" | "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endMode: "never" | "date" | "count";
    endDate: string;
    maxOccurrences: number;
}

export interface ScheduleState {
    enabled: boolean;
    date: string;
    time: string;
    recurrence: RecurrenceState;
}

export const defaultScheduleState: ScheduleState = {
    enabled: false,
    date: "",
    time: "",
    recurrence: {
        frequency: "none",
        interval: 1,
        endMode: "never",
        endDate: "",
        maxOccurrences: 5,
    },
};

interface SchedulePickerProps {
    schedule: ScheduleState;
    onChange: (schedule: ScheduleState) => void;
    minDate: string;
}

const frequencies: { value: RecurrenceState["frequency"]; label: string }[] = [
    { value: "none", label: "Never" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
];

const endOptions: { value: RecurrenceState["endMode"]; label: string }[] = [
    { value: "never", label: "Never" },
    { value: "date", label: "On date" },
    { value: "count", label: "After N" },
];

// Native date/time/number inputs render their own browser chrome (calendar icon, spinner
// arrows) independent of our Tailwind classes - without an explicit color-scheme, that
// chrome stays light-themed (e.g. a near-invisible dark icon on a dark background).
const fieldClass =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-main text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 dark:focus:ring-brand-gold/30 [color-scheme:light] dark:[color-scheme:dark]";

const SchedulePicker = ({ schedule, onChange, minDate }: SchedulePickerProps) => {
    const update = (patch: Partial<ScheduleState>) => onChange({ ...schedule, ...patch });
    const updateRecurrence = (patch: Partial<RecurrenceState>) =>
        onChange({ ...schedule, recurrence: { ...schedule.recurrence, ...patch } });

    return (
        <div className="bg-white dark:bg-darkBg-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-darkBorder-light mb-6">
            <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                    type="button"
                    onClick={() => update({ enabled: false })}
                    className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all",
                        !schedule.enabled
                            ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main border-transparent shadow-md"
                            : "bg-gray-50 dark:bg-darkBg-main text-gray-600 dark:text-gray-400 border-gray-200 dark:border-darkBorder-light"
                    )}
                >
                    <Zap size={15} /> Send now
                </button>
                <button
                    type="button"
                    onClick={() => update({ enabled: true })}
                    className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all",
                        schedule.enabled
                            ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main border-transparent shadow-md"
                            : "bg-gray-50 dark:bg-darkBg-main text-gray-600 dark:text-gray-400 border-gray-200 dark:border-darkBorder-light"
                    )}
                >
                    <Calendar size={15} /> Schedule for later
                </button>
            </div>

            {schedule.enabled && (
                <div className="animate-fadeIn space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                                <Calendar size={12} /> Date
                            </label>
                            <input
                                type="date"
                                min={minDate}
                                value={schedule.date}
                                onChange={(e) => update({ date: e.target.value })}
                                className={fieldClass}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                                <Clock size={12} /> Time
                            </label>
                            <input
                                type="time"
                                value={schedule.time}
                                onChange={(e) => update({ time: e.target.value })}
                                className={fieldClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Repeat size={12} /> Repeat
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                            {frequencies.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => updateRecurrence({ frequency: f.value })}
                                    className={cn(
                                        "py-2 rounded-lg text-[11px] font-semibold border transition-all",
                                        schedule.recurrence.frequency === f.value
                                            ? "bg-brand-green/10 dark:bg-brand-gold/10 border-brand-green dark:border-brand-gold text-brand-green dark:text-brand-gold"
                                            : "bg-gray-50 dark:bg-darkBg-main border-gray-200 dark:border-darkBorder-light text-gray-500 dark:text-gray-400"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {schedule.recurrence.frequency !== "none" && (
                        <div className="p-4 bg-gray-50 dark:bg-darkBg-main rounded-2xl space-y-3 animate-fadeIn">
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                                    Ends
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {endOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => updateRecurrence({ endMode: opt.value })}
                                            className={cn(
                                                "py-2 rounded-lg text-[11px] font-semibold border transition-all",
                                                schedule.recurrence.endMode === opt.value
                                                    ? "bg-white dark:bg-darkBg-card border-brand-green dark:border-brand-gold text-brand-green dark:text-brand-gold shadow-sm"
                                                    : "bg-transparent border-gray-200 dark:border-darkBorder-light text-gray-500 dark:text-gray-400"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {schedule.recurrence.endMode === "date" && (
                                <input
                                    type="date"
                                    min={schedule.date || minDate}
                                    value={schedule.recurrence.endDate}
                                    onChange={(e) => updateRecurrence({ endDate: e.target.value })}
                                    className={cn(fieldClass, "bg-white dark:bg-darkBg-card")}
                                />
                            )}

                            {schedule.recurrence.endMode === "count" && (
                                <input
                                    type="number"
                                    min={1}
                                    value={schedule.recurrence.maxOccurrences}
                                    onChange={(e) =>
                                        updateRecurrence({ maxOccurrences: Math.max(1, parseInt(e.target.value) || 1) })
                                    }
                                    placeholder="Number of occurrences"
                                    className={cn(fieldClass, "bg-white dark:bg-darkBg-card")}
                                />
                            )}
                        </div>
                    )}

                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        Funds are reserved from your balance immediately so this transfer is guaranteed to send on time.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SchedulePicker;
