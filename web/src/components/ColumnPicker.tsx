"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { formatStatName } from "@/lib/constants";

interface ColumnPickerProps {
    availableStats: string[];
    activeColumns: string[];
    defaultStats: string[];
    onToggleColumn: (col: string) => void;
    onSetColumns: (cols: string[]) => void;
    onClearColumns: () => void;
}

// Logic to group stats for the dropdown (Option A: Group by Mechanics)
function categorizeStats(stats: string[]) {
    const groups: Record<string, string[]> = {
        "Core Vitals": [],
        "Damage %": [],
        "Flat Damage": [],
        "Armor Piercing": [],
        "Critical Hit": [],
        "Resist %": [],
        "Flat Resist": [],
        "Block": [],
        "Utility & Conversion": [],
        "Other": []
    };

    for (const stat of stats) {
        // Core Vitals
        if (["MaxHealth", "MaxMana", "PowerPip", "Archmastery", "ShadowPipRating"].includes(stat)) {
            groups["Core Vitals"].push(stat);
        }
        // Offense Mechanics
        else if (stat.includes("FlatDamage")) {
            groups["Flat Damage"].push(stat);
        } else if (stat.includes("Damage")) { // Has to execute after FlatDamage
            groups["Damage %"].push(stat);
        } else if (stat.includes("ArmorPiercing")) {
            groups["Armor Piercing"].push(stat);
        } else if (stat.includes("CriticalHit")) {
            groups["Critical Hit"].push(stat);
        }
        // Defense Mechanics
        else if (stat.includes("FlatReduceDamage")) {
            groups["Flat Resist"].push(stat);
        } else if (stat.includes("ReduceDamage") || stat.includes("Resist") || stat === "StunResistance") {
            groups["Resist %"].push(stat);
        } else if (stat.includes("Block")) {
            groups["Block"].push(stat);
        }
        // Utility
        else if (stat.includes("Accuracy") || stat.includes("PipConversion") || stat.includes("Healing")) {
            groups["Utility & Conversion"].push(stat);
        }
        // Fallback
        else {
            groups["Other"].push(stat);
        }
    }

    // Remove empty groups
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
}

export function ColumnPicker({
    availableStats,
    activeColumns,
    defaultStats,
    onToggleColumn,
    onSetColumns,
    onClearColumns,
}: ColumnPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Quick search filter for power users
    const [searchQuery, setSearchQuery] = useState("");

    const groupedStats = useMemo(() => categorizeStats(availableStats), [availableStats]);
    const displayCount = activeColumns.length > 0 ? activeColumns.length : defaultStats.length;

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
            setSearchQuery(""); // Reset search on close
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
        <>
            {/* The Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded border border-border bg-surface-800 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary-500 hover:text-primary-500"
            >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Customize Stats ({displayCount})
            </button>

            {/* The Mega Menu Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={(e) => {
                        // Close if clicking the backdrop exactly
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="flex w-full max-w-5xl max-h-[85vh] flex-col rounded-lg border border-border bg-surface-900 shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-surface-800/50 rounded-t-lg">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                                    Customize Display Columns
                                </h2>
                                {/* Quick Search Input */}
                                <div className="relative ml-4">
                                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search stats..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-64 rounded bg-surface-950 border border-border/50 py-1.5 pl-9 pr-3 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-3 pr-4 border-r border-border/50">
                                    <button
                                        onClick={() => onSetColumns(defaultStats)}
                                        className="text-sm font-medium text-primary-500 hover:text-primary-400"
                                    >
                                        Restore Defaults
                                    </button>
                                    <button
                                        onClick={onClearColumns}
                                        className="text-sm font-medium text-foreground/50 hover:text-foreground"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-full hover:bg-surface-800 text-foreground/60 hover:text-foreground transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body (Scrollable CSS Columns) */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-8">
                                {groupedStats.map(([groupName, stats]) => {
                                    // Filter stats in this group based on search query
                                    const filteredStats = stats.filter(stat =>
                                        formatStatName(stat).toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    // If group is empty after search, hide it
                                    if (filteredStats.length === 0) return null;

                                    return (
                                        <div key={groupName} className="flex flex-col break-inside-avoid mb-8">
                                            <h3 className="mb-3 text-sm font-bold tracking-wide text-primary-400 uppercase border-b border-border/30 pb-1">
                                                {groupName} <span className="text-foreground/30 text-xs ml-1">({filteredStats.length})</span>
                                            </h3>
                                            <div className="flex flex-col gap-1.5">
                                                {filteredStats.map((stat) => {
                                                    const isChecked = activeColumns.length > 0
                                                        ? activeColumns.includes(stat)
                                                        : defaultStats.includes(stat);
                                                    return (
                                                        <label
                                                            key={stat}
                                                            className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-surface-800/80 transition-colors border border-transparent hover:border-border/50"
                                                        >
                                                            <div className="flex items-center justify-center mt-0.5">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => {
                                                                        if (activeColumns.length === 0 && !defaultStats.includes(stat)) {
                                                                            onSetColumns([...defaultStats, stat]);
                                                                        } else if (activeColumns.length === 0 && defaultStats.includes(stat)) {
                                                                            onSetColumns(defaultStats.filter((s) => s !== stat));
                                                                        } else {
                                                                            onToggleColumn(stat);
                                                                        }
                                                                    }}
                                                                    className="h-4 w-4 rounded border-border bg-surface-950 text-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-surface-900"
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-foreground/90 select-none">
                                                                {formatStatName(stat).replace("All ", "All ")}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Empty State for Search */}
                            {searchQuery && groupedStats.every(([_, stats]) => stats.filter(s => formatStatName(s).toLowerCase().includes(searchQuery.toLowerCase())).length === 0) && (
                                <div className="flex flex-col items-center justify-center py-12 text-foreground/50">
                                    <svg className="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg">No stats found matching "{searchQuery}"</p>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="mt-2 text-primary-500 hover:text-primary-400 font-medium"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end border-t border-border/50 px-6 py-4 bg-surface-800/30 rounded-b-lg">
                            <span className="text-sm text-foreground/50 mr-auto">
                                Showing <b>{displayCount}</b> columns in table
                            </span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-primary-500 transition-colors"
                            >
                                Apply & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
