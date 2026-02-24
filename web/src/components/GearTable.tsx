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
    onSort: (key: string) => void;
}

const HoverMarqueeLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => {
    const containerRef = useRef<HTMLAnchorElement>(null);
    const [isMarquee, setIsMarquee] = useState(false);

    const handleMouseEnter = () => {
        if (containerRef.current) {
            if (containerRef.current.scrollWidth > containerRef.current.clientWidth) {
                setIsMarquee(true);
            }
        }
    };

    return (
        <Link
            ref={containerRef}
            href={href}
            className={`${className || ""} ${isMarquee ? "hover-marquee hover-marquee-animated" : "truncate block"}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsMarquee(false)}
        >
            {children}
        </Link>
    );
};

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

    // Determine which columns are actively sorted to apply highlights
    const activeSortKeys = sorts.map(s => s.key);

    // Dynamically calculate left offsets for sticky columns
    const stickyPositions: Record<string, number> = {};
    let currentStickyLeft = 0;
    for (const col of TABLE_COLUMNS) {
        if (col.key === "display_name" || activeSortKeys.includes(col.key)) {
            stickyPositions[col.key] = currentStickyLeft;
            currentStickyLeft += col.width;
        }
    }

    const scrollToTop = () => {
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Calculate dynamic table width to prevent column squashing when many stats are selected
    const METADATA_WIDTH = 640; // Sum of fixed widths: 140 + 200 + 120 + 80 + 100
    const STAT_COLUMN_WIDTH = 120;
    const tableWidth = Math.max(1200, METADATA_WIDTH + displayStats.length * STAT_COLUMN_WIDTH);

    return (
        <div className="relative flex-1 min-h-0">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-auto rounded border border-border bg-surface-900/50"
                style={{ maxHeight: "calc(100vh - 200px)" }}
            >
                <table className="max-w-none min-w-max table-fixed border-collapse" style={{ width: tableWidth }}>
                    <thead className="sticky top-0 z-30 bg-surface-900">
                        <tr>
                            {TABLE_COLUMNS.map((col) => {
                                const sortInfo = getSortInfo(col.key);
                                const isSorted = activeSortKeys.includes(col.key);
                                const isSticky = col.key === "display_name" || isSorted;
                                const stickyStyle = isSticky ? { left: stickyPositions[col.key] } : undefined;

                                const headerBg = isSticky
                                    ? (isSorted ? "bg-transparent md:bg-[#262426] text-accent-400" : "bg-transparent md:bg-surface-900")
                                    : (isSorted ? "bg-accent-500/10 text-accent-400" : "");

                                const hoverBg = col.sortable
                                    ? (isSticky ? "md:hover:bg-[#162032] hover:text-foreground/80 cursor-pointer select-none" : "hover:bg-surface-800/50 hover:text-foreground/80 cursor-pointer select-none")
                                    : "";

                                const stickyClasses = isSticky ? "static md:sticky md:z-20 shadow-none md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] after:hidden md:after:absolute md:after:inset-y-0 md:after:right-0 md:after:w-[2px] md:after:bg-border/60" : "";
                                const widthClass = col.key === "display_name" ? "w-[200px]" : col.key === "item_type" ? "w-[140px]" : col.key === "school" ? "w-[120px]" : col.key === "level_req" ? "w-[80px]" : "w-[100px]";

                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable && onSort(col.key)}
                                        className={`border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/50 transition-colors ${hoverBg} ${headerBg} ${stickyClasses} ${widthClass}`}
                                        style={stickyStyle}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {col.label}
                                            {sortInfo && (
                                                <SortArrow direction={sortInfo.direction} isGroup2={false} />
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                            {displayStats.map((stat, i) => {
                                const sortKey = `stat:${stat}`;
                                const sortInfo = getSortInfo(sortKey);
                                const isSorted = activeSortKeys.includes(sortKey);
                                const isFirst = i === 0;
                                return (
                                    <th
                                        key={stat}
                                        onClick={() => onSort(sortKey)}
                                        className={`cursor-pointer select-none border-b border-border px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/50 transition-colors hover:bg-surface-800/50 hover:text-foreground/80 w-[120px] ${isSorted ? "bg-primary-500/10 text-primary-400" : ""
                                            } ${isFirst ? "border-l-2 border-border/60" : ""}`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {stat.replace(/([a-z])([A-Z])/g, "$1 $2")}
                                            {sortInfo && (
                                                <SortArrow direction={sortInfo.direction} isGroup2={true} />
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
                                className="group border-b border-border/30 transition-colors hover:bg-surface-800/60"
                                style={{ height: ROW_HEIGHT }}
                            >
                                {TABLE_COLUMNS.map((col) => {
                                    const isSorted = activeSortKeys.includes(col.key);
                                    const isSticky = col.key === "display_name" || isSorted;
                                    const stickyStyle = isSticky ? { left: stickyPositions[col.key] } : undefined;

                                    let bgClasses = "";
                                    if (isSticky) {
                                        if (isSorted) {
                                            bgClasses = "bg-transparent md:bg-[#1a1d28] md:group-hover:bg-[#232831]";
                                        } else {
                                            bgClasses = "bg-transparent md:bg-surface-900 md:group-hover:bg-[#182134]";
                                        }
                                    } else {
                                        bgClasses = isSorted ? "bg-accent-500/5" : "";
                                    }

                                    const stickyClasses = isSticky
                                        ? "static md:sticky md:z-10 shadow-none md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] after:hidden md:after:absolute md:after:inset-y-0 md:after:right-0 md:after:w-[2px] md:after:bg-border/60"
                                        : "";

                                    const cellClasses = `px-4 py-2 overflow-hidden transition-colors ${bgClasses} ${stickyClasses}`;

                                    if (col.key === "item_type") {
                                        return (
                                            <td key={col.key} className={cellClasses} style={stickyStyle}>
                                                <div className="truncate text-sm text-foreground/60">
                                                    {item.item_type}
                                                </div>
                                            </td>
                                        );
                                    }
                                    if (col.key === "display_name") {
                                        return (
                                            <td key={col.key} className={cellClasses} style={stickyStyle}>
                                                <HoverMarqueeLink
                                                    href={`/items/${encodeURIComponent(item.name)}${qs}`}
                                                    className="text-sm font-medium text-foreground hover:text-accent-500 transition-colors"
                                                >
                                                    {item.display_name || item.name}
                                                </HoverMarqueeLink>
                                            </td>
                                        );
                                    }
                                    if (col.key === "school") {
                                        return (
                                            <td key={col.key} className={cellClasses} style={stickyStyle}>
                                                {item.school && (
                                                    <span
                                                        className="text-sm"
                                                        style={{ color: SCHOOL_COLORS[item.school] }}
                                                    >
                                                        {SCHOOL_EMOJI[item.school]} {item.school}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    }
                                    if (col.key === "level_req") {
                                        return (
                                            <td key={col.key} className={`text-sm text-foreground/60 ${cellClasses}`} style={stickyStyle}>
                                                {item.level_req || "—"}
                                            </td>
                                        );
                                    }
                                    if (col.key === "rarity") {
                                        return (
                                            <td key={col.key} className={cellClasses} style={stickyStyle}>
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{ color: RARITY_COLORS[item.rarity] }}
                                                >
                                                    {RARITY_LABELS[item.rarity] || item.rarity || "—"}
                                                </span>
                                            </td>
                                        );
                                    }
                                    return null;
                                })}
                                {displayStats.map((stat, i) => (
                                    <td
                                        key={stat}
                                        className={`px-3 py-2 text-sm whitespace-nowrap transition-colors ${i === 0 ? "border-l-2 border-border/60" : ""
                                            } ${activeSortKeys.includes(`stat:${stat}`) ? "bg-primary-500/5" : ""}`}
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

function SortArrow({ direction, isGroup2 }: { direction: "asc" | "desc", isGroup2: boolean }) {
    const colorClass = isGroup2 ? "text-primary-500" : "text-accent-500";
    return (
        <span className={`flex items-center ml-0.5 ${colorClass}`}>
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
