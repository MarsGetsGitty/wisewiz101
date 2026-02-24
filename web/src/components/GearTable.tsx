"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
    sorts: SortConfig[];
    activeStats: string[];
    defaultStats: string[];
    onSort: (key: string, isMulti: boolean) => void;
}

const ROW_HEIGHT = 44;
const OVERSCAN = 10;

export function GearTable({ items, sorts, activeStats, defaultStats, onSort }: GearTableProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
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

    // Use user-selected columns, or the stable default columns from the full dataset
    const displayStats = activeStats.length > 0
        ? activeStats
        : defaultStats;

    // Helper to get sort info for a column
    const getSortInfo = (key: string) => {
        const index = sorts.findIndex(s => s.key === key);
        if (index === -1) return null;
        return { index, direction: sorts[index].direction };
    };

    const primarySortKey = sorts.length > 0 ? sorts[0].key : null;

    const scrollToTop = () => {
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="relative flex-1 min-h-0">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-auto rounded border border-border bg-surface-900/50"
                style={{ maxHeight: "calc(100vh - 200px)" }}
            >
                <table className="w-full min-w-[800px] border-collapse">
                    <thead className="sticky top-0 z-10 bg-surface-900">
                        <tr>
                            {TABLE_COLUMNS.map((col) => {
                                const sortInfo = getSortInfo(col.key);
                                const isPrimary = primarySortKey === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        onClick={(e) => col.sortable && onSort(col.key, e.shiftKey)}
                                        className={`border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/50 transition-colors ${col.sortable ? "cursor-pointer select-none hover:text-foreground/80 hover:bg-surface-800/50" : ""
                                            } ${isPrimary ? "bg-primary-500/10 text-primary-400" : ""}`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {col.label}
                                            {sortInfo && (
                                                <span className="flex items-center gap-0.5 text-primary-500">
                                                    <SortArrow direction={sortInfo.direction} />
                                                    {sorts.length > 1 && (
                                                        <span className="text-[10px] font-bold leading-none">{sortInfo.index + 1}</span>
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                            {displayStats.map((stat) => {
                                const sortKey = `stat:${stat}`;
                                const sortInfo = getSortInfo(sortKey);
                                const isPrimary = primarySortKey === sortKey;
                                return (
                                    <th
                                        key={stat}
                                        onClick={(e) => onSort(sortKey, e.shiftKey)}
                                        className={`cursor-pointer select-none border-b border-border px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/50 transition-colors hover:bg-surface-800/50 hover:text-foreground/80 ${isPrimary ? "bg-primary-500/10 text-primary-400" : ""
                                            }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {stat.replace(/([a-z])([A-Z])/g, "$1 $2")}
                                            {sortInfo && (
                                                <span className="flex items-center gap-0.5 text-primary-500">
                                                    <SortArrow direction={sortInfo.direction} />
                                                    {sorts.length > 1 && (
                                                        <span className="text-[10px] font-bold leading-none">{sortInfo.index + 1}</span>
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Spacer for virtual scroll */}
                        {startIdx > 0 && (
                            <tr style={{ height: startIdx * ROW_HEIGHT }}>
                                <td colSpan={TABLE_COLUMNS.length + displayStats.length} />
                            </tr>
                        )}

                        {visibleItems.map((item) => (
                            <tr
                                key={item.source_path}
                                className="border-b border-border/30 transition-colors hover:bg-surface-800/60"
                                style={{ height: ROW_HEIGHT }}
                            >
                                <td className={`px-4 py-2 ${primarySortKey === "display_name" ? "bg-primary-500/5" : ""}`}>
                                    <Link
                                        href={`/items/${encodeURIComponent(item.name)}${qs}`}
                                        className="text-sm font-medium text-foreground hover:text-accent-500 transition-colors"
                                    >
                                        {item.display_name || item.name}
                                    </Link>
                                </td>
                                <td className={`px-4 py-2 text-sm text-foreground/60 ${primarySortKey === "item_type" ? "bg-primary-500/5" : ""}`}>
                                    {item.item_type}
                                </td>
                                <td className={`px-4 py-2 ${primarySortKey === "school" ? "bg-primary-500/5" : ""}`}>
                                    {item.school && (
                                        <span
                                            className="text-sm"
                                            style={{ color: SCHOOL_COLORS[item.school] }}
                                        >
                                            {SCHOOL_EMOJI[item.school]} {item.school}
                                        </span>
                                    )}
                                </td>
                                <td className={`px-4 py-2 text-sm text-foreground/60 ${primarySortKey === "level_req" ? "bg-primary-500/5" : ""}`}>
                                    {item.level_req || "—"}
                                </td>
                                <td className={`px-4 py-2 ${primarySortKey === "rarity" ? "bg-primary-500/5" : ""}`}>
                                    <span
                                        className="text-xs font-medium"
                                        style={{ color: RARITY_COLORS[item.rarity] }}
                                    >
                                        {RARITY_LABELS[item.rarity] || "—"}
                                    </span>
                                </td>
                                {displayStats.map((stat) => (
                                    <td
                                        key={stat}
                                        className={`px-3 py-2 text-sm ${primarySortKey === `stat:${stat}` ? "bg-primary-500/5" : ""}`}
                                    >
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
                                <td colSpan={TABLE_COLUMNS.length + displayStats.length} />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Scroll-to-Top FAB */}
            <button
                onClick={scrollToTop}
                className={`absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900 ${scrollTop > 300 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
                    }`}
                aria-label="Scroll to top"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m18 15-6-6-6 6" />
                </svg>
            </button>
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
