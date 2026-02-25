"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { GearItem, SortConfig } from "@/data/types";
import { TABLE_COLUMNS } from "@/lib/constants";
import { TableColumnHeader } from "./table/TableColumnHeader";
import { TableCellMeta } from "./table/TableCellMeta";
import { TableCellStat } from "./table/TableCellStat";

interface GearTableProps {
    items: GearItem[];
    sorts: SortConfig[];
    activeStats: string[];
    defaultStats: string[];
    onSort: (key: string) => void;
    activeType?: string | null;
}



const ROW_HEIGHT = 44;
const OVERSCAN = 10;

export function GearTable({ items, sorts, activeStats, defaultStats, onSort, activeType }: GearTableProps) {
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
    const METADATA_WIDTH = 580; // Sum of fixed widths: 280 + 120 + 80 + 100
    const STAT_COLUMN_WIDTH = 120;
    const tableWidth = Math.max(1140, METADATA_WIDTH + displayStats.length * STAT_COLUMN_WIDTH);

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
                                const widthClass = col.key === "display_name" ? "w-[280px]" : col.key === "school" ? "w-[120px]" : col.key === "level_req" ? "w-[80px]" : "w-[100px]";

                                return (
                                    <TableColumnHeader
                                        key={col.key}
                                        colKey={col.key}
                                        label={col.label}
                                        widthClass={widthClass}
                                        sortable={col.sortable}
                                        isSorted={isSorted}
                                        sortDirection={sortInfo?.direction}
                                        isSticky={isSticky}
                                        stickyPosition={stickyPositions[col.key]}
                                        onSort={onSort}
                                    />
                                );
                            })}
                            {displayStats.map((stat, i) => {
                                const sortKey = `stat:${stat}`;
                                const sortInfo = getSortInfo(sortKey);
                                const isSorted = activeSortKeys.includes(sortKey);
                                const isFirst = i === 0;
                                return (
                                    <TableColumnHeader
                                        key={stat}
                                        colKey={sortKey}
                                        label={stat.replace(/([a-z])([A-Z])/g, "$1 $2")}
                                        widthClass={`w-[120px] ${isFirst ? "border-l-2 border-border/60" : ""}`}
                                        sortable={true}
                                        isSorted={isSorted}
                                        sortDirection={sortInfo?.direction}
                                        isSticky={false}
                                        isGroup2={true}
                                        onSort={onSort}
                                    />
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

                                    return (
                                        <TableCellMeta
                                            key={col.key}
                                            item={item}
                                            colKey={col.key}
                                            isSorted={isSorted}
                                            isSticky={isSticky}
                                            stickyStyle={stickyStyle}
                                            queryString={qs}
                                            showTypeSubtitle={!activeType}
                                        />
                                    );
                                })}
                                {displayStats.map((stat, i) => (
                                    <TableCellStat
                                        key={stat}
                                        item={item}
                                        stat={stat}
                                        isSorted={activeSortKeys.includes(`stat:${stat}`)}
                                        isFirst={i === 0}
                                    />
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
