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

// Logic to group stats for the dropdown
function categorizeStats(stats: string[]) {
    const groups: Record<string, string[]> = {
        "Core Vitals": [],
        "Offense (Damage & Pierce)": [],
        "Offense (Crit)": [],
        "Defense (Resist & Block)": [],
        "Utility (Acc & Pip)": [],
        "Other": []
    };

    for (const stat of stats) {
        if (["MaxHealth", "MaxMana", "PowerPip", "Archmastery", "ShadowPipRating"].includes(stat)) {
            groups["Core Vitals"].push(stat);
        } else if (stat.includes("Damage") || stat.includes("ArmorPiercing")) {
            groups["Offense (Damage & Pierce)"].push(stat);
        } else if (stat.includes("CriticalHit")) {
            groups["Offense (Crit)"].push(stat);
        } else if (stat.includes("Resist") || stat.includes("Block") || stat.includes("ReduceDamage")) {
            groups["Defense (Resist & Block)"].push(stat);
        } else if (stat.includes("Accuracy") || stat.includes("PipConversion")) {
            groups["Utility (Acc & Pip)"].push(stat);
        } else {
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
    const containerRef = useRef<HTMLDivElement>(null);

    const groupedStats = useMemo(() => categorizeStats(availableStats), [availableStats]);
    const displayCount = activeColumns.length > 0 ? activeColumns.length : defaultStats.length;

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative z-20" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded border border-border bg-surface-800 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary-500 hover:text-primary-500"
            >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Customize Stats ({displayCount})
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[80vh] overflow-y-auto rounded border border-border bg-surface-900 p-3 shadow-xl shadow-black/50">
                    <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-2 flex items-center justify-between border-b border-border/50 bg-surface-900/95 px-3 py-3 backdrop-blur-sm">
                        <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                            Table Columns
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onSetColumns(defaultStats)}
                                className="text-xs text-primary-500 hover:text-primary-400"
                            >
                                Default
                            </button>
                            <span className="text-foreground/20">|</span>
                            <button
                                onClick={onClearColumns}
                                className="text-xs text-foreground/50 hover:text-foreground"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {groupedStats.map(([groupName, stats]) => (
                            <div key={groupName}>
                                <h5 className="mb-1.5 text-xs font-medium text-accent-500/80">
                                    {groupName}
                                </h5>
                                <div className="grid grid-cols-2 gap-1 rounded border border-border/30 bg-surface-800/30 p-1.5">
                                    {stats.map((stat) => {
                                        const isChecked = activeColumns.length > 0
                                            ? activeColumns.includes(stat)
                                            : defaultStats.includes(stat);
                                        return (
                                            <label
                                                key={stat}
                                                className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 hover:bg-surface-800"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        // If starting from default, we need to explicitly set all default stats first
                                                        if (activeColumns.length === 0 && !defaultStats.includes(stat)) {
                                                            onSetColumns([...defaultStats, stat]);
                                                        } else if (activeColumns.length === 0 && defaultStats.includes(stat)) {
                                                            onSetColumns(defaultStats.filter((s) => s !== stat));
                                                        } else {
                                                            onToggleColumn(stat);
                                                        }
                                                    }}
                                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border bg-surface-800 text-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-surface-900"
                                                />
                                                <span className="text-xs leading-none truncate pt-[1px] text-foreground/90">
                                                    {formatStatName(stat).replace("All ", "All ")}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
