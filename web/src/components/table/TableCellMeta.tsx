import { GearItem } from "@/data/types";
import { SCHOOL_COLORS, SCHOOL_EMOJI, RARITY_LABELS, RARITY_COLORS } from "@/lib/constants";
import { HoverMarqueeLink } from "./HoverMarqueeLink";

interface TableCellMetaProps {
    item: GearItem;
    colKey: string;
    isSorted: boolean;
    isSticky: boolean;
    stickyStyle?: React.CSSProperties;
    queryString: string;
    showTypeSubtitle?: boolean;
}

export const TableCellMeta = ({
    item,
    colKey,
    isSorted,
    isSticky,
    stickyStyle,
    queryString,
    showTypeSubtitle,
}: TableCellMetaProps) => {
    // Mobile fallback fix: ensuring we use bg-accent-500/5 on mobile for sorted headers,
    // and explicitly translating onto hex strictly on md+ breakpoints when sticky.
    let bgClasses = "";
    if (isSticky) {
        if (isSorted) {
            bgClasses = "bg-accent-500/5 md:bg-[#1a1d28] md:group-hover:bg-[#232831]";
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

    if (colKey === "display_name") {
        return (
            <td className={cellClasses} style={stickyStyle}>
                <div className="flex flex-col justify-center min-w-0 w-full">
                    <HoverMarqueeLink
                        href={`/items/${encodeURIComponent(item.name)}${queryString}`}
                        className="text-sm font-medium text-foreground hover:text-accent-500 transition-colors"
                    >
                        {item.display_name || item.name}
                    </HoverMarqueeLink>
                    {showTypeSubtitle && (
                        <span className="text-[10px] uppercase tracking-wider text-foreground/40 font-semibold mt-0.5">
                            {item.item_type || "Unknown"}
                        </span>
                    )}
                </div>
            </td>
        );
    }
    if (colKey === "school") {
        const displaySchool = item.school || "Any";
        return (
            <td className={cellClasses} style={stickyStyle}>
                <span className="text-sm" style={{ color: SCHOOL_COLORS[displaySchool] || "#9ca3af" }}>
                    {SCHOOL_EMOJI[displaySchool] ? `${SCHOOL_EMOJI[displaySchool]} ` : ""}{displaySchool}
                </span>
            </td>
        );
    }
    if (colKey === "level_req") {
        return (
            <td className={`text-sm text-foreground/60 ${cellClasses}`} style={stickyStyle}>
                {item.level_req || "—"}
            </td>
        );
    }
    if (colKey === "rarity") {
        return (
            <td className={cellClasses} style={stickyStyle}>
                <span className="text-xs font-medium" style={{ color: RARITY_COLORS[item.rarity] || "#ffffff" }}>
                    {RARITY_LABELS[item.rarity] || item.rarity || "—"}
                </span>
            </td>
        );
    }
    return null;
};
