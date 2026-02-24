"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { GearItem, SortConfig } from "@/data/types";
import {
    SCHOOL_COLORS,
    SCHOOL_EMOJI,
    RARITY_LABELS,
    RARITY_COLORS,
    TABLE_COLUMNS,
    isPercentageStat,
} from "@/lib/constants";

interface GearTableProps {
    items: GearItem[];
    sort: SortConfig | null;
    onSort: (key: string) => void;
}

const ROW_HEIGHT = 44;
const OVERSCAN = 10;

export function GearTable({ items, sort, onSort }: GearTableProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            setContainerHeight(entries[0].contentRect.height);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
        }
    }, []);

    const totalHeight = items.length * ROW_HEIGHT;
    const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endIdx = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN,
    );
    const visibleItems = items.slice(startIdx, endIdx);

    // Collect stat columns that actually appear in visible items (for dynamic columns)
    const topStats = getTopStats(items.slice(0, 1000));

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto rounded-lg border border-border bg-surface-900/50"
            style={{ maxHeight: "calc(100vh - 200px)" }}
        >
            <table className="w-full min-w-[800px] border-collapse">
                <thead className="sticky top-0 z-10 bg-surface-900">
                    <tr>
                        {TABLE_COLUMNS.map((col) => (
                            <th
                                key={col.key}
                                onClick={() => col.sortable && onSort(col.key)}
                                className={`border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/50 ${col.sortable ? "cursor-pointer select-none hover:text-foreground/80" : ""
                                    }`}
                            >
                                <span className="flex items-center gap-1">
                                    {col.label}
                                    {sort?.key === col.key && (
                                        <SortArrow direction={sort.direction} />
                                    )}
                                </span>
                            </th>
                        ))}
                        {topStats.map((stat) => (
                            <th
                                key={stat}
                                onClick={() => onSort(`stat:${stat}`)}
                                className="cursor-pointer select-none border-b border-border px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/50 hover:text-foreground/80"
                            >
                                <span className="flex items-center gap-1">
                                    {stat.replace(/([a-z])([A-Z])/g, "$1 $2")}
                                    {sort?.key === `stat:${stat}` && (
                                        <SortArrow direction={sort.direction} />
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Spacer for virtual scroll */}
                    {startIdx > 0 && (
                        <tr style={{ height: startIdx * ROW_HEIGHT }}>
                            <td colSpan={TABLE_COLUMNS.length + topStats.length} />
                        </tr>
                    )}

                    {visibleItems.map((item) => (
                        <tr
                            key={item.source_path}
                            className="border-b border-border/30 transition-colors hover:bg-surface-800/60"
                            style={{ height: ROW_HEIGHT }}
                        >
                            <td className="px-4 py-2">
                                <Link
                                    href={`/items/${encodeURIComponent(item.name)}`}
                                    className="text-sm font-medium text-foreground hover:text-accent-500 transition-colors"
                                >
                                    {item.display_name || item.name}
                                </Link>
                            </td>
                            <td className="px-4 py-2 text-sm text-foreground/60">
                                {item.item_type}
                            </td>
                            <td className="px-4 py-2">
                                {item.school && (
                                    <span
                                        className="text-sm"
                                        style={{ color: SCHOOL_COLORS[item.school] }}
                                    >
                                        {SCHOOL_EMOJI[item.school]} {item.school}
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2 text-sm text-foreground/60">
                                {item.level_req || "—"}
                            </td>
                            <td className="px-4 py-2">
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: RARITY_COLORS[item.rarity] }}
                                >
                                    {RARITY_LABELS[item.rarity] || "—"}
                                </span>
                            </td>
                            {topStats.map((stat) => (
                                <td key={stat} className="px-3 py-2 text-sm">
                                    {item.stats[stat] != null ? (
                                        <span
                                            className={
                                                isPercentageStat(stat)
                                                    ? "text-stat-percent"
                                                    : "text-stat-flat"
                                            }
                                        >
                                            {item.stats[stat]}
                                            {isPercentageStat(stat) ? "%" : ""}
                                        </span>
                                    ) : (
                                        <span className="text-foreground/15">—</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}

                    {/* Bottom spacer */}
                    {endIdx < items.length && (
                        <tr style={{ height: (items.length - endIdx) * ROW_HEIGHT }}>
                            <td colSpan={TABLE_COLUMNS.length + topStats.length} />
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function SortArrow({ direction }: { direction: "asc" | "desc" }) {
    return (
        <span className="text-accent-500">
            {direction === "asc" ? "▲" : "▼"}
        </span>
    );
}

/** Find the most common stats across items for dynamic columns */
function getTopStats(items: GearItem[]): string[] {
    const counts: Record<string, number> = {};
    for (const item of items) {
        for (const key of Object.keys(item.stats)) {
            counts[key] = (counts[key] || 0) + 1;
        }
    }
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([key]) => key);
}
