import { SortArrow } from "@/components/SortArrow";

interface TableColumnHeaderProps {
    colKey: string;
    label: string;
    widthClass: string;
    sortable: boolean;
    isSorted: boolean;
    sortDirection?: "asc" | "desc";
    isSticky: boolean;
    stickyPosition?: number;
    isGroup2?: boolean;
    onSort: (key: string) => void;
}

export const TableColumnHeader = ({
    colKey,
    label,
    widthClass,
    sortable,
    isSorted,
    sortDirection,
    isSticky,
    stickyPosition,
    isGroup2,
    onSort,
}: TableColumnHeaderProps) => {
    const stickyStyle = isSticky && stickyPosition !== undefined ? { left: stickyPosition } : undefined;

    // Fix for mobile sorted sticky headers losing the gold tint:
    // We apply bg-accent-500/10 by default (which applies to mobile too),
    // then overwrite it on md+ if it's sticky so the hex translates.
    const headerBg = isSticky
        ? (isSorted ? "bg-accent-500/10 md:bg-[#262426] text-accent-400" : "bg-transparent md:bg-surface-900")
        : (isSorted ? "bg-accent-500/10 text-accent-400" : "");

    const hoverBg = sortable
        ? (isSticky ? "md:hover:bg-[#162032] hover:text-foreground/80 cursor-pointer select-none" : "hover:bg-surface-800/50 hover:text-foreground/80 cursor-pointer select-none")
        : "";

    const stickyClasses = isSticky ? "static md:sticky md:z-20 shadow-none md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] after:hidden md:after:absolute md:after:inset-y-0 md:after:right-0 md:after:w-[2px] md:after:bg-border/60" : "";

    return (
        <th
            onClick={() => sortable && onSort(colKey)}
            className={`border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/50 transition-colors ${hoverBg} ${headerBg} ${stickyClasses} ${widthClass}`}
            style={stickyStyle}
        >
            <span className="flex items-center gap-1.5">
                {label}
                {sortDirection && (
                    <SortArrow direction={sortDirection} isGroup2={!!isGroup2} />
                )}
            </span>
        </th>
    );
};
