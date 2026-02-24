import { GearItem } from "@/data/types";
import { isPercentageStat } from "@/lib/constants";

interface TableCellStatProps {
    item: GearItem;
    stat: string;
    isSorted: boolean;
    isFirst: boolean;
}

export const TableCellStat = ({ item, stat, isSorted, isFirst }: TableCellStatProps) => {
    return (
        <td
            className={`px-3 py-2 text-sm whitespace-nowrap transition-colors ${isFirst ? "border-l-2 border-border/60" : ""
                } ${isSorted ? "bg-primary-500/5 text-primary-400" : ""}`}
        >
            {item.stats[stat] != null ? (
                <span className={isPercentageStat(stat) ? "text-stat-percent" : "text-stat-flat"}>
                    {item.stats[stat]}
                    {isPercentageStat(stat) ? "%" : ""}
                </span>
            ) : (
                <span className="text-foreground/15">—</span>
            )}
        </td>
    );
};
